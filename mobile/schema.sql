-- =============================================================================
-- Freeman Heights Church Platform — Full Schema
-- SaaS-ready multi-tenant architecture
-- All content tables scoped by church_id.
-- Global reference tables (bible_translations, bible_verses, lookup/enum tables)
-- have no church_id — they are shared across all tenants.
-- =============================================================================


-- =============================================================================
-- TENANT ROOT
-- =============================================================================

CREATE TABLE public.churches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  address      TEXT,
  city         TEXT,
  state        TEXT,
  zip          TEXT,
  phone        TEXT,
  email        TEXT,
  website_url  TEXT,
  logo_url     TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- LOOKUP TABLES (global, no church_id — become Dart/TypeScript enums)
-- Seed order matters — Dart enum extensions resolve by index (id - 1).
-- =============================================================================

CREATE TABLE public.event_types (
  id    SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name  TEXT NOT NULL UNIQUE
  -- 1=General, 2=AWANA, 3=Sunday_Service, 4=Camp_Trip,
  -- 5=Field_Trip, 6=Youth_Group, 7=VBS, 8=Other
);

CREATE TABLE public.event_status_types (
  id    SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name  TEXT NOT NULL UNIQUE
  -- 1=Draft, 2=Published, 3=Active, 4=Completed, 5=Cancelled
);

CREATE TABLE public.check_in_action_types (
  id    SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name  TEXT NOT NULL UNIQUE
  -- 1=Boarded, 2=Departed, 3=Arrived, 4=Released, 5=No_Show
);

CREATE TABLE public.notification_channels (
  id    SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name  TEXT NOT NULL UNIQUE
  -- 1=SMS, 2=Email, 3=Push
);

CREATE TABLE public.relationship_types (
  id    SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name  TEXT NOT NULL UNIQUE
  -- 1=Father, 2=Mother, 3=Stepparent, 4=Grandparent,
  -- 5=Foster_Parent, 6=Guardian, 7=Sibling, 8=Other
);

CREATE TABLE public.transport_staff_role_types (
  id    SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name  TEXT NOT NULL UNIQUE
  -- 1=Driver, 2=Assistant, 3=Coordinator
);

CREATE TABLE public.medical_alert_types (
  id               SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name             TEXT NOT NULL UNIQUE,
  -- 1=Allergy, 2=Medication, 3=Condition, 4=Dietary
  default_severity SMALLINT NOT NULL DEFAULT 1
  -- 1=Info, 2=Warning, 3=Critical
);

CREATE TABLE public.registration_status_types (
  id    SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name  TEXT NOT NULL UNIQUE
  -- 1=Pending, 2=Approved, 3=Waitlisted, 4=Cancelled
);


-- =============================================================================
-- GLOBAL REFERENCE TABLES (no church_id — shared across all tenants)
-- =============================================================================

CREATE TABLE public.bible_translations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  abbreviation  TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.bible_verses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  verse_text    TEXT NOT NULL,
  reference     TEXT NOT NULL,
  book          TEXT NOT NULL,
  chapter       INTEGER,
  verse_start   INTEGER,
  verse_end     INTEGER,
  category      TEXT,
  display_order INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  translation   TEXT DEFAULT 'KJV',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================================================
-- CMS / WEBSITE TABLES (church_id added for multi-tenancy)
-- =============================================================================

CREATE TABLE public.admin_approvals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   UUID NOT NULL REFERENCES public.churches(id),
  user_id     UUID NOT NULL,
  email       TEXT NOT NULL,
  approved    BOOLEAN NOT NULL DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  role        TEXT NOT NULL DEFAULT 'editor'
              CHECK (role = ANY (ARRAY['admin','editor','viewer'])),
  UNIQUE (church_id, user_id)
);

