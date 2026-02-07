-- Add role column to admin_approvals table
-- Roles: 'admin' (full access), 'editor' (content only), 'viewer' (read-only)
ALTER TABLE admin_approvals
ADD COLUMN role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'viewer'));

-- Update the approve_admin_user function to accept a role parameter
CREATE OR REPLACE FUNCTION public.approve_admin_user(p_approval_id UUID, p_role TEXT DEFAULT 'editor')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_approved_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Validate role
  IF p_role NOT IN ('admin', 'editor', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be admin, editor, or viewer', p_role;
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

-- Helper function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_admin_role(required_role TEXT)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_approvals
    WHERE user_id = auth.uid()
    AND approved = true
    AND CASE
      WHEN required_role = 'viewer' THEN role IN ('viewer', 'editor', 'admin')
      WHEN required_role = 'editor' THEN role IN ('editor', 'admin')
      WHEN required_role = 'admin' THEN role = 'admin'
      ELSE false
    END
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.has_admin_role(TEXT) TO authenticated;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_my_admin_role()
RETURNS TEXT AS $$
  SELECT role FROM admin_approvals
  WHERE user_id = auth.uid() AND approved = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_my_admin_role() TO authenticated;
