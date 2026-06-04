-- Secure the transport/mobile module before public release.
-- These tables contain child, guardian, pickup, medical, route, and check-in data.

-- ---------------------------------------------------------------------------
-- Helper predicates used by RLS policies.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.transport_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.has_admin_role('editor'), false);
$$;

CREATE OR REPLACE FUNCTION public.transport_is_staff_for_church(p_church_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.transport_is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.transport_staff_roles tsr
      WHERE tsr.user_id = auth.uid()
        AND tsr.church_id = p_church_id
        AND tsr.is_active = true
    );
$$;

CREATE OR REPLACE FUNCTION public.transport_can_access_event_bus(p_event_bus_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.transport_is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.event_bus_staff ebs
      WHERE ebs.event_bus_id = p_event_bus_id
        AND ebs.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.event_buses eb
      JOIN public.events e ON e.id = eb.event_id
      JOIN public.transport_staff_roles tsr ON tsr.church_id = e.church_id
      JOIN public.transport_staff_role_types tsrt ON tsrt.id = tsr.role_type_id
      WHERE eb.id = p_event_bus_id
        AND tsr.user_id = auth.uid()
        AND tsr.is_active = true
        AND tsrt.name = 'Coordinator'
    );
$$;

CREATE OR REPLACE FUNCTION public.transport_child_assigned_to_event_bus(
  p_child_id uuid,
  p_event_bus_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.child_bus_assignments cba
    JOIN public.event_registrations er ON er.id = cba.event_registration_id
    WHERE cba.event_bus_id = p_event_bus_id
      AND er.child_id = p_child_id
  );
$$;

CREATE OR REPLACE FUNCTION public.transport_can_access_child(p_child_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.transport_is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.child_guardians cg
      WHERE cg.child_id = p_child_id
        AND cg.member_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.child_bus_assignments cba
      JOIN public.event_registrations er ON er.id = cba.event_registration_id
      WHERE er.child_id = p_child_id
        AND public.transport_can_access_event_bus(cba.event_bus_id)
    );
$$;

CREATE OR REPLACE FUNCTION public.transport_can_access_registration(p_registration_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.transport_is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.event_registrations er
      WHERE er.id = p_registration_id
        AND (
          er.registered_by = auth.uid()
          OR public.transport_can_access_child(er.child_id)
          OR EXISTS (
            SELECT 1
            FROM public.child_bus_assignments cba
            WHERE cba.event_registration_id = er.id
              AND public.transport_can_access_event_bus(cba.event_bus_id)
          )
        )
    );
$$;