CREATE TABLE public.admin_user_profiles (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id),
  church_id  UUID NOT NULL REFERENCES public.churches(id),
  full_name  TEXT,
  phone      TEXT,
  title      TEXT,
  notes      TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.ai_assistant_favorites (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id               UUID NOT NULL REFERENCES public.churches(id),
  user_id                 UUID NOT NULL REFERENCES auth.users(id),
  assistant_response      TEXT NOT NULL,
  query_type              TEXT NOT NULL
                          CHECK (query_type = ANY (ARRAY[
                            'bible_search','cross_reference',
                            'verse_context','sermon_ideas'
                          ])),
  user_query              TEXT NOT NULL,
  primary_verse_reference TEXT,
  related_verses          TEXT[],
  title                   TEXT,
  notes                   TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.announcements (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id  UUID NOT NULL REFERENCES public.churches(id),
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date   TIMESTAMPTZ,
  priority   INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 10),
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ministries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id       UUID NOT NULL REFERENCES public.churches(id),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  description     TEXT,
  leader_name     TEXT,
  leader_email    TEXT,
  image_url       TEXT,
  meeting_time    TEXT,
  target_audience TEXT,
  display_order   INTEGER,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (church_id, slug)
);

-- Extended with transport and registration columns (all nullable — existing rows unaffected).
-- registration_url kept for external sign-up links.
-- When requires_registration = TRUE and registration_url IS NULL,
-- the app uses the event_registrations table instead.
CREATE TABLE public.events (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id                UUID NOT NULL REFERENCES public.churches(id),
  ministry_id              UUID REFERENCES public.ministries(id),
  event_type_id            SMALLINT REFERENCES public.event_types(id),
  status_id                SMALLINT REFERENCES public.event_status_types(id),
  title                    TEXT NOT NULL,
  description              TEXT,
  event_date               TIMESTAMPTZ NOT NULL,
  end_date                 TIMESTAMPTZ,
  location                 TEXT,
  image_url                TEXT,
  registration_url         TEXT,
  is_featured              BOOLEAN DEFAULT FALSE,
  has_transport            BOOLEAN NOT NULL DEFAULT FALSE,
  requires_registration    BOOLEAN NOT NULL DEFAULT FALSE,
  requires_permission_slip BOOLEAN NOT NULL DEFAULT FALSE,
  max_capacity             SMALLINT,
  created_by               UUID REFERENCES auth.users(id),
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.livestream_recordings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id        UUID NOT NULL REFERENCES public.churches(id),
  title            TEXT,
  storage_path     TEXT NOT NULL,
  file_url         TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  created_by       UUID REFERENCES auth.users(id)
);

