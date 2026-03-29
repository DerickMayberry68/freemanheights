-- =============================================================================
-- Freeman Heights — Transport Module Migration
-- Run this against the existing Supabase database.
-- Safe to run on a DB that already has the website tables applied.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- STEP 1: Tenant root — churches table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.churches (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  address    TEXT,
  city       TEXT,
  state      TEXT,
  zip        TEXT,
  phone      TEXT,
  email      TEXT,
  website_url TEXT,
  logo_url   TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert Freeman Heights as tenant 0 with stable UUID
INSERT INTO public.churches (id, name, address, city, state, zip, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Freeman Heights Baptist Church',
  '522 Freeman Street',
  'Berryville',
  'AR',
  '72616',
  TRUE
)
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- STEP 2: Lookup tables (new — become Dart/TypeScript enums)
-- Seed order matters — Dart enum extensions resolve by index (id - 1).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.event_types (
  id   SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE
);
INSERT INTO public.event_types (name) VALUES
  ('General'), ('AWANA'), ('Sunday_Service'), ('Camp_Trip'),
  ('Field_Trip'), ('Youth_Group'), ('VBS'), ('Other')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.event_status_types (
  id   SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE
);
INSERT INTO public.event_status_types (name) VALUES
  ('Draft'), ('Published'), ('Active'), ('Completed'), ('Cancelled')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.check_in_action_types (
  id   SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE
);
INSERT INTO public.check_in_action_types (name) VALUES
  ('Boarded'), ('Departed'), ('Arrived'), ('Released'), ('No_Show')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.notification_channels (
  id   SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE
);
INSERT INTO public.notification_channels (name) VALUES
  ('SMS'), ('Email'), ('Push')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.relationship_types (
  id   SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE
);
INSERT INTO public.relationship_types (name) VALUES
  ('Father'), ('Mother'), ('Stepparent'), ('Grandparent'),
  ('Foster_Parent'), ('Guardian'), ('Sibling'), ('Other')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.transport_staff_role_types (
  id   SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE
);
INSERT INTO public.transport_staff_role_types (name) VALUES
  ('Driver'), ('Assistant'), ('Coordinator')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.medical_alert_types (
  id               SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name             TEXT NOT NULL UNIQUE,
  default_severity SMALLINT NOT NULL DEFAULT 1
);
INSERT INTO public.medical_alert_types (name, default_severity) VALUES
  ('Allergy', 3), ('Medication', 2), ('Condition', 2), ('Dietary', 1)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.registration_status_types (
  id   SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL UNIQUE
);
INSERT INTO public.registration_status_types (name) VALUES
  ('Pending'), ('Approved'), ('Waitlisted'), ('Cancelled')
ON CONFLICT (name) DO NOTHING;


-- ---------------------------------------------------------------------------
-- STEP 3: Add church_id to existing tables
-- Column is added with a default so existing rows are backfilled immediately.
-- ---------------------------------------------------------------------------

ALTER TABLE public.admin_approvals
  ADD COLUMN IF NOT EXISTS church_id UUID
    NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
    REFERENCES public.churches(id);

ALTER TABLE public.admin_user_profiles
  ADD COLUMN IF NOT EXISTS church_id UUID
    NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
    REFERENCES public.churches(id);

ALTER TABLE public.ai_assistant_favorites
  ADD COLUMN IF NOT EXISTS church_id UUID
    NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
    REFERENCES public.churches(id);

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS church_id UUID
    NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
    REFERENCES public.churches(id);

ALTER TABLE public.livestream_recordings
  ADD COLUMN IF NOT EXISTS church_id UUID
    NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
    REFERENCES public.churches(id);

ALTER TABLE public.ministries
  ADD COLUMN IF NOT EXISTS church_id UUID
    NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
    REFERENCES public.churches(id);

ALTER TABLE public.prayer_requests
  ADD COLUMN IF NOT EXISTS church_id UUID
    NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
    REFERENCES public.churches(id);

ALTER TABLE public.sermons
  ADD COLUMN IF NOT EXISTS church_id UUID
    NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
    REFERENCES public.churches(id);

ALTER TABLE public.service_times
  ADD COLUMN IF NOT EXISTS church_id UUID
    NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
    REFERENCES public.churches(id);

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS church_id UUID
    NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
    REFERENCES public.churches(id);


-- ---------------------------------------------------------------------------
-- STEP 4: Extend the existing events table with transport columns
-- ---------------------------------------------------------------------------

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS church_id UUID
    NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
    REFERENCES public.churches(id),
  ADD COLUMN IF NOT EXISTS event_type_id            SMALLINT REFERENCES public.event_types(id),
  ADD COLUMN IF NOT EXISTS status_id                SMALLINT REFERENCES public.event_status_types(id),
  ADD COLUMN IF NOT EXISTS has_transport            BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS requires_registration    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS requires_permission_slip BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS max_capacity             SMALLINT,
  ADD COLUMN IF NOT EXISTS created_by               UUID REFERENCES auth.users(id);


-- ---------------------------------------------------------------------------
-- STEP 5: Fix site_settings primary key (key alone → composite church_id + key)
-- ---------------------------------------------------------------------------

-- Add church_id first so existing rows get backfilled
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS church_id UUID
    DEFAULT '00000000-0000-0000-0000-000000000001'
    REFERENCES public.churches(id);

-- Swap the PK — drop old, add composite
ALTER TABLE public.site_settings DROP CONSTRAINT IF EXISTS site_settings_pkey;
ALTER TABLE public.site_settings ALTER COLUMN church_id SET NOT NULL;
ALTER TABLE public.site_settings ADD PRIMARY KEY (church_id, key);


-- ---------------------------------------------------------------------------
-- STEP 6: Fix ministries slug uniqueness (was global, now per-church)
-- ---------------------------------------------------------------------------

ALTER TABLE public.ministries DROP CONSTRAINT IF EXISTS ministries_slug_key;
ALTER TABLE public.ministries ADD CONSTRAINT ministries_church_slug_unique UNIQUE (church_id, slug);


-- ---------------------------------------------------------------------------
-- STEP 7: Transport module — new tables
-- ---------------------------------------------------------------------------

-- People
CREATE TABLE IF NOT EXISTS public.member_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id  UUID NOT NULL REFERENCES public.churches(id),
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  phone      TEXT,
  photo_url  TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transport_staff_roles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id    UUID NOT NULL REFERENCES public.churches(id),
  user_id      UUID NOT NULL REFERENCES auth.users(id),
  role_type_id SMALLINT NOT NULL REFERENCES public.transport_staff_role_types(id),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (church_id, user_id, role_type_id)
);

