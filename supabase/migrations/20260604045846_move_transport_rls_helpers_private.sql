-- Move transport RLS helper functions out of the exposed public API schema.

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.transport_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT COALESCE(public.has_admin_role('editor'), false);
$$;

CREATE OR REPLACE FUNCTION private.transport_is_staff_for_church(p_church_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT private.transport_is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.transport_staff_roles tsr
      WHERE tsr.user_id = auth.uid()
        AND tsr.church_id = p_church_id
        AND tsr.is_active = true
    );
$$;

CREATE OR REPLACE FUNCTION private.transport_can_access_event_bus(p_event_bus_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT private.transport_is_admin()
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

CREATE OR REPLACE FUNCTION private.transport_child_assigned_to_event_bus(
  p_child_id uuid,
  p_event_bus_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.child_bus_assignments cba
    JOIN public.event_registrations er ON er.id = cba.event_registration_id
    WHERE cba.event_bus_id = p_event_bus_id
      AND er.child_id = p_child_id
  );
$$;

CREATE OR REPLACE FUNCTION private.transport_can_access_child(p_child_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT private.transport_is_admin()
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
        AND private.transport_can_access_event_bus(cba.event_bus_id)
    );
$$;

CREATE OR REPLACE FUNCTION private.transport_can_access_registration(p_registration_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT private.transport_is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.event_registrations er
      WHERE er.id = p_registration_id
        AND (
          er.registered_by = auth.uid()
          OR private.transport_can_access_child(er.child_id)
          OR EXISTS (
            SELECT 1
            FROM public.child_bus_assignments cba
            WHERE cba.event_registration_id = er.id
              AND private.transport_can_access_event_bus(cba.event_bus_id)
          )
        )
    );
$$;

REVOKE ALL ON FUNCTION private.transport_is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.transport_is_staff_for_church(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.transport_can_access_event_bus(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.transport_child_assigned_to_event_bus(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.transport_can_access_child(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.transport_can_access_registration(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.transport_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.transport_is_staff_for_church(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.transport_can_access_event_bus(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.transport_child_assigned_to_event_bus(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.transport_can_access_child(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.transport_can_access_registration(uuid) TO authenticated;

DROP POLICY IF EXISTS "member_profiles_self_or_admin_read" ON public.member_profiles;
DROP POLICY IF EXISTS "member_profiles_admin_manage" ON public.member_profiles;
DROP POLICY IF EXISTS "transport_staff_roles_self_or_admin_read" ON public.transport_staff_roles;
DROP POLICY IF EXISTS "transport_staff_roles_admin_manage" ON public.transport_staff_roles;
DROP POLICY IF EXISTS "children_transport_read" ON public.children;
DROP POLICY IF EXISTS "children_admin_manage" ON public.children;
DROP POLICY IF EXISTS "child_guardians_transport_read" ON public.child_guardians;
DROP POLICY IF EXISTS "child_guardians_admin_manage" ON public.child_guardians;
DROP POLICY IF EXISTS "authorized_pickups_transport_read" ON public.authorized_pickups;
DROP POLICY IF EXISTS "authorized_pickups_admin_manage" ON public.authorized_pickups;
DROP POLICY IF EXISTS "child_medical_alerts_transport_read" ON public.child_medical_alerts;
DROP POLICY IF EXISTS "child_medical_alerts_admin_manage" ON public.child_medical_alerts;
DROP POLICY IF EXISTS "buses_transport_read" ON public.buses;
DROP POLICY IF EXISTS "buses_admin_manage" ON public.buses;
DROP POLICY IF EXISTS "event_buses_transport_read" ON public.event_buses;
DROP POLICY IF EXISTS "event_buses_admin_manage" ON public.event_buses;
DROP POLICY IF EXISTS "route_stops_transport_read" ON public.route_stops;
DROP POLICY IF EXISTS "route_stops_admin_manage" ON public.route_stops;
DROP POLICY IF EXISTS "event_bus_staff_transport_read" ON public.event_bus_staff;
DROP POLICY IF EXISTS "event_bus_staff_admin_manage" ON public.event_bus_staff;
DROP POLICY IF EXISTS "event_registrations_transport_read" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_manage" ON public.event_registrations;
DROP POLICY IF EXISTS "child_bus_assignments_transport_read" ON public.child_bus_assignments;
DROP POLICY IF EXISTS "child_bus_assignments_admin_manage" ON public.child_bus_assignments;
DROP POLICY IF EXISTS "check_ins_transport_read" ON public.check_ins;
DROP POLICY IF EXISTS "check_ins_transport_insert" ON public.check_ins;
DROP POLICY IF EXISTS "notification_preferences_member_or_admin_read" ON public.notification_preferences;
DROP POLICY IF EXISTS "notification_preferences_admin_manage" ON public.notification_preferences;
DROP POLICY IF EXISTS "notification_log_member_or_admin_read" ON public.notification_log;

CREATE POLICY "member_profiles_self_or_admin_read"
  ON public.member_profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR private.transport_is_staff_for_church(church_id));

CREATE POLICY "member_profiles_admin_manage"
  ON public.member_profiles FOR ALL TO authenticated
  USING (private.transport_is_admin())
  WITH CHECK (private.transport_is_admin());

CREATE POLICY "transport_staff_roles_self_or_admin_read"
  ON public.transport_staff_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.transport_is_staff_for_church(church_id));

CREATE POLICY "transport_staff_roles_admin_manage"
  ON public.transport_staff_roles FOR ALL TO authenticated
  USING (private.transport_is_admin())
  WITH CHECK (private.transport_is_admin());

CREATE POLICY "children_transport_read"
  ON public.children FOR SELECT TO authenticated
  USING (private.transport_can_access_child(id));

CREATE POLICY "children_admin_manage"
  ON public.children FOR ALL TO authenticated
  USING (private.transport_is_admin())
  WITH CHECK (private.transport_is_admin());

CREATE POLICY "child_guardians_transport_read"
  ON public.child_guardians FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR private.transport_can_access_child(child_id));

CREATE POLICY "child_guardians_admin_manage"
  ON public.child_guardians FOR ALL TO authenticated
  USING (private.transport_is_admin())
  WITH CHECK (private.transport_is_admin());

CREATE POLICY "authorized_pickups_transport_read"
  ON public.authorized_pickups FOR SELECT TO authenticated
  USING (private.transport_can_access_child(child_id));

CREATE POLICY "authorized_pickups_admin_manage"
  ON public.authorized_pickups FOR ALL TO authenticated
  USING (private.transport_is_admin())
  WITH CHECK (private.transport_is_admin());

CREATE POLICY "child_medical_alerts_transport_read"
  ON public.child_medical_alerts FOR SELECT TO authenticated
  USING (private.transport_can_access_child(child_id));

CREATE POLICY "child_medical_alerts_admin_manage"
  ON public.child_medical_alerts FOR ALL TO authenticated
  USING (private.transport_is_admin())
  WITH CHECK (private.transport_is_admin());

CREATE POLICY "buses_transport_read"
  ON public.buses FOR SELECT TO authenticated
  USING (
    private.transport_is_staff_for_church(church_id)
    OR EXISTS (
      SELECT 1
      FROM public.event_buses eb
      WHERE eb.bus_id = buses.id
        AND private.transport_can_access_event_bus(eb.id)
    )
  );

CREATE POLICY "buses_admin_manage"
  ON public.buses FOR ALL TO authenticated
  USING (private.transport_is_admin())
  WITH CHECK (private.transport_is_admin());

CREATE POLICY "event_buses_transport_read"
  ON public.event_buses FOR SELECT TO authenticated
  USING (private.transport_can_access_event_bus(id));

CREATE POLICY "event_buses_admin_manage"
  ON public.event_buses FOR ALL TO authenticated
  USING (private.transport_is_admin())
  WITH CHECK (private.transport_is_admin());

CREATE POLICY "route_stops_transport_read"
  ON public.route_stops FOR SELECT TO authenticated
  USING (private.transport_can_access_event_bus(event_bus_id));

CREATE POLICY "route_stops_admin_manage"
  ON public.route_stops FOR ALL TO authenticated
  USING (private.transport_is_admin())
  WITH CHECK (private.transport_is_admin());

CREATE POLICY "event_bus_staff_transport_read"
  ON public.event_bus_staff FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.transport_can_access_event_bus(event_bus_id));

CREATE POLICY "event_bus_staff_admin_manage"
  ON public.event_bus_staff FOR ALL TO authenticated
  USING (private.transport_is_admin())
  WITH CHECK (private.transport_is_admin());

CREATE POLICY "event_registrations_transport_read"
  ON public.event_registrations FOR SELECT TO authenticated
  USING (private.transport_can_access_registration(id));

CREATE POLICY "event_registrations_admin_manage"
  ON public.event_registrations FOR ALL TO authenticated
  USING (private.transport_is_admin())
  WITH CHECK (private.transport_is_admin());

CREATE POLICY "child_bus_assignments_transport_read"
  ON public.child_bus_assignments FOR SELECT TO authenticated
  USING (
    private.transport_can_access_event_bus(event_bus_id)
    OR private.transport_can_access_registration(event_registration_id)
  );

CREATE POLICY "child_bus_assignments_admin_manage"
  ON public.child_bus_assignments FOR ALL TO authenticated
  USING (private.transport_is_admin())
  WITH CHECK (private.transport_is_admin());

CREATE POLICY "check_ins_transport_read"
  ON public.check_ins FOR SELECT TO authenticated
  USING (
    private.transport_can_access_event_bus(event_bus_id)
    OR private.transport_can_access_child(child_id)
  );

CREATE POLICY "check_ins_transport_insert"
  ON public.check_ins FOR INSERT TO authenticated
  WITH CHECK (
    performed_by = auth.uid()
    AND private.transport_can_access_event_bus(event_bus_id)
    AND private.transport_child_assigned_to_event_bus(child_id, event_bus_id)
  );

CREATE POLICY "notification_preferences_member_or_admin_read"
  ON public.notification_preferences FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR private.transport_is_admin());

CREATE POLICY "notification_preferences_admin_manage"
  ON public.notification_preferences FOR ALL TO authenticated
  USING (private.transport_is_admin())
  WITH CHECK (private.transport_is_admin());

CREATE POLICY "notification_log_member_or_admin_read"
  ON public.notification_log FOR SELECT TO authenticated
  USING (member_id = auth.uid() OR private.transport_is_admin());

DROP FUNCTION IF EXISTS public.transport_is_admin();
DROP FUNCTION IF EXISTS public.transport_is_staff_for_church(uuid);
DROP FUNCTION IF EXISTS public.transport_can_access_event_bus(uuid);
DROP FUNCTION IF EXISTS public.transport_child_assigned_to_event_bus(uuid, uuid);
DROP FUNCTION IF EXISTS public.transport_can_access_child(uuid);
DROP FUNCTION IF EXISTS public.transport_can_access_registration(uuid);