REVOKE ALL ON FUNCTION public.transport_is_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.transport_is_staff_for_church(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.transport_can_access_event_bus(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.transport_child_assigned_to_event_bus(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.transport_can_access_child(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.transport_can_access_registration(uuid) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS and remove anonymous mutation surface.
-- ---------------------------------------------------------------------------

ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_status_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_in_action_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_staff_role_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_alert_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_status_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_medical_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_bus_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_bus_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.member_profiles,
  public.transport_staff_roles,
  public.children,
  public.child_guardians,
  public.authorized_pickups,
  public.child_medical_alerts,
  public.buses,
  public.event_buses,
  public.route_stops,
  public.event_bus_staff,
  public.event_registrations,
  public.child_bus_assignments,
  public.check_ins,
  public.notification_preferences,
  public.notification_log
FROM anon;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE
  public.churches,
  public.event_types,
  public.event_status_types,
  public.check_in_action_types,
  public.notification_channels,
  public.relationship_types,
  public.transport_staff_role_types,
  public.medical_alert_types,
  public.registration_status_types
FROM anon, authenticated;

GRANT SELECT ON TABLE
  public.churches,
  public.event_types,
  public.event_status_types,
  public.check_in_action_types,
  public.notification_channels,
  public.relationship_types,
  public.transport_staff_role_types,
  public.medical_alert_types,
  public.registration_status_types
TO anon, authenticated;

GRANT SELECT ON TABLE
  public.member_profiles,
  public.transport_staff_roles,
  public.children,
  public.child_guardians,
  public.authorized_pickups,
  public.child_medical_alerts,
  public.buses,
  public.event_buses,
  public.route_stops,
  public.event_bus_staff,
  public.event_registrations,
  public.child_bus_assignments,
  public.check_ins,
  public.notification_preferences,
  public.notification_log
TO authenticated;

GRANT INSERT ON TABLE public.check_ins TO authenticated;

GRANT INSERT, UPDATE, DELETE ON TABLE
  public.member_profiles,
  public.transport_staff_roles,
  public.children,
  public.child_guardians,
  public.authorized_pickups,
  public.child_medical_alerts,
  public.buses,
  public.event_buses,
  public.route_stops,
  public.event_bus_staff,
  public.event_registrations,
  public.child_bus_assignments,
  public.notification_preferences
TO authenticated;

-- ---------------------------------------------------------------------------
-- Drop prior transport policy names, then recreate the intended policy set.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'churches',
        'event_types',
        'event_status_types',
        'check_in_action_types',
        'notification_channels',
        'relationship_types',
        'transport_staff_role_types',
        'medical_alert_types',
        'registration_status_types',
        'member_profiles',
        'transport_staff_roles',
        'children',
        'child_guardians',
        'authorized_pickups',
        'child_medical_alerts',
        'buses',
        'event_buses',
        'route_stops',
        'event_bus_staff',
        'event_registrations',
        'child_bus_assignments',
        'check_ins',
        'notification_preferences',
        'notification_log'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  END LOOP;
END $$;

-- Public/read-only lookup data.
CREATE POLICY "churches_public_read"
  ON public.churches FOR SELECT
  USING (is_active = true);

CREATE POLICY "event_types_public_read"
  ON public.event_types FOR SELECT
  USING (true);

CREATE POLICY "event_status_types_public_read"
  ON public.event_status_types FOR SELECT
  USING (true);

CREATE POLICY "check_in_action_types_public_read"
  ON public.check_in_action_types FOR SELECT
  USING (true);

CREATE POLICY "notification_channels_public_read"
  ON public.notification_channels FOR SELECT
  USING (true);

CREATE POLICY "relationship_types_public_read"
  ON public.relationship_types FOR SELECT
  USING (true);

CREATE POLICY "transport_staff_role_types_public_read"
  ON public.transport_staff_role_types FOR SELECT
  USING (true);

CREATE POLICY "medical_alert_types_public_read"
  ON public.medical_alert_types FOR SELECT
  USING (true);

CREATE POLICY "registration_status_types_public_read"
  ON public.registration_status_types FOR SELECT
  USING (true);

-- Profiles and staff assignment.
CREATE POLICY "member_profiles_self_or_admin_read"
  ON public.member_profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.transport_is_staff_for_church(church_id));

CREATE POLICY "member_profiles_admin_manage"
  ON public.member_profiles FOR ALL TO authenticated
  USING (public.transport_is_admin())
  WITH CHECK (public.transport_is_admin());

CREATE POLICY "transport_staff_roles_self_or_admin_read"
  ON public.transport_staff_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.transport_is_staff_for_church(church_id));

CREATE POLICY "transport_staff_roles_admin_manage"
  ON public.transport_staff_roles FOR ALL TO authenticated
  USING (public.transport_is_admin())
  WITH CHECK (public.transport_is_admin());

-- Children and related child data.
CREATE POLICY "children_transport_read"
  ON public.children FOR SELECT TO authenticated
  USING (public.transport_can_access_child(id));

CREATE POLICY "children_admin_manage"
  ON public.children FOR ALL TO authenticated
  USING (public.transport_is_admin())
  WITH CHECK (public.transport_is_admin());

CREATE POLICY "child_guardians_transport_read"
  ON public.child_guardians FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR public.transport_can_access_child(child_id));

CREATE POLICY "child_guardians_admin_manage"
  ON public.child_guardians FOR ALL TO authenticated
  USING (public.transport_is_admin())
  WITH CHECK (public.transport_is_admin());

CREATE POLICY "authorized_pickups_transport_read"
  ON public.authorized_pickups FOR SELECT TO authenticated
  USING (public.transport_can_access_child(child_id));

CREATE POLICY "authorized_pickups_admin_manage"
  ON public.authorized_pickups FOR ALL TO authenticated
  USING (public.transport_is_admin())
  WITH CHECK (public.transport_is_admin());

CREATE POLICY "child_medical_alerts_transport_read"
  ON public.child_medical_alerts FOR SELECT TO authenticated
  USING (public.transport_can_access_child(child_id));

CREATE POLICY "child_medical_alerts_admin_manage"
  ON public.child_medical_alerts FOR ALL TO authenticated
  USING (public.transport_is_admin())
  WITH CHECK (public.transport_is_admin());

-- Transport assets, bus assignments, and route details.
CREATE POLICY "buses_transport_read"
  ON public.buses FOR SELECT TO authenticated
  USING (
    public.transport_is_staff_for_church(church_id)
    OR EXISTS (
      SELECT 1
      FROM public.event_buses eb
      WHERE eb.bus_id = buses.id
        AND public.transport_can_access_event_bus(eb.id)
    )
  );

CREATE POLICY "buses_admin_manage"
  ON public.buses FOR ALL TO authenticated
  USING (public.transport_is_admin())
  WITH CHECK (public.transport_is_admin());

CREATE POLICY "event_buses_transport_read"
  ON public.event_buses FOR SELECT TO authenticated
  USING (public.transport_can_access_event_bus(id));

CREATE POLICY "event_buses_admin_manage"
  ON public.event_buses FOR ALL TO authenticated
  USING (public.transport_is_admin())
  WITH CHECK (public.transport_is_admin());

CREATE POLICY "route_stops_transport_read"
  ON public.route_stops FOR SELECT TO authenticated
  USING (public.transport_can_access_event_bus(event_bus_id));

CREATE POLICY "route_stops_admin_manage"
  ON public.route_stops FOR ALL TO authenticated
  USING (public.transport_is_admin())
  WITH CHECK (public.transport_is_admin());

CREATE POLICY "event_bus_staff_transport_read"
  ON public.event_bus_staff FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.transport_can_access_event_bus(event_bus_id));

