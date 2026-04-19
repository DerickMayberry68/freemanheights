-- =============================================================================
-- Freeman Heights — Transport / bus manifest test data
--
-- Prereqs:
--   1. Run mobile/migration_transport.sql on this database (if not already).
--   2. Edit v_driver_email below to the SAME email you use to sign into the app.
--
-- Run the whole file in Supabase SQL Editor. Inserts are idempotent where possible.
-- The block at the bottom moves the test event to "today" 6:30 PM America/Chicago
-- so TransportRepository.getTodaysEventBuses() keeps finding it.
--
-- No DB? Flip TransportRepository.useMockData = true in the Flutter app for UI-only tests.
-- =============================================================================

DO $$
DECLARE
  v_church_id   UUID := '00000000-0000-0000-0000-000000000001';
  v_driver_email TEXT := 'CHANGE_ME@example.com';  -- <<< your Supabase login email
  v_user_id     UUID;
  v_bus1_id     UUID := '00000000-0000-0000-0000-000000000010';
  v_bus2_id     UUID := '00000000-0000-0000-0000-000000000011';
  v_event_id    UUID := '00000000-0000-0000-0000-000000000020';
  v_eb1_id      UUID := '00000000-0000-0000-0000-000000000030';
  v_eb2_id      UUID := '00000000-0000-0000-0000-000000000031';
  v_stop1_id    UUID := '00000000-0000-0000-0000-000000000040';
  v_stop2_id    UUID := '00000000-0000-0000-0000-000000000041';
  v_stop3_id    UUID := '00000000-0000-0000-0000-000000000042';
  -- Children
  c1 UUID := '00000000-0000-0000-0000-0000000000C1';
  c2 UUID := '00000000-0000-0000-0000-0000000000C2';
  c3 UUID := '00000000-0000-0000-0000-0000000000C3';
  c4 UUID := '00000000-0000-0000-0000-0000000000C4';
  c5 UUID := '00000000-0000-0000-0000-0000000000C5';
  c6 UUID := '00000000-0000-0000-0000-0000000000C6';
  -- Event registrations
  r1 UUID := '00000000-0000-0000-0000-0000000000E1';
  r2 UUID := '00000000-0000-0000-0000-0000000000E2';
  r3 UUID := '00000000-0000-0000-0000-0000000000E3';
  r4 UUID := '00000000-0000-0000-0000-0000000000E4';
  r5 UUID := '00000000-0000-0000-0000-0000000000E5';
  r6 UUID := '00000000-0000-0000-0000-0000000000E6';
  v_today TIMESTAMPTZ;

