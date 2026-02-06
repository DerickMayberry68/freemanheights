-- Table: who is allowed to use admin (approved = true)
CREATE TABLE admin_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- First registrant becomes approved (bootstrap)
CREATE OR REPLACE FUNCTION admin_approvals_first_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT count(*) FROM admin_approvals WHERE approved = true) = 0 THEN
    NEW.approved := true;
    NEW.approved_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_first_approved
  BEFORE INSERT ON admin_approvals
  FOR EACH ROW
  EXECUTE FUNCTION admin_approvals_first_approved();

ALTER TABLE admin_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_approvals_select"
  ON admin_approvals FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM admin_approvals a WHERE a.user_id = auth.uid() AND a.approved = true)
  );

CREATE POLICY "admin_approvals_insert"
  ON admin_approvals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin_approvals_update"
  ON admin_approvals FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admin_approvals a WHERE a.user_id = auth.uid() AND a.approved = true));

CREATE OR REPLACE FUNCTION is_approved_admin()
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM admin_approvals WHERE user_id = auth.uid() AND approved = true);
$$ LANGUAGE sql SECURITY DEFINER STABLE;
