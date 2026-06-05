CREATE OR REPLACE FUNCTION public.get_my_approval()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
STABLE
AS $$
  SELECT private.is_approved_admin();
$$;

REVOKE ALL ON FUNCTION public.get_my_approval() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_approval() TO authenticated, service_role;
