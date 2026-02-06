-- Let approved admins see all approval rows (bypasses RLS recursion on SELECT)
CREATE OR REPLACE FUNCTION public.get_admin_approvals()
RETURNS SETOF admin_approvals
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT * FROM admin_approvals
  WHERE public.is_approved_admin()
  ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_approvals() TO authenticated;
