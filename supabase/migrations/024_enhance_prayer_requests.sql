-- Migration 024: Enhance prayer requests with birthday and response tracking
-- Adds fields for generational targeting and admin response management

-- Add new columns to prayer_requests table
ALTER TABLE prayer_requests
  ADD COLUMN IF NOT EXISTS birthday DATE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS responded_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS response_method TEXT,
  ADD COLUMN IF NOT EXISTS response_notes TEXT,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add constraint for valid response methods
ALTER TABLE prayer_requests
  ADD CONSTRAINT valid_response_method
  CHECK (response_method IS NULL OR response_method IN ('phone', 'email', 'text', 'in_person', 'push_notification', 'other'));

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_prayer_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_prayer_requests_updated_at
  BEFORE UPDATE ON prayer_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_prayer_request_updated_at();

-- Create function to calculate age from birthday
CREATE OR REPLACE FUNCTION get_age_from_birthday(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(birth_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to determine generation/age group
CREATE OR REPLACE FUNCTION get_generation(birth_date DATE)
RETURNS TEXT AS $$
DECLARE
  age INTEGER;
BEGIN
  IF birth_date IS NULL THEN
    RETURN 'unknown';
  END IF;

  age := EXTRACT(YEAR FROM AGE(birth_date));

  IF age < 18 THEN
    RETURN 'youth';
  ELSIF age < 25 THEN
    RETURN 'gen_z';
  ELSIF age < 40 THEN
    RETURN 'millennial';
  ELSIF age < 55 THEN
    RETURN 'gen_x';
  ELSIF age < 75 THEN
    RETURN 'boomer';
  ELSE
    RETURN 'silent';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_prayer_requests_created_at
  ON prayer_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prayer_requests_responded_at
  ON prayer_requests(responded_at DESC)
  WHERE responded_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prayer_requests_is_answered
  ON prayer_requests(is_answered)
  WHERE is_answered = false;

CREATE INDEX IF NOT EXISTS idx_prayer_requests_birthday
  ON prayer_requests(birthday)
  WHERE birthday IS NOT NULL;

-- Add RLS policies for admin management
-- Admins and editors can view all prayer requests
CREATE POLICY "prayer_requests_admin_view" ON prayer_requests
  FOR SELECT TO authenticated
  USING (public.has_admin_role('viewer'));

-- Admins and editors can update prayer requests (for response tracking)
CREATE POLICY "prayer_requests_admin_update" ON prayer_requests
  FOR UPDATE TO authenticated
  USING (public.has_admin_role('editor'))
  WITH CHECK (public.has_admin_role('editor'));

-- Only admins can delete prayer requests
CREATE POLICY "prayer_requests_admin_delete" ON prayer_requests
  FOR DELETE TO authenticated
  USING (public.has_admin_role('admin'));

-- Add helpful comments
COMMENT ON COLUMN prayer_requests.birthday IS 'Optional birthday for generational targeting (phone vs digital communication)';
COMMENT ON COLUMN prayer_requests.responded_at IS 'Timestamp when prayer team responded to request';
COMMENT ON COLUMN prayer_requests.responded_by IS 'Admin user who responded to the prayer request';
COMMENT ON COLUMN prayer_requests.response_method IS 'How the prayer team responded: phone, email, text, in_person, push_notification, other';
COMMENT ON COLUMN prayer_requests.response_notes IS 'Notes about the response (visible to admin team)';
COMMENT ON COLUMN prayer_requests.admin_notes IS 'Internal admin notes (not sent to requester)';

-- Create view for prayer request management dashboard
CREATE OR REPLACE VIEW prayer_requests_admin_view AS
SELECT
  pr.*,
  get_age_from_birthday(pr.birthday) as age,
  get_generation(pr.birthday) as generation,
  u.email as responded_by_email,
  CASE
    WHEN pr.responded_at IS NOT NULL THEN true
    ELSE false
  END as has_response
FROM prayer_requests pr
LEFT JOIN auth.users u ON pr.responded_by = u.id;

-- Grant access to the view for authenticated users with admin roles
GRANT SELECT ON prayer_requests_admin_view TO authenticated;
