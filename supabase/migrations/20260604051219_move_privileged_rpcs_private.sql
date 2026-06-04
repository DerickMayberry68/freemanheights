-- Move privileged RPC bodies out of the exposed public schema.

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.approve_admin_user(p_approval_id uuid, p_role text DEFAULT 'editor')
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

  SELECT user_id INTO v_user_id
  FROM public.admin_approvals
  WHERE id = p_approval_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Approval request not found.';
  END IF;

  SELECT email_confirmed_at INTO v_email_confirmed_at
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

CREATE OR REPLACE FUNCTION private.ensure_approval_exists(p_user_id uuid, p_email text)
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

CREATE OR REPLACE FUNCTION private.get_admin_approvals()
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

CREATE OR REPLACE FUNCTION private.get_admin_users(p_status text DEFAULT 'all')
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

CREATE OR REPLACE FUNCTION private.set_admin_user_role(p_approval_id uuid, p_role text)
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

  SELECT role INTO v_current_role
  FROM public.admin_approvals
  WHERE id = p_approval_id
    AND approved = true;

  IF v_current_role IS NULL THEN
    RAISE EXCEPTION 'Approved user not found.';
  END IF;

  IF v_current_role = 'admin' AND p_role <> 'admin' THEN
    SELECT count(*) INTO v_admin_count
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

CREATE OR REPLACE FUNCTION private.upsert_admin_user_profile(
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
    SET full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        title = EXCLUDED.title,
        notes = EXCLUDED.notes,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION private.generate_series_occurrences(
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

  SELECT * INTO v_series
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
      SELECT 1 FROM public.events
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

CREATE OR REPLACE FUNCTION private.refresh_all_series()
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
    v_total := v_total + private.generate_series_occurrences(v_id, v_window_end);
  END LOOP;

  PERFORM public.cleanup_generated_events();
  RETURN v_total;
END;
$$;

REVOKE ALL ON FUNCTION private.approve_admin_user(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.ensure_approval_exists(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.get_admin_approvals() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.get_admin_users(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.set_admin_user_role(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.upsert_admin_user_profile(uuid, text, text, text, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.generate_series_occurrences(uuid, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.refresh_all_series() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.approve_admin_user(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.ensure_approval_exists(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.get_admin_approvals() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.get_admin_users(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.set_admin_user_role(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.upsert_admin_user_profile(uuid, text, text, text, text, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.generate_series_occurrences(uuid, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.refresh_all_series() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.approve_admin_user(p_approval_id uuid, p_role text DEFAULT 'editor')
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.approve_admin_user(p_approval_id, p_role);
$$;

CREATE OR REPLACE FUNCTION public.ensure_approval_exists(p_user_id uuid, p_email text)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.ensure_approval_exists(p_user_id, p_email);
$$;

CREATE OR REPLACE FUNCTION public.get_admin_approvals()
RETURNS SETOF public.admin_approvals
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
STABLE
AS $$
  SELECT * FROM private.get_admin_approvals();
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
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT * FROM private.get_admin_users(p_status);
$$;

CREATE OR REPLACE FUNCTION public.set_admin_user_role(p_approval_id uuid, p_role text)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.set_admin_user_role(p_approval_id, p_role);
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
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.upsert_admin_user_profile(
    p_user_id,
    p_full_name,
    p_phone,
    p_title,
    p_notes,
    p_is_active
  );
$$;

CREATE OR REPLACE FUNCTION public.generate_series_occurrences(
  p_series_id uuid,
  p_window_end date DEFAULT (CURRENT_DATE + INTERVAL '90 days')
)
RETURNS integer
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.generate_series_occurrences(p_series_id, p_window_end);
$$;

CREATE OR REPLACE FUNCTION public.refresh_all_series()
RETURNS integer
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.refresh_all_series();
$$;

REVOKE ALL ON FUNCTION public.approve_admin_user(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_approval_exists(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_admin_approvals() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_admin_users(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_admin_user_role(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.upsert_admin_user_profile(uuid, text, text, text, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_series_occurrences(uuid, date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_all_series() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.approve_admin_user(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_approval_exists(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_approvals() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_users(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_admin_user_role(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_admin_user_profile(uuid, text, text, text, text, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_series_occurrences(uuid, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.refresh_all_series() TO authenticated, service_role;
