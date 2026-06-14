-- Preserve the signed-in applicant email with the profile so approved staff
-- can contact applicants without direct access to auth.users.

ALTER TABLE public.applicant_profiles
  ADD COLUMN email TEXT CHECK (email IS NULL OR length(email) <= 254);