CREATE POLICY "event_bus_staff_admin_manage"
  ON public.event_bus_staff FOR ALL TO authenticated
  USING (public.transport_is_admin())
  WITH CHECK (public.transport_is_admin());

-- Registration and manifest data.
CREATE POLICY "event_registrations_transport_read"
  ON public.event_registrations FOR SELECT TO authenticated
  USING (public.transport_can_access_registration(id));

CREATE POLICY "event_registrations_admin_manage"
  ON public.event_registrations FOR ALL TO authenticated
  USING (public.transport_is_admin())
  WITH CHECK (public.transport_is_admin());

CREATE POLICY "child_bus_assignments_transport_read"
  ON public.child_bus_assignments FOR SELECT TO authenticated
  USING (
    public.transport_can_access_event_bus(event_bus_id)
    OR public.transport_can_access_registration(event_registration_id)
  );

CREATE POLICY "child_bus_assignments_admin_manage"
  ON public.child_bus_assignments FOR ALL TO authenticated
  USING (public.transport_is_admin())
  WITH CHECK (public.transport_is_admin());

-- Check-in audit log. Staff can read assigned-bus history and append their own
-- check-ins only for children assigned to that bus.
CREATE POLICY "check_ins_transport_read"
  ON public.check_ins FOR SELECT TO authenticated
  USING (
    public.transport_can_access_event_bus(event_bus_id)
    OR public.transport_can_access_child(child_id)
  );

CREATE POLICY "check_ins_transport_insert"
  ON public.check_ins FOR INSERT TO authenticated
  WITH CHECK (
    performed_by = auth.uid()
    AND public.transport_can_access_event_bus(event_bus_id)
    AND public.transport_child_assigned_to_event_bus(child_id, event_bus_id)
  );

-- Notifications remain private to admins and the member they target.
CREATE POLICY "notification_preferences_member_or_admin_read"
  ON public.notification_preferences FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR public.transport_is_admin());

CREATE POLICY "notification_preferences_admin_manage"
  ON public.notification_preferences FOR ALL TO authenticated
  USING (public.transport_is_admin())
  WITH CHECK (public.transport_is_admin());

CREATE POLICY "notification_log_member_or_admin_read"
  ON public.notification_log FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR public.transport_is_admin());
