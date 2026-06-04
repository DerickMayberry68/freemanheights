-- Remove broad inherited table privileges from the transport/mobile module.
-- RLS gates rows, but table grants should still expose only the operations the
-- client app needs.

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
FROM anon, authenticated;

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

GRANT INSERT ON TABLE public.check_ins TO authenticated;

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
