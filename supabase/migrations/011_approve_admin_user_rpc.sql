-- Let approved admins set approved = true for a row (bypasses RLS on UPDATE)
CREATE OR REPLACE FUNCTION public.approve_admin_user(p_approval_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE admin_approvals
  SET approved = true, approved_at = NOW(), approved_by = auth.uid()
  WHERE id = p_approval_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_admin_user(UUID) TO authenticated;
