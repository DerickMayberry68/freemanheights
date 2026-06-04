-- Harden exposed RPCs, admin helper policies, storage listing, and future grants.

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

-- Private admin helpers used by RLS and security-definer RPCs. Keeping these
-- out of the exposed public schema prevents direct RPC calls against them.
CREATE OR REPLACE FUNCTION private.is_approved_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_approvals
    WHERE user_id = auth.uid()
      AND approved = true
  );
$$;

CREATE OR REPLACE FUNCTION private.has_admin_role(required_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_approvals
    WHERE user_id = auth.uid()
      AND approved = true
      AND CASE
        WHEN required_role = 'viewer' THEN role IN ('viewer', 'editor', 'admin')
        WHEN required_role = 'editor' THEN role IN ('editor', 'admin')
        WHEN required_role = 'admin' THEN role = 'admin'
        ELSE false
      END
  );
$$;

REVOKE ALL ON FUNCTION private.is_approved_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.has_admin_role(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_approved_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_admin_role(text) TO authenticated;

-- Re-point existing public RLS policies at private helper functions.
DO $$
DECLARE
  r record;
  v_qual text;
  v_check text;
  v_roles text;
  v_sql text;
BEGIN
  FOR r IN
    SELECT *
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        COALESCE(qual, '') ~ '(^|[^.])has_admin_role\('
        OR COALESCE(qual, '') LIKE '%public.has_admin_role%'
        OR COALESCE(qual, '') ~ '(^|[^.])is_approved_admin\('
        OR COALESCE(qual, '') LIKE '%public.is_approved_admin%'
        OR COALESCE(with_check, '') ~ '(^|[^.])has_admin_role\('
        OR COALESCE(with_check, '') LIKE '%public.has_admin_role%'
        OR COALESCE(with_check, '') ~ '(^|[^.])is_approved_admin\('
        OR COALESCE(with_check, '') LIKE '%public.is_approved_admin%'
      )
  LOOP
    v_qual := r.qual;
    v_check := r.with_check;

    IF v_qual IS NOT NULL THEN
      v_qual := regexp_replace(v_qual, '(^|[^.])has_admin_role\(', '\1private.has_admin_role(', 'g');
      v_qual := regexp_replace(v_qual, '(^|[^.])is_approved_admin\(', '\1private.is_approved_admin(', 'g');
      v_qual := replace(v_qual, 'public.has_admin_role', 'private.has_admin_role');
      v_qual := replace(v_qual, 'public.is_approved_admin', 'private.is_approved_admin');
    END IF;

    IF v_check IS NOT NULL THEN
      v_check := regexp_replace(v_check, '(^|[^.])has_admin_role\(', '\1private.has_admin_role(', 'g');
      v_check := regexp_replace(v_check, '(^|[^.])is_approved_admin\(', '\1private.is_approved_admin(', 'g');
      v_check := replace(v_check, 'public.has_admin_role', 'private.has_admin_role');
      v_check := replace(v_check, 'public.is_approved_admin', 'private.is_approved_admin');
    END IF;

    v_roles := array_to_string(ARRAY(SELECT quote_ident(role_name) FROM unnest(r.roles) AS role_name), ', ');

    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);

    v_sql := format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s',
      r.policyname,
      r.schemaname,
      r.tablename,
      r.permissive,
      r.cmd,
      v_roles
    );

    IF v_qual IS NOT NULL AND r.cmd <> 'INSERT' THEN
      v_sql := v_sql || format(' USING (%s)', v_qual);
    END IF;

    IF v_check IS NOT NULL AND r.cmd NOT IN ('SELECT', 'DELETE') THEN
      v_sql := v_sql || format(' WITH CHECK (%s)', v_check);
    END IF;

    EXECUTE v_sql;
  END LOOP;
END;
$$;

-- Transport private helpers should also use the private admin helper.
CREATE OR REPLACE FUNCTION private.transport_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT COALESCE(private.has_admin_role('editor'), false);
$$;

REVOKE ALL ON FUNCTION private.transport_is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.transport_is_admin() TO authenticated;

-- Public helper functions remain for compatibility but are no longer directly
-- callable by client roles.
CREATE OR REPLACE FUNCTION public.is_approved_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.is_approved_admin();
$$;