CREATE TABLE public.prayer_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id       UUID NOT NULL REFERENCES public.churches(id),
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  request         TEXT NOT NULL,
  is_public       BOOLEAN DEFAULT FALSE,
  is_answered     BOOLEAN DEFAULT FALSE,
  birthday        DATE,
  responded_at    TIMESTAMPTZ,
  responded_by    UUID REFERENCES auth.users(id),
  response_method TEXT CHECK (response_method IS NULL OR response_method = ANY (ARRAY[
                    'phone','email','text','in_person','push_notification','other'
                  ])),
  response_notes  TEXT,
  admin_notes     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.sermons (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id           UUID NOT NULL REFERENCES public.churches(id),
  title               TEXT NOT NULL,
  speaker             TEXT NOT NULL,
  sermon_date         DATE NOT NULL,
  scripture_reference TEXT,
  description         TEXT,
  video_url           TEXT,
  audio_url           TEXT,
  notes_url           TEXT,
  series              TEXT,
  is_featured         BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.service_times (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id     UUID NOT NULL REFERENCES public.churches(id),
  day_of_week   TEXT NOT NULL CHECK (day_of_week = ANY (ARRAY[
                  'Sunday','Monday','Tuesday','Wednesday',
                  'Thursday','Friday','Saturday'
                ])),
  time          TEXT NOT NULL,
  service_type  TEXT,
  description   TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  display_order INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Composite PK: each church has its own set of keys.
CREATE TABLE public.site_settings (
  church_id UUID NOT NULL REFERENCES public.churches(id),
  key       TEXT NOT NULL,
  value     TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (church_id, key)
);

-- Website display staff (bio, photo). NOT linked to auth.users.
-- Transport staff who need app logins use transport_staff_roles instead.
CREATE TABLE public.staff (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id     UUID NOT NULL REFERENCES public.churches(id),
  name          TEXT NOT NULL,
  role          TEXT NOT NULL,
  bio           TEXT,
  email         TEXT,
  phone         TEXT,
  image_url     TEXT,
  display_order INTEGER,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Per-user, not per-church — Bible translation preference follows the person.
CREATE TABLE public.user_preferences (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                     UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  preferred_bible_translation TEXT DEFAULT 'KJV',
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================================================
-- TRANSPORT MODULE — PEOPLE
-- =============================================================================

CREATE TABLE public.member_profiles (
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

CREATE TABLE public.transport_staff_roles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id    UUID NOT NULL REFERENCES public.churches(id),
  user_id      UUID NOT NULL REFERENCES auth.users(id),
  role_type_id SMALLINT NOT NULL REFERENCES public.transport_staff_role_types(id),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (church_id, user_id, role_type_id)
);


-- =============================================================================
-- TRANSPORT MODULE — CHILDREN
-- =============================================================================

CREATE TABLE public.children (
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

CREATE TABLE public.child_guardians (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id             UUID NOT NULL REFERENCES public.children(id),
  member_id            UUID NOT NULL REFERENCES public.member_profiles(id),
  relationship_type_id SMALLINT NOT NULL REFERENCES public.relationship_types(id),
  is_primary_contact   BOOLEAN NOT NULL DEFAULT FALSE,
  can_pickup           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (child_id, member_id)
);

CREATE TABLE public.authorized_pickups (
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

CREATE TABLE public.child_medical_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id        UUID NOT NULL REFERENCES public.children(id),
  alert_type_id   SMALLINT NOT NULL REFERENCES public.medical_alert_types(id),
  severity        SMALLINT NOT NULL DEFAULT 1,
  description     TEXT NOT NULL,
  action_required TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =============================================================================
-- TRANSPORT MODULE — ASSETS & ASSIGNMENTS
-- =============================================================================

CREATE TABLE public.buses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id     UUID NOT NULL REFERENCES public.churches(id),
  name          TEXT NOT NULL,
  capacity      SMALLINT NOT NULL,
  license_plate TEXT,
  notes         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE public.event_buses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID NOT NULL REFERENCES public.events(id),
  bus_id           UUID NOT NULL REFERENCES public.buses(id),
  departure_time   TIMESTAMPTZ,
  estimated_return TIMESTAMPTZ,
  notes            TEXT,
  UNIQUE (event_id, bus_id)
);

CREATE TABLE public.route_stops (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_bus_id   UUID NOT NULL REFERENCES public.event_buses(id),
  stop_order     SMALLINT NOT NULL,
  stop_name      TEXT NOT NULL,
  address        TEXT,
  scheduled_time TIMESTAMPTZ,
  UNIQUE (event_bus_id, stop_order)
);

CREATE TABLE public.event_bus_staff (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_bus_id UUID NOT NULL REFERENCES public.event_buses(id),
  user_id      UUID NOT NULL REFERENCES auth.users(id),
  role_type_id SMALLINT NOT NULL REFERENCES public.transport_staff_role_types(id),
  UNIQUE (event_bus_id, user_id)
);


-- =============================================================================
-- TRANSPORT MODULE — REGISTRATION
-- =============================================================================

CREATE TABLE public.event_registrations (
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

CREATE TABLE public.child_bus_assignments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_registration_id UUID NOT NULL REFERENCES public.event_registrations(id),
  event_bus_id          UUID NOT NULL REFERENCES public.event_buses(id),
  seat_number           SMALLINT,
  assigned_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_registration_id)
);


-- =============================================================================
-- TRANSPORT MODULE — CHECK-IN AUDIT LOG
-- =============================================================================

-- Immutable audit log. Never UPDATE or DELETE rows here.
-- church_id stored directly for fast RLS without multi-table joins.
CREATE TABLE public.check_ins (
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


-- =============================================================================
-- TRANSPORT MODULE — NOTIFICATIONS
-- =============================================================================

CREATE TABLE public.notification_preferences (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id  UUID NOT NULL REFERENCES public.churches(id),
  member_id  UUID NOT NULL REFERENCES public.member_profiles(id),
  child_id   UUID NOT NULL REFERENCES public.children(id),
  channel_id SMALLINT NOT NULL REFERENCES public.notification_channels(id),
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (member_id, child_id, channel_id)
);

CREATE TABLE public.notification_log (
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


-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_events_church_date       ON public.events(church_id, event_date DESC);
CREATE INDEX idx_events_has_transport     ON public.events(church_id) WHERE has_transport = TRUE;
CREATE INDEX idx_check_ins_church         ON public.check_ins(church_id);
CREATE INDEX idx_check_ins_event_bus      ON public.check_ins(event_bus_id);
CREATE INDEX idx_check_ins_child          ON public.check_ins(child_id);
CREATE INDEX idx_check_ins_timestamp      ON public.check_ins(action_timestamp DESC);
CREATE INDEX idx_event_reg_event          ON public.event_registrations(event_id);
CREATE INDEX idx_event_reg_child          ON public.event_registrations(child_id);
CREATE INDEX idx_event_reg_church         ON public.event_registrations(church_id);
CREATE INDEX idx_children_church          ON public.children(church_id);
CREATE INDEX idx_children_name            ON public.children(church_id, last_name, first_name);
CREATE INDEX idx_child_guardians_member   ON public.child_guardians(member_id);
CREATE INDEX idx_child_guardians_child    ON public.child_guardians(child_id);
CREATE INDEX idx_notif_log_check_in       ON public.notification_log(check_in_id);
CREATE INDEX idx_notif_pref_member        ON public.notification_preferences(member_id);


-- =============================================================================
-- SEED DATA — Freeman Heights (tenant 0)
-- =============================================================================

INSERT INTO public.churches (id, name, address, city, state, zip, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Freeman Heights Baptist Church',
  '522 Freeman Street',
  'Berryville',
  'AR',
  '72616',
  TRUE
);

INSERT INTO public.event_types (name) VALUES
  ('General'), ('AWANA'), ('Sunday_Service'), ('Camp_Trip'),
  ('Field_Trip'), ('Youth_Group'), ('VBS'), ('Other');

INSERT INTO public.event_status_types (name) VALUES
  ('Draft'), ('Published'), ('Active'), ('Completed'), ('Cancelled');

INSERT INTO public.check_in_action_types (name) VALUES
  ('Boarded'), ('Departed'), ('Arrived'), ('Released'), ('No_Show');

INSERT INTO public.notification_channels (name) VALUES
  ('SMS'), ('Email'), ('Push');

INSERT INTO public.relationship_types (name) VALUES
  ('Father'), ('Mother'), ('Stepparent'), ('Grandparent'),
  ('Foster_Parent'), ('Guardian'), ('Sibling'), ('Other');

INSERT INTO public.transport_staff_role_types (name) VALUES
  ('Driver'), ('Assistant'), ('Coordinator');

INSERT INTO public.medical_alert_types (name, default_severity) VALUES
  ('Allergy', 3), ('Medication', 2), ('Condition', 2), ('Dietary', 1);

INSERT INTO public.registration_status_types (name) VALUES
  ('Pending'), ('Approved'), ('Waitlisted'), ('Cancelled');
