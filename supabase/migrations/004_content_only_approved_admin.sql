-- Only approved admins can write to content tables
DROP POLICY IF EXISTS "Allow authenticated all service_times" ON service_times;
DROP POLICY IF EXISTS "Allow authenticated all ministries" ON ministries;
DROP POLICY IF EXISTS "Allow authenticated all events" ON events;
DROP POLICY IF EXISTS "Allow authenticated all staff" ON staff;
DROP POLICY IF EXISTS "Allow authenticated all sermons" ON sermons;
DROP POLICY IF EXISTS "Allow authenticated all announcements" ON announcements;

CREATE POLICY "Approved admin service_times" ON service_times FOR ALL TO authenticated USING (is_approved_admin()) WITH CHECK (is_approved_admin());
CREATE POLICY "Approved admin ministries" ON ministries FOR ALL TO authenticated USING (is_approved_admin()) WITH CHECK (is_approved_admin());
CREATE POLICY "Approved admin events" ON events FOR ALL TO authenticated USING (is_approved_admin()) WITH CHECK (is_approved_admin());
CREATE POLICY "Approved admin staff" ON staff FOR ALL TO authenticated USING (is_approved_admin()) WITH CHECK (is_approved_admin());
CREATE POLICY "Approved admin sermons" ON sermons FOR ALL TO authenticated USING (is_approved_admin()) WITH CHECK (is_approved_admin());
CREATE POLICY "Approved admin announcements" ON announcements FOR ALL TO authenticated USING (is_approved_admin()) WITH CHECK (is_approved_admin());
