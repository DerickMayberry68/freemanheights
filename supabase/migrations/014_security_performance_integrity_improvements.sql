-- Migration 014: Security, Performance, and Data Integrity Improvements
-- This migration adds role-based RLS policies, performance indexes, and data constraints

-- =============================================================================
-- PART 1: PERFORMANCE INDEXES
-- =============================================================================

-- Events indexes (most queried table)
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_events_ministry ON events(ministry_id) WHERE ministry_id IS NOT NULL;

-- Sermons indexes
CREATE INDEX IF NOT EXISTS idx_sermons_date ON sermons(sermon_date DESC);
CREATE INDEX IF NOT EXISTS idx_sermons_featured ON sermons(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_sermons_series ON sermons(series) WHERE series IS NOT NULL;

-- Announcements indexes
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, start_date, end_date)
  WHERE is_active = true;

-- Admin approvals indexes
CREATE INDEX IF NOT EXISTS idx_admin_approvals_user ON admin_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_approvals_approved ON admin_approvals(approved) WHERE approved = true;

-- Prayer requests index
CREATE INDEX IF NOT EXISTS idx_prayer_requests_created ON prayer_requests(created_at DESC);

-- Ministries index
CREATE INDEX IF NOT EXISTS idx_ministries_slug ON ministries(slug);

-- Staff index
CREATE INDEX IF NOT EXISTS idx_staff_display_order ON staff(display_order) WHERE is_active = true;

-- Service times index
CREATE INDEX IF NOT EXISTS idx_service_times_display_order ON service_times(display_order) WHERE is_active = true;

-- =============================================================================
-- PART 2: DATA INTEGRITY CONSTRAINTS
-- =============================================================================

-- Ensure event end_date is after start date (skip if data violates this)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM events WHERE end_date IS NOT NULL AND end_date < event_date
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_end_after_start
      CHECK (end_date IS NULL OR end_date >= event_date);
  ELSE
    RAISE NOTICE 'Skipping events_end_after_start constraint - existing data violates it';
  END IF;
END $$;

-- Ensure announcement end_date is after start date
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM announcements WHERE end_date IS NOT NULL AND end_date < start_date
  ) THEN
    ALTER TABLE announcements
      ADD CONSTRAINT announcements_end_after_start
      CHECK (end_date IS NULL OR end_date >= start_date);
  ELSE
    RAISE NOTICE 'Skipping announcements_end_after_start constraint - existing data violates it';
  END IF;
END $$;

-- Constrain priority range for announcements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM announcements WHERE priority < 0 OR priority > 10
  ) THEN
    ALTER TABLE announcements
      ADD CONSTRAINT announcements_priority_range
      CHECK (priority BETWEEN 0 AND 10);
  ELSE
    RAISE NOTICE 'Skipping announcements_priority_range constraint - existing data violates it';
  END IF;
END $$;

-- Standardize day_of_week values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM service_times
    WHERE day_of_week NOT IN ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')
  ) THEN
    ALTER TABLE service_times
      ADD CONSTRAINT service_times_valid_day
      CHECK (day_of_week IN ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'));
  ELSE
    RAISE NOTICE 'Skipping service_times_valid_day constraint - existing data violates it';
  END IF;
END $$;

-- =============================================================================
-- PART 3: MISSING AUDIT FIELDS
-- =============================================================================

-- Add updated_at to announcements if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'announcements'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE announcements ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add updated_at to prayer_requests if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'prayer_requests'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE prayer_requests ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create update_updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for all tables with updated_at
DROP TRIGGER IF EXISTS set_updated_at_events ON events;
CREATE TRIGGER set_updated_at_events
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_ministries ON ministries;
CREATE TRIGGER set_updated_at_ministries
  BEFORE UPDATE ON ministries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_staff ON staff;
CREATE TRIGGER set_updated_at_staff
  BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_sermons ON sermons;
CREATE TRIGGER set_updated_at_sermons
  BEFORE UPDATE ON sermons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_service_times ON service_times;
CREATE TRIGGER set_updated_at_service_times
  BEFORE UPDATE ON service_times
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_announcements ON announcements;
CREATE TRIGGER set_updated_at_announcements
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_prayer_requests ON prayer_requests;
CREATE TRIGGER set_updated_at_prayer_requests
  BEFORE UPDATE ON prayer_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- PART 4: MISSING FOREIGN KEY
-- =============================================================================

-- Add foreign key for approved_by (only if all approved_by values exist in auth.users)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM admin_approvals
    WHERE approved_by IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = approved_by)
  ) THEN
    ALTER TABLE admin_approvals
      ADD CONSTRAINT admin_approvals_approved_by_fkey
      FOREIGN KEY (approved_by) REFERENCES auth.users(id);
  ELSE
    RAISE NOTICE 'Skipping admin_approvals_approved_by_fkey - orphaned approved_by references exist';
  END IF;
END $$;

-- =============================================================================
-- PART 5: ROLE-BASED RLS POLICIES (CRITICAL SECURITY FIX)
-- =============================================================================

-- Drop old blanket authenticated policies
DROP POLICY IF EXISTS "Allow authenticated all service_times" ON service_times;
DROP POLICY IF EXISTS "Allow authenticated all ministries" ON ministries;
DROP POLICY IF EXISTS "Allow authenticated all events" ON events;
DROP POLICY IF EXISTS "Allow authenticated all staff" ON staff;
DROP POLICY IF EXISTS "Allow authenticated all sermons" ON sermons;
DROP POLICY IF EXISTS "Allow authenticated all announcements" ON announcements;

-- SERVICE TIMES: Role-based policies
CREATE POLICY "service_times_admin_full" ON service_times
  FOR ALL TO authenticated
  USING (public.has_admin_role('admin'))
  WITH CHECK (public.has_admin_role('admin'));