-- Children
CREATE TABLE IF NOT EXISTS public.children (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id     UUID NOT NULL REFERENCES public.churches(id),
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  date_of_birth DATE,
  photo_url     TEXT,
  notes         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.child_guardians (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id             UUID NOT NULL REFERENCES public.children(id),
  member_id            UUID NOT NULL REFERENCES public.member_profiles(id),
  relationship_type_id SMALLINT NOT NULL REFERENCES public.relationship_types(id),
  is_primary_contact   BOOLEAN NOT NULL DEFAULT FALSE,
  can_pickup           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (child_id, member_id)
);

CREATE TABLE IF NOT EXISTS public.authorized_pickups (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id             UUID NOT NULL REFERENCES public.children(id),
  first_name           TEXT NOT NULL,
  last_name            TEXT NOT NULL,
  phone                TEXT,
  relationship_type_id SMALLINT REFERENCES public.relationship_types(id),
  photo_url            TEXT,
  notes                TEXT,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.child_medical_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id        UUID NOT NULL REFERENCES public.children(id),
  alert_type_id   SMALLINT NOT NULL REFERENCES public.medical_alert_types(id),
  severity        SMALLINT NOT NULL DEFAULT 1,
  description     TEXT NOT NULL,
  action_required TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assets
CREATE TABLE IF NOT EXISTS public.buses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id     UUID NOT NULL REFERENCES public.churches(id),
  name          TEXT NOT NULL,
  capacity      SMALLINT NOT NULL,
  license_plate TEXT,
  notes         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.event_buses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID NOT NULL REFERENCES public.events(id),
  bus_id           UUID NOT NULL REFERENCES public.buses(id),
  departure_time   TIMESTAMPTZ,
  estimated_return TIMESTAMPTZ,
  notes            TEXT,
  UNIQUE (event_id, bus_id)
);

CREATE TABLE IF NOT EXISTS public.route_stops (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_bus_id   UUID NOT NULL REFERENCES public.event_buses(id),
  stop_order     SMALLINT NOT NULL,
  stop_name      TEXT NOT NULL,
  address        TEXT,
  scheduled_time TIMESTAMPTZ,
  UNIQUE (event_bus_id, stop_order)
);

CREATE TABLE IF NOT EXISTS public.event_bus_staff (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_bus_id UUID NOT NULL REFERENCES public.event_buses(id),
  user_id      UUID NOT NULL REFERENCES auth.users(id),
  role_type_id SMALLINT NOT NULL REFERENCES public.transport_staff_role_types(id),
  UNIQUE (event_bus_id, user_id)
);

-- Registration
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id                 UUID NOT NULL REFERENCES public.churches(id),
  event_id                  UUID NOT NULL REFERENCES public.events(id),
  child_id                  UUID NOT NULL REFERENCES public.children(id),
  registered_by             UUID NOT NULL REFERENCES public.member_profiles(id),
  status_id                 SMALLINT NOT NULL REFERENCES public.registration_status_types(id),
  permission_slip_signed    BOOLEAN NOT NULL DEFAULT FALSE,
  permission_slip_signed_at TIMESTAMPTZ,
  permission_slip_signed_by UUID REFERENCES public.member_profiles(id),
  notes                     TEXT,
  registered_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, child_id)
);

