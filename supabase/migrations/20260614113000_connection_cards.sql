-- Public connection cards submitted from the website and printed QR codes.
-- Anonymous users submit through the submit-connection Edge Function only.

CREATE TABLE public.connection_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id),
  connection_type TEXT NOT NULL CHECK (
    connection_type IN (
      'first_time_guest',
      'returning_guest',
      'current_member',
      'membership_interest'
    )
  ),
  first_name TEXT NOT NULL CHECK (length(BTRIM(first_name)) BETWEEN 1 AND 80),
  last_name TEXT NOT NULL CHECK (length(BTRIM(last_name)) BETWEEN 1 AND 80),
  email TEXT CHECK (email IS NULL OR length(email) <= 254),
  phone TEXT CHECK (phone IS NULL OR length(phone) <= 50),
  preferred_contact TEXT NOT NULL DEFAULT 'email' CHECK (
    preferred_contact IN ('email', 'phone', 'text', 'none')
  ),
  address_line1 TEXT CHECK (address_line1 IS NULL OR length(address_line1) <= 160),
  city TEXT CHECK (city IS NULL OR length(city) <= 100),
  state TEXT CHECK (state IS NULL OR length(state) <= 50),
  postal_code TEXT CHECK (postal_code IS NULL OR length(postal_code) <= 20),
  household_notes TEXT CHECK (household_notes IS NULL OR length(household_notes) <= 1000),
  ministry_interests TEXT[] NOT NULL DEFAULT '{}',
  information_requests TEXT[] NOT NULL DEFAULT '{}',
  prayer_request TEXT CHECK (prayer_request IS NULL OR length(prayer_request) <= 3000),
  email_consent BOOLEAN NOT NULL DEFAULT false,
  text_consent BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'website' CHECK (length(source) <= 100),
  status TEXT NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'contacted', 'follow_up', 'completed', 'archived')
  ),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  staff_notes TEXT CHECK (staff_notes IS NULL OR length(staff_notes) <= 5000),
  contacted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  submission_fingerprint TEXT CHECK (
    submission_fingerprint IS NULL OR length(submission_fingerprint) = 64
  ),
  submitted_user_agent TEXT CHECK (
    submitted_user_agent IS NULL OR length(submitted_user_agent) <= 500
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_connection_submissions_created_at
  ON public.connection_submissions(created_at DESC);

CREATE INDEX idx_connection_submissions_status_created
  ON public.connection_submissions(status, created_at DESC);

CREATE INDEX idx_connection_submissions_fingerprint_created
  ON public.connection_submissions(submission_fingerprint, created_at DESC)
  WHERE submission_fingerprint IS NOT NULL;

ALTER TABLE public.connection_submissions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.connection_submissions FROM PUBLIC, anon;
GRANT SELECT, UPDATE, DELETE ON public.connection_submissions TO authenticated;

CREATE POLICY "connection_submissions_admin_read"
  ON public.connection_submissions
  FOR SELECT TO authenticated
  USING (private.is_approved_admin());

CREATE POLICY "connection_submissions_admin_update"
  ON public.connection_submissions
  FOR UPDATE TO authenticated
  USING (private.is_approved_admin())
  WITH CHECK (private.is_approved_admin());

CREATE POLICY "connection_submissions_admin_delete"
  ON public.connection_submissions
  FOR DELETE TO authenticated
  USING (private.has_admin_role('admin'));

CREATE TRIGGER set_updated_at_connection_submissions
  BEFORE UPDATE ON public.connection_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
