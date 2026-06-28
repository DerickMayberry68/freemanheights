-- Add server-side pagination and allowlisted sorting for admin login history.

DROP FUNCTION IF EXISTS public.get_admin_login_logs(integer);
DROP FUNCTION IF EXISTS private.get_admin_login_logs(integer);

CREATE OR REPLACE FUNCTION private.get_admin_login_logs(
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_sort_by text DEFAULT 'logged_in_at',
  p_sort_direction text DEFAULT 'desc'
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  logged_in_at timestamptz,
  ip_address text,
  user_agent text,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);
  v_offset integer := GREATEST(COALESCE(p_offset, 0), 0);
  v_sort_by text := lower(COALESCE(p_sort_by, 'logged_in_at'));
  v_sort_direction text := lower(COALESCE(p_sort_direction, 'desc'));
BEGIN
  IF NOT private.has_admin_role('admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_sort_by NOT IN ('email', 'logged_in_at', 'ip_address', 'user_agent') THEN
    v_sort_by := 'logged_in_at';
  END IF;

  IF v_sort_direction NOT IN ('asc', 'desc') THEN
    v_sort_direction := 'desc';
  END IF;

  RETURN QUERY
  SELECT
    l.id,
    l.user_id,
    l.email,
    l.logged_in_at,
    host(l.ip_address),
    l.user_agent,
    count(*) OVER () AS total_count
  FROM public.admin_login_logs l
  ORDER BY
    CASE WHEN v_sort_by = 'email' AND v_sort_direction = 'asc' THEN lower(l.email) END ASC NULLS LAST,
    CASE WHEN v_sort_by = 'email' AND v_sort_direction = 'desc' THEN lower(l.email) END DESC NULLS LAST,
    CASE WHEN v_sort_by = 'logged_in_at' AND v_sort_direction = 'asc' THEN l.logged_in_at END ASC NULLS LAST,
    CASE WHEN v_sort_by = 'logged_in_at' AND v_sort_direction = 'desc' THEN l.logged_in_at END DESC NULLS LAST,
    CASE WHEN v_sort_by = 'ip_address' AND v_sort_direction = 'asc' THEN l.ip_address END ASC NULLS LAST,
    CASE WHEN v_sort_by = 'ip_address' AND v_sort_direction = 'desc' THEN l.ip_address END DESC NULLS LAST,
    CASE WHEN v_sort_by = 'user_agent' AND v_sort_direction = 'asc' THEN lower(COALESCE(l.user_agent, '')) END ASC NULLS LAST,
    CASE WHEN v_sort_by = 'user_agent' AND v_sort_direction = 'desc' THEN lower(COALESCE(l.user_agent, '')) END DESC NULLS LAST,
    l.logged_in_at DESC,
    l.id DESC
  LIMIT v_limit
  OFFSET v_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_login_logs(
  p_limit integer DEFAULT 100,
  p_offset integer DEFAULT 0,
  p_sort_by text DEFAULT 'logged_in_at',
  p_sort_direction text DEFAULT 'desc'
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  logged_in_at timestamptz,
  ip_address text,
  user_agent text,
  total_count bigint
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT *
  FROM private.get_admin_login_logs(p_limit, p_offset, p_sort_by, p_sort_direction);
$$;

REVOKE ALL ON FUNCTION private.get_admin_login_logs(integer, integer, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.get_admin_login_logs(integer, integer, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_admin_login_logs(integer, integer, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_login_logs(integer, integer, text, text) TO authenticated, service_role;