CREATE TABLE IF NOT EXISTS public.child_bus_assignments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_registration_id UUID NOT NULL REFERENCES public.event_registrations(id),
  event_bus_id          UUID NOT NULL REFERENCES public.event_buses(id),
  seat_number           SMALLINT,
  assigned_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_registration_id)
);

-- Check-in audit log (immutable — never UPDATE or DELETE)
CREATE TABLE IF NOT EXISTS public.check_ins (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id        UUID NOT NULL REFERENCES public.churches(id),
  event_bus_id     UUID NOT NULL REFERENCES public.event_buses(id),
  child_id         UUID NOT NULL REFERENCES public.children(id),
  action_type_id   SMALLINT NOT NULL REFERENCES public.check_in_action_types(id),
  performed_by     UUID NOT NULL REFERENCES auth.users(id),
  action_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  latitude         NUMERIC(10, 8),
  longitude        NUMERIC(11, 8),
  mgrs_coordinate  TEXT,
  route_stop_id    UUID REFERENCES public.route_stops(id),
  released_to_id   UUID REFERENCES public.authorized_pickups(id),
  notes            TEXT
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id  UUID NOT NULL REFERENCES public.churches(id),
  member_id  UUID NOT NULL REFERENCES public.member_profiles(id),
  child_id   UUID NOT NULL REFERENCES public.children(id),
  channel_id SMALLINT NOT NULL REFERENCES public.notification_channels(id),
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (member_id, child_id, channel_id)
);

CREATE TABLE IF NOT EXISTS public.notification_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id       UUID NOT NULL REFERENCES public.check_ins(id),
  member_id         UUID NOT NULL REFERENCES public.member_profiles(id),
  channel_id        SMALLINT NOT NULL REFERENCES public.notification_channels(id),
  recipient_address TEXT NOT NULL,
  message_body      TEXT NOT NULL,
  sent_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at      TIMESTAMPTZ,
  error_message     TEXT
);


-- ---------------------------------------------------------------------------
-- STEP 8: Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_events_church_date     ON public.events(church_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_has_transport   ON public.events(church_id) WHERE has_transport = TRUE;
CREATE INDEX IF NOT EXISTS idx_check_ins_church       ON public.check_ins(church_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_event_bus    ON public.check_ins(event_bus_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_child        ON public.check_ins(child_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_timestamp    ON public.check_ins(action_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_event_reg_event        ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_child        ON public.event_registrations(child_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_church       ON public.event_registrations(church_id);
CREATE INDEX IF NOT EXISTS idx_children_church        ON public.children(church_id);
CREATE INDEX IF NOT EXISTS idx_children_name          ON public.children(church_id, last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_child_guardians_member ON public.child_guardians(member_id);
CREATE INDEX IF NOT EXISTS idx_child_guardians_child  ON public.child_guardians(child_id);
CREATE INDEX IF NOT EXISTS idx_notif_log_check_in     ON public.notification_log(check_in_id);
CREATE INDEX IF NOT EXISTS idx_notif_pref_member      ON public.notification_preferences(member_id);
