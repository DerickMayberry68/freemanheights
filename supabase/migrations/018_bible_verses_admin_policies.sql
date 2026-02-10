-- Admin write policies for bible_verses
-- Requires admin_approvals.approved = true

-- Allow approved admins to insert
CREATE POLICY "Approved admins can insert" ON bible_verses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_approvals
      WHERE user_id = auth.uid() AND approved = true
    )
  );

-- Allow approved admins to update
CREATE POLICY "Approved admins can update" ON bible_verses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_approvals
      WHERE user_id = auth.uid() AND approved = true
    )
  );

-- Allow approved admins to delete
CREATE POLICY "Approved admins can delete" ON bible_verses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_approvals
      WHERE user_id = auth.uid() AND approved = true
    )
  );
