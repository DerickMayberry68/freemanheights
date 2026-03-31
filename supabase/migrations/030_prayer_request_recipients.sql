-- ============================================================
-- 030 - Prayer Request Recipients
-- ============================================================

-- Store which admin user a public prayer request was intended for.
ALTER TABLE public.prayer_requests
  ADD COLUMN IF NOT EXISTS recipient_staff_id UUID REFERENCES public.staff(id),
  ADD COLUMN IF NOT EXISTS recipient_label TEXT;

CREATE INDEX IF NOT EXISTS idx_prayer_requests_recipient_staff_id
  ON public.prayer_requests(recipient_staff_id)
  WHERE recipient_staff_id IS NOT NULL;

COMMENT ON COLUMN public.prayer_requests.recipient_staff_id IS 'Staff member selected by the sender as the intended prayer request recipient.';
COMMENT ON COLUMN public.prayer_requests.recipient_label IS 'Display label captured at submission time for the selected prayer request recipient.';

-- Public recipient list for the prayer request form.
DROP FUNCTION IF EXISTS public.get_prayer_request_recipients();

CREATE OR REPLACE FUNCTION public.get_prayer_request_recipients()
RETURNS TABLE (
  staff_id UUID,
  display_name TEXT,
  title TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id AS staff_id,
    s.name AS display_name,
    NULLIF(TRIM(s.role), '') AS title
  FROM public.staff s
  WHERE s.is_active = true
  ORDER BY
    s.display_order NULLS LAST,
    s.name;
$$;

GRANT EXECUTE ON FUNCTION public.get_prayer_request_recipients() TO anon, authenticated;

-- Include recipient metadata in the admin prayer request view.
DROP VIEW IF EXISTS public.prayer_requests_admin_view;

CREATE VIEW public.prayer_requests_admin_view AS
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
  get_age_from_birthday(pr.birthday) as age,
  get_generation(pr.birthday) as generation,
  responded.email as responded_by_email,
  COALESCE(NULLIF(TRIM(recipient_staff.name), ''), pr.recipient_label) as recipient_display_name,
  recipient_staff.email as recipient_email,
  NULLIF(TRIM(recipient_staff.role), '') as recipient_title,
  CASE
    WHEN pr.responded_at IS NOT NULL THEN true
    ELSE false
  END as has_response
FROM public.prayer_requests pr
LEFT JOIN auth.users responded ON pr.responded_by = responded.id
LEFT JOIN public.staff recipient_staff ON pr.recipient_staff_id = recipient_staff.id;

GRANT SELECT ON public.prayer_requests_admin_view TO authenticated;
