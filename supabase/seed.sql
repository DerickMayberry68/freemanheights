-- Seed data for Freeman Heights Baptist Church (testing)

-- Service Times
INSERT INTO service_times (day_of_week, time, service_type, description, display_order) VALUES
('Sunday', '10:30 AM', 'Sunday Morning Worship', 'Join us for worship and Bible teaching', 1),
('Sunday', '6:00 PM', 'Sunday Evening', 'Evening service', 2),
('Wednesday', '6:00 PM', 'Midweek Service', 'Prayer meeting and Bible study', 3);

-- Ministries
INSERT INTO ministries (name, slug, description, target_audience, meeting_time, leader_name, display_order) VALUES
('Kids Ministry', 'kids', 'Growing in faith from a young age. Our kids program includes Sunday School, children''s church, and special events throughout the year.', 'Kids', 'Sundays 10:30 AM', 'Sarah Johnson', 1),
('Student Ministry', 'students', 'For middle and high school students. We meet for fellowship, discipleship, and fun activities that build lasting faith.', 'Students', 'Wednesdays 6:00 PM', 'Mike Thompson', 2),
('Adult Ministry', 'adults', 'Small groups and Bible studies for adults. Connect with others and grow deeper in your walk with Christ.', 'Adults', 'Various times', 'Pastor', 3),
('AWANA', 'awana', 'Scripture memory and discipleship for children. AWANA helps kids hide God''s Word in their hearts through games, lessons, and friendships.', 'Kids', 'Wednesdays 6:00 PM', 'Lisa Williams', 4),
('Women''s Ministry', 'womens', 'Bible study, fellowship, and outreach for women of all ages.', 'Adults', 'Tuesdays 10:00 AM', 'Carol Davis', 5),
('Men''s Ministry', 'mens', 'Brotherhood breakfasts, service projects, and accountability for men.', 'Adults', 'First Saturday each month', 'Tom Brown', 6);

-- Staff
INSERT INTO staff (name, role, bio, email, display_order) VALUES
('Pastor', 'Senior Pastor', 'Leading Freeman Heights in worship and ministry. Married with three children, passionate about preaching the Word and shepherding the flock.', 'pastor@freemanheights.com', 1),
('Mike Thompson', 'Youth Pastor', 'Serves our student ministry and loves investing in the next generation.', 'mike@freemanheights.com', 2),
('Sarah Johnson', 'Children''s Director', 'Leads our kids ministry and AWANA program with creativity and heart.', 'sarah@freemanheights.com', 3),
('Jennifer Williams', 'Worship Leader', 'Leads our worship team and coordinates music for Sunday services.', 'jennifer@freemanheights.com', 4);

-- Events (Sunday Worship = next Sunday 10:30 AM)
INSERT INTO events (title, description, event_date, location, is_featured) VALUES
('Sunday Worship', 'Join us for worship this Sunday', (CURRENT_DATE + (CASE WHEN EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN 7 ELSE (7 - EXTRACT(DOW FROM CURRENT_DATE)::int) END) * INTERVAL '1 day') + INTERVAL '10 hours 30 minutes', '522 Freeman Street, Berryville, AR', true),
('Wednesday Bible Study', 'Midweek prayer and Bible study', NOW() + INTERVAL '3 days', '522 Freeman Street, Berryville, AR', false),
('Youth Lock-In', 'All-night event for students! Games, worship, and fellowship.', NOW() + INTERVAL '7 days', '522 Freeman Street, Berryville, AR', true),
('Community Outreach Day', 'Serve our community together. Sign up at the welcome desk.', NOW() + INTERVAL '14 days', 'Downtown Berryville', true),
('AWANA Awards Night', 'Celebrating another year of Scripture memory', NOW() + INTERVAL '21 days', '522 Freeman Street, Berryville, AR', false),
('Easter Sunday Service', 'Celebrate the resurrection with us! Special music and breakfast.', NOW() + INTERVAL '60 days', '522 Freeman Street, Berryville, AR', true);

-- Sermons
INSERT INTO sermons (title, speaker, sermon_date, scripture_reference, description, video_url, is_featured) VALUES
('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-05-17', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/yn627qw?&info=0', true),
('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-05-17', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/jmw3nf8?&info=0', false),
('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-05-10', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/jqkdhm3?&info=0', false),
('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-05-03', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/d89y8js?&info=0', false),
('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-05-03', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/mrncgpg?&info=0', false),
('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-04-26', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/wm5nwtt?&info=0', false),
('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-04-26', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/y253y63?&info=0', false),
('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-04-19', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/cp5cvyb?&info=0', false),
('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-04-12', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/tsyswtj?&info=0', false),
('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-04-05', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/9nsnkyz?&info=0', false),
('Sunday Morning Worship Service/ Brother Marty Strough', 'Freeman Heights', DATE '2026-03-29', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/r36btfx?&info=0', false),
('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-03-22', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/ptdgn3x?&info=0', false),
('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-03-15', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/5gtn72b?&info=0', false),
('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-03-08', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/p97jwqh?&info=0', false),
('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-03-01', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/qxcg57d?&info=0', false),
('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-02-22', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/7n2ys4x?&info=0', false),
('"All that Calvary Implies must be Appropriated"', 'Freeman Heights', DATE '2026-02-15', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/mbx663v?&info=0', false),
('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-02-08', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/h9tvqgw?&info=0', false),
('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-02-01', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/kpwbrfk?&info=0', false),
('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-01-18', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/vys6mnr?&info=0', false),
('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-01-11', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/494nfhr?&info=0', false),
('Sunday Morning Worship Service', 'Freeman Heights', DATE '2026-01-04', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/yvs6f57?&info=0', false),
('Sunday Morning Worship Service', 'Freeman Heights', DATE '2025-12-28', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/rnjpnrh?&info=0', false),
('Sunday Morning Worship Service', 'Freeman Heights', DATE '2025-12-21', NULL, 'Previous livestream from Freeman Heights Baptist Church.', 'https://subsplash.com/u/-GQTDCX/media/embed/d/shhwhvz?&info=0', false);

-- Announcements
INSERT INTO announcements (title, content, start_date, end_date, priority) VALUES
('Welcome!', 'We''re glad you''re here. Whether you''re visiting for the first time or have been part of our family for years, you belong at Freeman Heights.', NOW(), NOW() + INTERVAL '30 days', 10),
('New Sunday School Class', 'Starting next month: a new adult Sunday School class on the book of Romans. Meet in Room 101 at 9:30 AM.', NOW(), NOW() + INTERVAL '60 days', 5),
('Food Pantry Needs', 'Our community food pantry is running low. Please bring canned goods and non-perishables. Drop-off at the welcome desk.', NOW(), NOW() + INTERVAL '14 days', 8),
('Youth Camp Registration', 'Sign up now for summer youth camp! Spots are limited. See Mike Thompson for details.', NOW(), NOW() + INTERVAL '90 days', 3);
