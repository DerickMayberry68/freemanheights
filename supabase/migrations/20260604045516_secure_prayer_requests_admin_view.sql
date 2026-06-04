-- Remove auth.users exposure from the prayer request admin view.

REVOKE ALL ON TABLE public.prayer_requests_admin_view FROM anon, authenticated, PUBLIC;
DROP VIEW IF EXISTS public.prayer_requests_admin_view;

CREATE VIEW public.prayer_requests_admin_view
WITH (security_invoker = true)
AS
SELECT
  pr.id,
  pr.name,
  pr.email,
  pr.phone,
  pr.request,
  pr.is_public,
  pr.is_answered,
  pr.created_at,
  pr.birthday,
  pr.updated_at,
  pr.responded_at,
  pr.responded_by,
  pr.response_method,
  pr.response_notes,
  pr.admin_notes,
  pr.recipient_staff_id,
  pr.recipient_label,
  public.get_age_from_birthday(pr.birthday) AS age,
  public.get_generation(pr.birthday) AS generation,
  responded.email AS responded_by_email,
  COALESCE(NULLIF(TRIM(recipient_staff.name), ''), pr.recipient_label) AS recipient_display_name,
  recipient_staff.email AS recipient_email,
  NULLIF(TRIM(recipient_staff.role), '') AS recipient_title,
  (pr.responded_at IS NOT NULL) AS has_response
FROM public.prayer_requests pr
LEFT JOIN public.admin_approvals responded
  ON responded.user_id = pr.responded_by
  AND responded.approved = true
LEFT JOIN public.staff recipient_staff
  ON recipient_staff.id = pr.recipient_staff_id;

GRANT SELECT ON TABLE public.prayer_requests_admin_view TO authenticated;
REVOKE ALL ON TABLE public.prayer_requests_admin_view FROM anon, PUBLIC;