CREATE OR REPLACE FUNCTION public.has_admin_role(required_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT private.has_admin_role(required_role);
$$;

REVOKE ALL ON FUNCTION public.is_approved_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_admin_role(text) FROM PUBLIC, anon, authenticated;

-- App-facing RPCs. Anon/public execute is removed unless the public form needs it.
CREATE OR REPLACE FUNCTION public.get_my_approval()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((
    SELECT approved
    FROM public.admin_approvals
    WHERE user_id = auth.uid()
    LIMIT 1
  ), false);
$$;

CREATE OR REPLACE FUNCTION public.get_my_admin_role()
RETURNS text
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
STABLE
AS $$
  SELECT role
  FROM public.admin_approvals
  WHERE user_id = auth.uid()
    AND approved = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_preferences()
RETURNS public.user_preferences
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  prefs public.user_preferences;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT *
  INTO prefs
  FROM public.user_preferences
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    INSERT INTO public.user_preferences (user_id)
    VALUES (auth.uid())
    RETURNING * INTO prefs;
  END IF;

  RETURN prefs;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_prayer_request_recipients()
RETURNS TABLE (
  staff_id uuid,
  display_name text,
  title text
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    s.id AS staff_id,
    s.name AS display_name,
    NULLIF(TRIM(s.role), '') AS title
  FROM public.staff s
  WHERE s.is_active = true
  ORDER BY
    s.display_order NULLS LAST,
    s.name;
$$;

CREATE OR REPLACE FUNCTION public.ensure_approval_exists(p_user_id uuid, p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN;
  END IF;

  INSERT INTO public.admin_approvals (user_id, email)
  VALUES (p_user_id, p_email)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_admin_user(p_approval_id uuid, p_role text DEFAULT 'editor')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_user_id uuid;
  v_email_confirmed_at timestamptz;
BEGIN
  IF NOT private.is_approved_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_role NOT IN ('admin', 'editor', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be admin, editor, or viewer', p_role;
  END IF;

  SELECT user_id
  INTO v_user_id
  FROM public.admin_approvals
  WHERE id = p_approval_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Approval request not found.';
  END IF;

  SELECT email_confirmed_at
  INTO v_email_confirmed_at
  FROM auth.users
  WHERE id = v_user_id;

  IF v_email_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'User must verify their email before they can be approved.';
  END IF;

  UPDATE public.admin_approvals
  SET approved = true,
      approved_at = NOW(),
      approved_by = auth.uid(),
      role = p_role
  WHERE id = p_approval_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_approvals()
RETURNS SETOF public.admin_approvals
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, private
STABLE
AS $$
  SELECT *
  FROM public.admin_approvals
  WHERE private.is_approved_admin()
  ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_users(p_status text DEFAULT 'all')
RETURNS TABLE (
  approval_id uuid,
  user_id uuid,
  email text,
  role text,
  created_at timestamptz,
  approved_at timestamptz,
  is_active boolean,
  full_name text,
  phone text,
  title text,
  notes text,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF NOT private.has_admin_role('admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_status NOT IN ('all', 'active', 'inactive') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be all, active, or inactive', p_status;
  END IF;

  RETURN QUERY
  SELECT
    a.id AS approval_id,
    a.user_id,
    a.email,
    a.role,
    a.created_at,
    a.approved_at,
    COALESCE(p.is_active, true) AS is_active,
    p.full_name,
    p.phone,
    p.title,
    p.notes,
    u.email_confirmed_at,
    u.last_sign_in_at
  FROM public.admin_approvals a
  LEFT JOIN public.admin_user_profiles p ON p.user_id = a.user_id
  LEFT JOIN auth.users u ON u.id = a.user_id
  WHERE a.approved = true
    AND (
      p_status = 'all'
      OR (p_status = 'active' AND COALESCE(p.is_active, true) = true)
      OR (p_status = 'inactive' AND COALESCE(p.is_active, true) = false)
    )
  ORDER BY a.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_admin_user_role(p_approval_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_current_role text;
  v_admin_count integer;
BEGIN
  IF NOT private.has_admin_role('admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_role NOT IN ('admin', 'editor', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be admin, editor, or viewer', p_role;
  END IF;

  SELECT role
  INTO v_current_role
  FROM public.admin_approvals
  WHERE id = p_approval_id
    AND approved = true;

  IF v_current_role IS NULL THEN
    RAISE EXCEPTION 'Approved user not found.';
  END IF;

  IF v_current_role = 'admin' AND p_role <> 'admin' THEN
    SELECT count(*)
    INTO v_admin_count
    FROM public.admin_approvals
    WHERE approved = true
      AND role = 'admin';

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot change role. At least one admin user is required.';
    END IF;
  END IF;

  UPDATE public.admin_approvals
  SET role = p_role
  WHERE id = p_approval_id
    AND approved = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_admin_user_profile(
  p_user_id uuid,
  p_full_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_title text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_is_active boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF NOT private.has_admin_role('admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.admin_approvals a
    WHERE a.user_id = p_user_id
      AND a.approved = true
  ) THEN
    RAISE EXCEPTION 'Approved user not found.';
  END IF;

  INSERT INTO public.admin_user_profiles (
    user_id,
    full_name,
    phone,
    title,
    notes,
    is_active,
    updated_at
  )
  VALUES (
    p_user_id,
    NULLIF(TRIM(p_full_name), ''),
    NULLIF(TRIM(p_phone), ''),
    NULLIF(TRIM(p_title), ''),
    NULLIF(TRIM(p_notes), ''),
    COALESCE(p_is_active, true),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
    SET
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      title = EXCLUDED.title,
      notes = EXCLUDED.notes,
      is_active = EXCLUDED.is_active,
      updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_series_occurrences(
  p_series_id uuid,
  p_window_end date DEFAULT (CURRENT_DATE + INTERVAL '90 days')
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_series public.event_series%ROWTYPE;
  v_tz text;
  v_date date;
  v_end date;
  v_evt_start timestamptz;
  v_evt_end timestamptz;
  v_count integer := 0;
  v_next date;
  v_dow_diff integer;
  v_days_in_mo integer;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT private.has_admin_role('editor') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT *
  INTO v_series
  FROM public.event_series
  WHERE id = p_series_id
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  SELECT value INTO v_tz FROM public.site_settings WHERE key = 'church_timezone';
  v_tz := COALESCE(v_tz, 'America/Chicago');

  v_end := LEAST(p_window_end, COALESCE(v_series.series_end, p_window_end));
  v_date := GREATEST(v_series.series_start, CURRENT_DATE);

  IF v_series.recurrence_type IN ('weekly', 'biweekly') THEN
    v_dow_diff := (v_series.day_of_week - EXTRACT(DOW FROM v_date)::integer + 7) % 7;
    v_date := v_date + v_dow_diff;
  ELSIF v_series.recurrence_type = 'monthly' THEN
    v_days_in_mo := EXTRACT(DAY FROM (DATE_TRUNC('month', v_date) + INTERVAL '1 month' - INTERVAL '1 day'))::integer;
    v_date := DATE_TRUNC('month', v_date)::date + (LEAST(v_series.month_day, v_days_in_mo) - 1);

    IF v_date < CURRENT_DATE THEN
      v_next := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::date;
      v_days_in_mo := EXTRACT(DAY FROM (v_next + INTERVAL '1 month' - INTERVAL '1 day'))::integer;
      v_date := v_next + (LEAST(v_series.month_day, v_days_in_mo) - 1);
    END IF;
  END IF;

  WHILE v_date <= v_end LOOP
    v_evt_start := (v_date::text || ' ' || v_series.start_time::text)::timestamp AT TIME ZONE v_tz;
    v_evt_end := CASE
      WHEN v_series.end_time IS NOT NULL THEN (v_date::text || ' ' || v_series.end_time::text)::timestamp AT TIME ZONE v_tz
      ELSE NULL
    END;

    IF NOT EXISTS (
      SELECT 1
      FROM public.events
      WHERE series_id = p_series_id
        AND event_date = v_evt_start
    ) THEN
      INSERT INTO public.events (
        series_id, title, description, event_date, end_date,
        location, image_url, is_featured, is_cancelled, is_overridden
      )
      VALUES (
        p_series_id, v_series.title, v_series.description,
        v_evt_start, v_evt_end,
        v_series.location, v_series.image_url, v_series.is_featured,
        false, false
      );
    END IF;

    v_count := v_count + 1;

    IF v_series.recurrence_type = 'weekly' THEN
      v_date := v_date + 7;
    ELSIF v_series.recurrence_type = 'biweekly' THEN
      v_date := v_date + 14;
    ELSIF v_series.recurrence_type = 'monthly' THEN
      v_next := (DATE_TRUNC('month', v_date) + INTERVAL '1 month')::date;
      v_days_in_mo := EXTRACT(DAY FROM (v_next + INTERVAL '1 month' - INTERVAL '1 day'))::integer;
      v_date := v_next + (LEAST(v_series.month_day, v_days_in_mo) - 1);
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_generated_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  DELETE FROM public.events
  WHERE series_id IS NOT NULL
    AND is_overridden = false
    AND is_cancelled = false
    AND event_date < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_all_series()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_window_days integer;
  v_window_end date;
  v_id uuid;
  v_total integer := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT private.has_admin_role('editor') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT value::integer INTO v_window_days
  FROM public.site_settings
  WHERE key = 'recurring_window_days';

  v_window_days := COALESCE(v_window_days, 90);
  v_window_end := CURRENT_DATE + (v_window_days || ' days')::interval;

  FOR v_id IN SELECT id FROM public.event_series WHERE is_active = true LOOP
    v_total := v_total + public.generate_series_occurrences(v_id, v_window_end);
  END LOOP;

  PERFORM public.cleanup_generated_events();
  RETURN v_total;
END;
$$;

-- Trigger functions are internal only.
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.admin_approvals_first_approved() SET search_path = public;

-- Timestamp/helper functions: pin search_path to prevent mutable path issues.
ALTER FUNCTION public.update_ai_favorites_updated_at() SET search_path = public;
ALTER FUNCTION public.update_prayer_request_updated_at() SET search_path = public;
ALTER FUNCTION public.get_age_from_birthday(date) SET search_path = public;
ALTER FUNCTION public.get_generation(date) SET search_path = public;
ALTER FUNCTION public.update_user_preferences_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at() SET search_path = public;
ALTER FUNCTION public.update_bible_translations_updated_at() SET search_path = public;

-- Remove broad default grants from current functions, then explicitly restore
-- only what the app needs.
REVOKE ALL ON FUNCTION public.admin_approvals_first_approved() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.approve_admin_user(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_generated_events() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_approval_exists(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_series_occurrences(uuid, date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_admin_approvals() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_admin_users(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_my_admin_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_my_approval() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_prayer_request_recipients() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_user_preferences() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_all_series() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_admin_user_role(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.upsert_admin_user_profile(uuid, text, text, text, text, boolean) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.approve_admin_user(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_approval_exists(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_series_occurrences(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_approvals() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_admin_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_approval() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_prayer_request_recipients() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_preferences() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_all_series() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_admin_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_admin_user_profile(uuid, text, text, text, text, boolean) TO authenticated;

-- Fix broad view grants introduced by default privileges.
REVOKE ALL ON TABLE public.prayer_requests_admin_view FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.prayer_requests_admin_view TO authenticated;

-- Add real policies to admin_user_profiles so RLS has explicit behavior.
DROP POLICY IF EXISTS "admin_user_profiles_admin_read" ON public.admin_user_profiles;
DROP POLICY IF EXISTS "admin_user_profiles_admin_manage" ON public.admin_user_profiles;

CREATE POLICY "admin_user_profiles_admin_read"
  ON public.admin_user_profiles FOR SELECT TO authenticated
  USING (private.has_admin_role('admin'));

CREATE POLICY "admin_user_profiles_admin_manage"
  ON public.admin_user_profiles FOR ALL TO authenticated
  USING (private.has_admin_role('admin'))
  WITH CHECK (private.has_admin_role('admin'));

-- Public prayer requests remain submit-able, but the inserted row is constrained.
DROP POLICY IF EXISTS "Allow public insert" ON public.prayer_requests;
DROP POLICY IF EXISTS "prayer_requests_public_insert" ON public.prayer_requests;

CREATE POLICY "prayer_requests_public_insert"
  ON public.prayer_requests FOR INSERT TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL
    AND length(TRIM(name)) BETWEEN 1 AND 200
    AND request IS NOT NULL
    AND length(TRIM(request)) BETWEEN 1 AND 5000
    AND (email IS NULL OR length(TRIM(email)) <= 320)
    AND (phone IS NULL OR length(TRIM(phone)) <= 50)
    AND COALESCE(is_answered, false) = false
    AND responded_at IS NULL
    AND responded_by IS NULL
    AND response_method IS NULL
    AND response_notes IS NULL
    AND admin_notes IS NULL
  );

-- The recordings bucket is public, so object URLs remain accessible. This
-- removes anonymous table listing through storage.objects.
DROP POLICY IF EXISTS "Public read recordings bucket" ON storage.objects;

-- Future objects should not inherit broad API grants by default.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES FROM anon, authenticated;