BEGIN
  IF v_driver_email = 'CHANGE_ME@example.com' THEN
    RAISE EXCEPTION 'Edit v_driver_email in this script to your real auth.users email (same as mobile login).';
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = lower(trim(v_driver_email)) LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No auth.users row for email %. Sign up once in the app or Admin first.', v_driver_email;
  END IF;

  -- Today 6:30 PM local (Central — Berryville, AR). Interprets wall clock in Chicago, stores as timestamptz.
  v_today := (
    date_trunc('day', current_timestamp AT TIME ZONE 'America/Chicago')
    + interval '18 hours 30 minutes'
  ) AT TIME ZONE 'America/Chicago';

  -- ── Member profile for the staff user ─────────────────────────────────────
  INSERT INTO public.member_profiles (id, church_id, first_name, last_name, is_active)
  VALUES (v_user_id, v_church_id, 'Transport', 'Staff', TRUE)
  ON CONFLICT (id) DO NOTHING;

  -- ── Transport staff roles ──────────────────────────────────────────────────
  -- Assign as Driver on Bus 1
  INSERT INTO public.transport_staff_roles (church_id, user_id, role_type_id, is_active)
  VALUES (v_church_id, v_user_id, 1, TRUE) -- 1 = Driver
  ON CONFLICT (church_id, user_id, role_type_id) DO NOTHING;

  -- ── Buses ──────────────────────────────────────────────────────────────────
  INSERT INTO public.buses (id, church_id, name, capacity, license_plate, is_active)
  VALUES
    (v_bus1_id, v_church_id, 'Bus 1', 24, 'ARK-1234', TRUE),
    (v_bus2_id, v_church_id, 'Bus 2', 20, 'ARK-5678', TRUE)
  ON CONFLICT (id) DO NOTHING;

  -- ── Event (AWANA Night — today) ────────────────────────────────────────────
  INSERT INTO public.events (
    id, church_id, event_type_id, status_id,
    title, description, event_date, end_date,
    location, has_transport, requires_registration,
    is_featured, created_by
  ) VALUES (
    v_event_id, v_church_id, 2, 3,   -- event_type=AWANA(2), status=Active(3)
    'AWANA Night',
    'Weekly AWANA club night for children K–6th grade.',
    v_today,
    v_today + interval '2 hours',
    'Freeman Heights Baptist Church',
    TRUE, TRUE,
    FALSE, v_user_id
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── Event buses ───────────────────────────────────────────────────────────
  INSERT INTO public.event_buses (id, event_id, bus_id, departure_time, estimated_return)
  VALUES
    (v_eb1_id, v_event_id, v_bus1_id,
      v_today - interval '30 minutes',
      v_today + interval '2 hours 30 minutes'),
    (v_eb2_id, v_event_id, v_bus2_id,
      v_today - interval '30 minutes',
      v_today + interval '2 hours 30 minutes')
  ON CONFLICT (event_id, bus_id) DO NOTHING;

  -- ── Route stops for Bus 1 ─────────────────────────────────────────────────
  INSERT INTO public.route_stops (id, event_bus_id, stop_order, stop_name, address, scheduled_time)
  VALUES
    (v_stop1_id, v_eb1_id, 1, 'North Pickup',
      '100 North St, Berryville, AR 72616',
      v_today - interval '30 minutes'),
    (v_stop2_id, v_eb1_id, 2, 'East Pickup',
      '200 East Ave, Berryville, AR 72616',
      v_today - interval '15 minutes'),
    (v_stop3_id, v_eb1_id, 3, 'Freeman Heights Church',
      '522 Freeman Street, Berryville, AR 72616',
      v_today)
  ON CONFLICT (event_bus_id, stop_order) DO NOTHING;

  -- ── Assign staff to buses ─────────────────────────────────────────────────
  -- You are the Driver on Bus 1
  INSERT INTO public.event_bus_staff (event_bus_id, user_id, role_type_id)
  VALUES (v_eb1_id, v_user_id, 1) -- 1 = Driver
  ON CONFLICT (event_bus_id, user_id) DO NOTHING;

  -- Note: v_guardian_id removed — member_profiles FK requires a real auth.users row.
  -- Registrations are attributed to your account (v_user_id) for test data purposes.

  -- ── Children ──────────────────────────────────────────────────────────────
  INSERT INTO public.children (id, church_id, first_name, last_name, date_of_birth, is_active)
  VALUES
    (c1, v_church_id, 'Emma',   'Anderson', '2015-03-12', TRUE),
    (c2, v_church_id, 'Noah',   'Davis',    '2014-07-22', TRUE),
    (c3, v_church_id, 'Olivia', 'Garcia',   '2016-01-05', TRUE),
    (c4, v_church_id, 'Liam',   'Johnson',  '2013-11-18', TRUE),
    (c5, v_church_id, 'Sophia', 'Martinez', '2015-09-30', TRUE),
    (c6, v_church_id, 'Elijah', 'Smith',    '2014-04-14', TRUE)
  ON CONFLICT (id) DO NOTHING;

  -- ── Medical alerts (idempotent — no unique constraint on this table) ─────
  INSERT INTO public.child_medical_alerts (child_id, alert_type_id, severity, description, action_required, is_active)
  SELECT c2, 1, 3, 'Severe peanut allergy (TEST)', 'EpiPen in backpack — administer immediately and call 911', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM public.child_medical_alerts a WHERE a.child_id = c2 AND a.description LIKE 'Severe peanut allergy%'
  );

  INSERT INTO public.child_medical_alerts (child_id, alert_type_id, severity, description, action_required, is_active)
  SELECT c6, 3, 2, 'Asthma (TEST)', 'Inhaler in left side pocket of backpack', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM public.child_medical_alerts a WHERE a.child_id = c6 AND a.description = 'Asthma (TEST)'
  );

  INSERT INTO public.child_medical_alerts (child_id, alert_type_id, severity, description, action_required, is_active)
  SELECT c6, 1, 3, 'Bee sting allergy (TEST)', 'EpiPen in backpack — administer immediately and call 911', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM public.child_medical_alerts a WHERE a.child_id = c6 AND a.description LIKE 'Bee sting allergy%'
  );

  INSERT INTO public.child_medical_alerts (child_id, alert_type_id, severity, description, action_required, is_active)
  SELECT c3, 4, 1, 'Lactose intolerant (TEST)', 'Avoid dairy products', TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM public.child_medical_alerts a WHERE a.child_id = c3 AND a.description LIKE 'Lactose intolerant%'
  );

  -- ── Event registrations ───────────────────────────────────────────────────
  -- status_id 2 = Approved
  INSERT INTO public.event_registrations
    (id, church_id, event_id, child_id, registered_by, status_id, permission_slip_signed, registered_at)
  VALUES
    (r1, v_church_id, v_event_id, c1, v_user_id, 2, TRUE, NOW()),
    (r2, v_church_id, v_event_id, c2, v_user_id, 2, TRUE, NOW()),
    (r3, v_church_id, v_event_id, c3, v_user_id, 2, TRUE, NOW()),
    (r4, v_church_id, v_event_id, c4, v_user_id, 2, TRUE, NOW()),
    (r5, v_church_id, v_event_id, c5, v_user_id, 2, TRUE, NOW()),
    (r6, v_church_id, v_event_id, c6, v_user_id, 2, TRUE, NOW())
  ON CONFLICT (event_id, child_id) DO NOTHING;

  -- ── Bus assignments (all 6 children on Bus 1) ─────────────────────────────
  INSERT INTO public.child_bus_assignments (event_registration_id, event_bus_id, seat_number)
  VALUES
    (r1, v_eb1_id, 1),
    (r2, v_eb1_id, 2),
    (r3, v_eb1_id, 3),
    (r4, v_eb1_id, 4),
    (r5, v_eb1_id, 5),
    (r6, v_eb1_id, 6)
  ON CONFLICT (event_registration_id) DO NOTHING;

  RAISE NOTICE 'Seed complete. Driver user_id: % (email: %)', v_user_id, v_driver_email;
