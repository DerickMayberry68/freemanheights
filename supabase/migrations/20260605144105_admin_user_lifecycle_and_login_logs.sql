-- Enforce active admin accounts and add admin login audit history.

CREATE TABLE public.admin_login_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  logged_in_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text
);

CREATE INDEX admin_login_logs_logged_in_at_idx
  ON public.admin_login_logs (logged_in_at DESC);

CREATE INDEX admin_login_logs_user_id_idx
  ON public.admin_login_logs (user_id, logged_in_at DESC);

ALTER TABLE public.admin_login_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.admin_login_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.admin_login_logs TO service_role;

CREATE POLICY "admin_login_logs_admin_read"
  ON public.admin_login_logs
  FOR SELECT
  TO authenticated
  USING (private.has_admin_role('admin'));

-- An inactive profile must fail every existing policy and privileged RPC that
-- depends on these shared helpers.
CREATE OR REPLACE FUNCTION private.is_approved_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_approvals a
    LEFT JOIN public.admin_user_profiles p ON p.user_id = a.user_id
    WHERE a.user_id = auth.uid()
      AND a.approved = true
      AND COALESCE(p.is_active, true) = true
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
    FROM public.admin_approvals a
    LEFT JOIN public.admin_user_profiles p ON p.user_id = a.user_id
    WHERE a.user_id = auth.uid()
      AND a.approved = true
      AND COALESCE(p.is_active, true) = true
      AND CASE
        WHEN required_role = 'viewer' THEN a.role IN ('viewer', 'editor', 'admin')
        WHEN required_role = 'editor' THEN a.role IN ('editor', 'admin')
        WHEN required_role = 'admin' THEN a.role = 'admin'
        ELSE false
      END
  );
$$;

CREATE OR REPLACE FUNCTION public.get_my_approval()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((
    SELECT a.approved AND COALESCE(p.is_active, true)
    FROM public.admin_approvals a
    LEFT JOIN public.admin_user_profiles p ON p.user_id = a.user_id
    WHERE a.user_id = auth.uid()
    LIMIT 1
  ), false);
$$;

CREATE OR REPLACE FUNCTION private.set_admin_user_active(
  p_user_id uuid,
  p_is_active boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_target_role text;
  v_active_admin_count integer;
BEGIN
  IF NOT private.has_admin_role('admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_user_id = auth.uid() AND NOT p_is_active THEN
    RAISE EXCEPTION 'You cannot deactivate your own account.';
  END IF;

  SELECT role
  INTO v_target_role
  FROM public.admin_approvals
  WHERE user_id = p_user_id
    AND approved = true;

  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'Approved user not found.';
  END IF;

  IF v_target_role = 'admin' AND NOT p_is_active THEN
    SELECT count(*)
    INTO v_active_admin_count
    FROM public.admin_approvals a
    LEFT JOIN public.admin_user_profiles p ON p.user_id = a.user_id
    WHERE a.approved = true
      AND a.role = 'admin'
      AND COALESCE(p.is_active, true) = true;

    IF v_active_admin_count <= 1 THEN
      RAISE EXCEPTION 'You cannot deactivate the last active administrator.';
    END IF;
  END IF;

  INSERT INTO public.admin_user_profiles (user_id, is_active, updated_at)
  VALUES (p_user_id, p_is_active, now())
  ON CONFLICT (user_id) DO UPDATE
  SET is_active = EXCLUDED.is_active,
      updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.set_admin_user_active(
  p_user_id uuid,
  p_is_active boolean
)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.set_admin_user_active(p_user_id, p_is_active);
$$;

CREATE OR REPLACE FUNCTION private.get_admin_login_logs(p_limit integer DEFAULT 100)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  logged_in_at timestamptz,
  ip_address text,
  user_agent text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF NOT private.has_admin_role('admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    l.id,
    l.user_id,
    l.email,
    l.logged_in_at,
    host(l.ip_address),
    l.user_agent
  FROM public.admin_login_logs l
  ORDER BY l.logged_in_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_login_logs(p_limit integer DEFAULT 100)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  logged_in_at timestamptz,
  ip_address text,
  user_agent text
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT * FROM private.get_admin_login_logs(p_limit);
$$;

REVOKE ALL ON FUNCTION private.set_admin_user_active(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.get_admin_login_logs(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.set_admin_user_active(uuid, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.get_admin_login_logs(integer) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.set_admin_user_active(uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_admin_login_logs(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_admin_user_active(uuid, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_login_logs(integer) TO authenticated, service_role;

-- Preserve historical content while allowing Auth users to be removed.
ALTER TABLE public.admin_approvals
  DROP CONSTRAINT IF EXISTS admin_approvals_approved_by_fkey,
  ADD CONSTRAINT admin_approvals_approved_by_fkey
    FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.check_ins
  ADD COLUMN performed_by_email text;

UPDATE public.check_ins c
SET performed_by_email = u.email
FROM auth.users u
WHERE u.id = c.performed_by;

ALTER TABLE public.check_ins
  ALTER COLUMN performed_by DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS check_ins_performed_by_fkey,
  ADD CONSTRAINT check_ins_performed_by_fkey
    FOREIGN KEY (performed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_created_by_fkey,
  ADD CONSTRAINT events_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.livestream_recordings
  DROP CONSTRAINT IF EXISTS livestream_recordings_created_by_fkey,
  ADD CONSTRAINT livestream_recordings_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.prayer_requests
  DROP CONSTRAINT IF EXISTS prayer_requests_recipient_user_id_fkey,
  ADD CONSTRAINT prayer_requests_recipient_user_id_fkey
    FOREIGN KEY (recipient_user_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  DROP CONSTRAINT IF EXISTS prayer_requests_responded_by_fkey,
  ADD CONSTRAINT prayer_requests_responded_by_fkey
    FOREIGN KEY (responded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.event_bus_staff
  DROP CONSTRAINT IF EXISTS event_bus_staff_user_id_fkey,
  ADD CONSTRAINT event_bus_staff_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.transport_staff_roles
  DROP CONSTRAINT IF EXISTS transport_staff_roles_user_id_fkey,
  ADD CONSTRAINT transport_staff_roles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
