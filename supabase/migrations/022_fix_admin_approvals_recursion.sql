-- Fix infinite recursion in admin_approvals policies
-- Replace policies that query admin_approvals directly with ones using is_approved_admin() function

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "admin_approvals_select" ON admin_approvals;
DROP POLICY IF EXISTS "admin_approvals_update" ON admin_approvals;

-- Recreate SELECT policy using the SECURITY DEFINER function to avoid recursion
CREATE POLICY "admin_approvals_select"
  ON admin_approvals FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_approved_admin()
  );

-- Recreate UPDATE policy using the SECURITY DEFINER function to avoid recursion
CREATE POLICY "admin_approvals_update"
  ON admin_approvals FOR UPDATE
  USING (is_approved_admin());