END $$;

-- -----------------------------------------------------------------------------
-- Keep the fixed test event on "today" in Central Time whenever you re-run this file
-- (inserts above no-op on conflict, but the app only loads today's events).
-- -----------------------------------------------------------------------------
UPDATE public.events e
SET
  event_date = (
    date_trunc('day', current_timestamp AT TIME ZONE 'America/Chicago')
    + interval '18 hours 30 minutes'
  ) AT TIME ZONE 'America/Chicago',
  end_date = (
    date_trunc('day', current_timestamp AT TIME ZONE 'America/Chicago')
    + interval '20 hours 30 minutes'
  ) AT TIME ZONE 'America/Chicago'
WHERE e.id = '00000000-0000-0000-0000-000000000020';

UPDATE public.event_buses eb
SET
  departure_time = e.event_date - interval '30 minutes',
  estimated_return = e.event_date + interval '2 hours 30 minutes'
FROM public.events e
WHERE eb.event_id = e.id AND e.id = '00000000-0000-0000-0000-000000000020';

UPDATE public.route_stops rs
SET scheduled_time = CASE rs.stop_order
  WHEN 1 THEN (SELECT event_date - interval '30 minutes' FROM public.events WHERE id = '00000000-0000-0000-0000-000000000020')
  WHEN 2 THEN (SELECT event_date - interval '15 minutes' FROM public.events WHERE id = '00000000-0000-0000-0000-000000000020')
  WHEN 3 THEN (SELECT event_date FROM public.events WHERE id = '00000000-0000-0000-0000-000000000020')
  ELSE rs.scheduled_time
END
WHERE rs.event_bus_id = '00000000-0000-0000-0000-000000000030';
