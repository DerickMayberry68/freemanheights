CREATE INDEX IF NOT EXISTS admin_approvals_approved_by_idx
  ON public.admin_approvals (approved_by);

CREATE INDEX IF NOT EXISTS check_ins_performed_by_idx
  ON public.check_ins (performed_by);

CREATE INDEX IF NOT EXISTS events_created_by_idx
  ON public.events (created_by);

CREATE INDEX IF NOT EXISTS livestream_recordings_created_by_idx
  ON public.livestream_recordings (created_by);

CREATE INDEX IF NOT EXISTS prayer_requests_recipient_user_id_idx
  ON public.prayer_requests (recipient_user_id);

CREATE INDEX IF NOT EXISTS prayer_requests_responded_by_idx
  ON public.prayer_requests (responded_by);

CREATE INDEX IF NOT EXISTS event_bus_staff_user_id_idx
  ON public.event_bus_staff (user_id);

CREATE INDEX IF NOT EXISTS transport_staff_roles_user_id_idx
  ON public.transport_staff_roles (user_id);
