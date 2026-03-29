-- Require auth email verification before an admin can approve access
CREATE OR REPLACE FUNCTION public.approve_admin_user(p_approval_id UUID, p_role TEXT DEFAULT 'editor')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_email_confirmed_at TIMESTAMPTZ;
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_role NOT IN ('admin', 'editor', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be admin, editor, or viewer', p_role;
  END IF;

  SELECT user_id
  INTO v_user_id
  FROM admin_approvals
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

  UPDATE admin_approvals
  SET approved = true,
      approved_at = NOW(),
      approved_by = auth.uid(),
      role = p_role
  WHERE id = p_approval_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_admin_user(UUID, TEXT) TO authenticated;