CREATE POLICY "service_times_editor_full" ON service_times
  FOR ALL TO authenticated
  USING (public.has_admin_role('editor'))
  WITH CHECK (public.has_admin_role('editor'));

CREATE POLICY "service_times_viewer_read" ON service_times
  FOR SELECT TO authenticated
  USING (public.has_admin_role('viewer'));

-- MINISTRIES: Role-based policies
CREATE POLICY "ministries_admin_full" ON ministries
  FOR ALL TO authenticated
  USING (public.has_admin_role('admin'))
  WITH CHECK (public.has_admin_role('admin'));

CREATE POLICY "ministries_editor_full" ON ministries
  FOR ALL TO authenticated
  USING (public.has_admin_role('editor'))
  WITH CHECK (public.has_admin_role('editor'));

CREATE POLICY "ministries_viewer_read" ON ministries
  FOR SELECT TO authenticated
  USING (public.has_admin_role('viewer'));

-- EVENTS: Role-based policies
CREATE POLICY "events_admin_full" ON events
  FOR ALL TO authenticated
  USING (public.has_admin_role('admin'))
  WITH CHECK (public.has_admin_role('admin'));

CREATE POLICY "events_editor_full" ON events
  FOR ALL TO authenticated
  USING (public.has_admin_role('editor'))
  WITH CHECK (public.has_admin_role('editor'));

CREATE POLICY "events_viewer_read" ON events
  FOR SELECT TO authenticated
  USING (public.has_admin_role('viewer'));

-- STAFF: Role-based policies
CREATE POLICY "staff_admin_full" ON staff
  FOR ALL TO authenticated
  USING (public.has_admin_role('admin'))
  WITH CHECK (public.has_admin_role('admin'));

CREATE POLICY "staff_editor_full" ON staff
  FOR ALL TO authenticated
  USING (public.has_admin_role('editor'))
  WITH CHECK (public.has_admin_role('editor'));

CREATE POLICY "staff_viewer_read" ON staff
  FOR SELECT TO authenticated
  USING (public.has_admin_role('viewer'));

-- SERMONS: Role-based policies
CREATE POLICY "sermons_admin_full" ON sermons
  FOR ALL TO authenticated
  USING (public.has_admin_role('admin'))
  WITH CHECK (public.has_admin_role('admin'));

CREATE POLICY "sermons_editor_full" ON sermons
  FOR ALL TO authenticated
  USING (public.has_admin_role('editor'))
  WITH CHECK (public.has_admin_role('editor'));

CREATE POLICY "sermons_viewer_read" ON sermons
  FOR SELECT TO authenticated
  USING (public.has_admin_role('viewer'));

-- ANNOUNCEMENTS: Role-based policies
CREATE POLICY "announcements_admin_full" ON announcements
  FOR ALL TO authenticated
  USING (public.has_admin_role('admin'))
  WITH CHECK (public.has_admin_role('admin'));

CREATE POLICY "announcements_editor_full" ON announcements
  FOR ALL TO authenticated
  USING (public.has_admin_role('editor'))
  WITH CHECK (public.has_admin_role('editor'));

CREATE POLICY "announcements_viewer_read" ON announcements
  FOR SELECT TO authenticated
  USING (public.has_admin_role('viewer'));

-- PRAYER REQUESTS: Admin and Editor can manage, Viewer can read
CREATE POLICY "prayer_requests_admin_full" ON prayer_requests
  FOR ALL TO authenticated
  USING (public.has_admin_role('admin'))
  WITH CHECK (public.has_admin_role('admin'));

CREATE POLICY "prayer_requests_editor_full" ON prayer_requests
  FOR ALL TO authenticated
  USING (public.has_admin_role('editor'))
  WITH CHECK (public.has_admin_role('editor'));

CREATE POLICY "prayer_requests_viewer_read" ON prayer_requests
  FOR SELECT TO authenticated
  USING (public.has_admin_role('viewer'));

-- LIVESTREAM RECORDINGS: Role-based policies
ALTER TABLE livestream_recordings ENABLE ROW LEVEL SECURITY;

-- Keep public read policy if it exists
CREATE POLICY "livestream_recordings_public_read" ON livestream_recordings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "livestream_recordings_admin_full" ON livestream_recordings
  FOR ALL TO authenticated
  USING (public.has_admin_role('admin'))
  WITH CHECK (public.has_admin_role('admin'));

CREATE POLICY "livestream_recordings_editor_full" ON livestream_recordings
  FOR ALL TO authenticated
  USING (public.has_admin_role('editor'))
  WITH CHECK (public.has_admin_role('editor'));

CREATE POLICY "livestream_recordings_viewer_read" ON livestream_recordings
  FOR SELECT TO authenticated
  USING (public.has_admin_role('viewer'));

-- SITE SETTINGS: Only admin can modify, others can read
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings_public_read" ON site_settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "site_settings_admin_full" ON site_settings
  FOR ALL TO authenticated
  USING (public.has_admin_role('admin'))
  WITH CHECK (public.has_admin_role('admin'));

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Log what we did
DO $$
BEGIN
  RAISE NOTICE '✓ Migration 014 completed successfully';
  RAISE NOTICE '  - Added performance indexes for all major tables';
  RAISE NOTICE '  - Added data integrity constraints (where data allowed)';
  RAISE NOTICE '  - Added missing audit fields and triggers';
  RAISE NOTICE '  - Added foreign key for approved_by (if data allowed)';
  RAISE NOTICE '  - Updated RLS policies to use role-based permissions';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Test your admin panel to ensure editors can still manage content!';
END $$;
