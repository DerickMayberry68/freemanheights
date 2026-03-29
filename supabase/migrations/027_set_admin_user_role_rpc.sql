-- Allow admin-role users to change roles for approved admin users.
-- Prevent demoting the last remaining admin to avoid lockout.
CREATE OR REPLACE FUNCTION public.set_admin_user_role(p_approval_id UUID, p_role TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_role TEXT;
  v_admin_count INTEGER;
BEGIN
  IF NOT public.has_admin_role('admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_role NOT IN ('admin', 'editor', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be admin, editor, or viewer', p_role;
  END IF;

  SELECT role
  INTO v_current_role
  FROM admin_approvals
  WHERE id = p_approval_id
    AND approved = true;

  IF v_current_role IS NULL THEN
    RAISE EXCEPTION 'Approved user not found.';
  END IF;

  IF v_current_role = 'admin' AND p_role <> 'admin' THEN
    SELECT count(*)
    INTO v_admin_count
    FROM admin_approvals
    WHERE approved = true
      AND role = 'admin';

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot change role. At least one admin user is required.';
    END IF;
  END IF;

  UPDATE admin_approvals
  SET role = p_role
  WHERE id = p_approval_id
    AND approved = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_admin_user_role(UUID, TEXT) TO authenticated;
