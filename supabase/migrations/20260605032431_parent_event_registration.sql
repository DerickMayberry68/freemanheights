-- Parent-facing event registration workflow.
-- Writes are exposed through narrow RPCs so child records remain protected by
-- the existing transport RLS policies.

CREATE OR REPLACE FUNCTION private.registration_church_id()
RETURNS uuid
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT '00000000-0000-0000-0000-000000000001'::uuid;
$$;

CREATE OR REPLACE FUNCTION private.upsert_parent_profile(
  p_first_name text,
  p_last_name text,
  p_phone text DEFAULT NULL
)
RETURNS public.member_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_profile public.member_profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NULLIF(BTRIM(p_first_name), '') IS NULL
     OR NULLIF(BTRIM(p_last_name), '') IS NULL THEN
    RAISE EXCEPTION 'First and last name are required';
  END IF;

  INSERT INTO public.member_profiles (
    id, church_id, first_name, last_name, phone, is_active
  )
  VALUES (
    auth.uid(),
    private.registration_church_id(),
    BTRIM(p_first_name),
    BTRIM(p_last_name),
    NULLIF(BTRIM(p_phone), ''),
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      phone = EXCLUDED.phone,
      updated_at = NOW()
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

CREATE OR REPLACE FUNCTION private.add_parent_child(
  p_first_name text,
  p_last_name text,
  p_date_of_birth date DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_relationship_type_id smallint DEFAULT 6
)
RETURNS public.children
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_child public.children;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.member_profiles
    WHERE id = auth.uid()
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Complete the parent profile first';
  END IF;

  IF NULLIF(BTRIM(p_first_name), '') IS NULL
     OR NULLIF(BTRIM(p_last_name), '') IS NULL THEN
    RAISE EXCEPTION 'Child first and last name are required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.relationship_types
    WHERE id = p_relationship_type_id
  ) THEN
    RAISE EXCEPTION 'Invalid relationship type';
  END IF;

  INSERT INTO public.children (
    church_id, first_name, last_name, date_of_birth, notes
  )
  VALUES (
    private.registration_church_id(),
    BTRIM(p_first_name),
    BTRIM(p_last_name),
    p_date_of_birth,
    NULLIF(BTRIM(p_notes), '')
  )
  RETURNING * INTO v_child;

  INSERT INTO public.child_guardians (
    child_id,
    member_id,
    relationship_type_id,
    is_primary_contact,
    can_pickup
  )
  VALUES (
    v_child.id,
    auth.uid(),
    p_relationship_type_id,
    true,
    true
  );

  RETURN v_child;
END;
$$;

CREATE OR REPLACE FUNCTION private.register_child_for_event(
  p_event_id uuid,
  p_child_id uuid,
  p_notes text DEFAULT NULL,
  p_permission_slip_signed boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_event public.events;
  v_registration public.event_registrations;
  v_status_id smallint;
  v_status_name text;
  v_active_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.child_guardians
    WHERE child_id = p_child_id
      AND member_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You are not a guardian for this child';
  END IF;

  SELECT *
  INTO v_event
  FROM public.events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND OR v_event.church_id <> private.registration_church_id() THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  IF NOT v_event.requires_registration OR v_event.registration_url IS NOT NULL THEN
    RAISE EXCEPTION 'This event does not use internal registration';
  END IF;

  IF v_event.is_cancelled OR v_event.event_date <= NOW() THEN
    RAISE EXCEPTION 'Registration is closed for this event';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.event_registrations
    WHERE event_id = p_event_id
      AND child_id = p_child_id
  ) THEN
    RAISE EXCEPTION 'This child is already registered for the event';
  END IF;

  SELECT COUNT(*)
  INTO v_active_count
  FROM public.event_registrations er
  JOIN public.registration_status_types rst ON rst.id = er.status_id
  WHERE er.event_id = p_event_id
    AND rst.name IN ('Pending', 'Approved');

  v_status_name := CASE
    WHEN v_event.max_capacity IS NOT NULL
      AND v_active_count >= v_event.max_capacity
    THEN 'Waitlisted'
    ELSE 'Pending'
  END;

  SELECT id
  INTO v_status_id
  FROM public.registration_status_types
  WHERE name = v_status_name;

  IF v_status_id IS NULL THEN
    RAISE EXCEPTION 'Registration statuses are not configured';
  END IF;

  INSERT INTO public.event_registrations (
    church_id,
    event_id,
    child_id,
    registered_by,
    status_id,
    permission_slip_signed,
    permission_slip_signed_at,
    permission_slip_signed_by,
    notes
  )
  VALUES (
    v_event.church_id,
    p_event_id,
    p_child_id,
    auth.uid(),
    v_status_id,
    p_permission_slip_signed AND v_event.requires_permission_slip,
    CASE
      WHEN p_permission_slip_signed AND v_event.requires_permission_slip
      THEN NOW()
      ELSE NULL
    END,
    CASE
      WHEN p_permission_slip_signed AND v_event.requires_permission_slip
      THEN auth.uid()
      ELSE NULL
    END,
    NULLIF(BTRIM(p_notes), '')
  )
  RETURNING * INTO v_registration;

  RETURN jsonb_build_object(
    'id', v_registration.id,
    'status', v_status_name,
    'registered_at', v_registration.registered_at
  );
END;
$$;

REVOKE ALL ON FUNCTION private.registration_church_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.upsert_parent_profile(text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.add_parent_child(text, text, date, text, smallint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.register_child_for_event(uuid, uuid, text, boolean) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.registration_church_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.upsert_parent_profile(text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.add_parent_child(text, text, date, text, smallint) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.register_child_for_event(uuid, uuid, text, boolean) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.upsert_parent_profile(
  p_first_name text,
  p_last_name text,
  p_phone text DEFAULT NULL
)
RETURNS public.member_profiles
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.upsert_parent_profile(p_first_name, p_last_name, p_phone);
$$;

CREATE OR REPLACE FUNCTION public.add_parent_child(
  p_first_name text,
  p_last_name text,
  p_date_of_birth date DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_relationship_type_id smallint DEFAULT 6
)
RETURNS public.children
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.add_parent_child(
    p_first_name,
    p_last_name,
    p_date_of_birth,
    p_notes,
    p_relationship_type_id
  );
$$;

CREATE OR REPLACE FUNCTION public.register_child_for_event(
  p_event_id uuid,
  p_child_id uuid,
  p_notes text DEFAULT NULL,
  p_permission_slip_signed boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.register_child_for_event(
    p_event_id,
    p_child_id,
    p_notes,
    p_permission_slip_signed
  );
$$;

REVOKE ALL ON FUNCTION public.upsert_parent_profile(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.add_parent_child(text, text, date, text, smallint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.register_child_for_event(uuid, uuid, text, boolean) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.upsert_parent_profile(text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.add_parent_child(text, text, date, text, smallint) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.register_child_for_event(uuid, uuid, text, boolean) TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_status
  ON public.event_registrations(event_id, status_id);
