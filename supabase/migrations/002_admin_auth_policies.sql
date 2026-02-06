-- Allow authenticated users (admins) full access to content tables
CREATE POLICY "Allow authenticated all service_times" ON service_times FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated all ministries" ON ministries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated all events" ON events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated all staff" ON staff FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated all sermons" ON sermons FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated all announcements" ON announcements FOR ALL TO authenticated USING (true) WITH CHECK (true);
