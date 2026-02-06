-- Returns approval status for the current user (bypasses RLS for this read)
CREATE OR REPLACE FUNCTION public.get_my_approval()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((SELECT approved FROM admin_approvals WHERE user_id = auth.uid() LIMIT 1), false);
$$;

GRANT EXECUTE ON FUNCTION public.get_my_approval() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_approval() TO anon;
