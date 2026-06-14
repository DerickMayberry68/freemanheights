-- Paid and volunteer opportunities with applicant-owned profiles,
-- application review, and private resume storage.

CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id),
  opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('paid', 'volunteer')),
  title TEXT NOT NULL CHECK (length(BTRIM(title)) BETWEEN 1 AND 160),
  slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  summary TEXT NOT NULL CHECK (length(BTRIM(summary)) BETWEEN 1 AND 500),
  description TEXT,
  responsibilities TEXT[] NOT NULL DEFAULT '{}',
  requirements TEXT[] NOT NULL DEFAULT '{}',
  location TEXT,
  schedule TEXT,
  compensation TEXT,
  closing_date DATE,
  application_questions JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (
    jsonb_typeof(application_questions) = 'array'
  ),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'published', 'closed', 'archived')
  ),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (church_id, slug)
);

CREATE TABLE public.applicant_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES public.churches(id),
  first_name TEXT NOT NULL CHECK (length(BTRIM(first_name)) BETWEEN 1 AND 80),
  last_name TEXT NOT NULL CHECK (length(BTRIM(last_name)) BETWEEN 1 AND 80),
  phone TEXT CHECK (phone IS NULL OR length(phone) <= 50),
  address_line1 TEXT CHECK (address_line1 IS NULL OR length(address_line1) <= 160),
  city TEXT CHECK (city IS NULL OR length(city) <= 100),
  state TEXT CHECK (state IS NULL OR length(state) <= 50),
  postal_code TEXT CHECK (postal_code IS NULL OR length(postal_code) <= 20),
  experience TEXT CHECK (experience IS NULL OR length(experience) <= 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.opportunity_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id),
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'reviewing', 'interview', 'accepted', 'declined', 'withdrawn')
  ),
  cover_message TEXT CHECK (cover_message IS NULL OR length(cover_message) <= 5000),
  answers JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(answers) = 'object'),
  resume_path TEXT CHECK (resume_path IS NULL OR length(resume_path) <= 500),
  resume_name TEXT CHECK (resume_name IS NULL OR length(resume_name) <= 255),
  staff_notes TEXT CHECK (staff_notes IS NULL OR length(staff_notes) <= 5000),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (opportunity_id, applicant_id)
);

CREATE INDEX idx_opportunities_public
  ON public.opportunities(status, opportunity_type, display_order, closing_date);
CREATE INDEX idx_opportunities_church_id ON public.opportunities(church_id);
CREATE INDEX idx_opportunities_created_by
  ON public.opportunities(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX idx_applicant_profiles_church_id ON public.applicant_profiles(church_id);
CREATE INDEX idx_opportunity_applications_applicant
  ON public.opportunity_applications(applicant_id, submitted_at DESC);
CREATE INDEX idx_opportunity_applications_opportunity_status
  ON public.opportunity_applications(opportunity_id, status, submitted_at DESC);
CREATE INDEX idx_opportunity_applications_reviewed_by
  ON public.opportunity_applications(reviewed_by) WHERE reviewed_by IS NOT NULL;

CREATE TRIGGER set_updated_at_opportunities
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_applicant_profiles
  BEFORE UPDATE ON public.applicant_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_opportunity_applications
  BEFORE UPDATE ON public.opportunity_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_applications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.opportunities FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.applicant_profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.opportunity_applications FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.opportunities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.applicant_profiles TO authenticated;
GRANT SELECT, UPDATE ON public.opportunity_applications TO authenticated;

CREATE POLICY "opportunities_public_read"
  ON public.opportunities
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND (closing_date IS NULL OR closing_date >= CURRENT_DATE)
  );

CREATE POLICY "opportunities_admin_read"
  ON public.opportunities
  FOR SELECT TO authenticated
  USING (private.is_approved_admin());

CREATE POLICY "opportunities_editor_insert"
  ON public.opportunities
  FOR INSERT TO authenticated
  WITH CHECK (private.has_admin_role('editor'));

CREATE POLICY "opportunities_editor_update"
  ON public.opportunities
  FOR UPDATE TO authenticated
  USING (private.has_admin_role('editor'))
  WITH CHECK (private.has_admin_role('editor'));

CREATE POLICY "opportunities_admin_delete"
  ON public.opportunities
  FOR DELETE TO authenticated
  USING (private.has_admin_role('admin'));

CREATE POLICY "applicant_profiles_read"
  ON public.applicant_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.is_approved_admin());

CREATE POLICY "applicant_profiles_insert"
  ON public.applicant_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "applicant_profiles_update"
  ON public.applicant_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR private.is_approved_admin())
  WITH CHECK (user_id = auth.uid() OR private.is_approved_admin());

CREATE POLICY "opportunity_applications_read"
  ON public.opportunity_applications
  FOR SELECT TO authenticated
  USING (applicant_id = auth.uid() OR private.is_approved_admin());

CREATE POLICY "opportunity_applications_admin_update"
  ON public.opportunity_applications
  FOR UPDATE TO authenticated
  USING (private.has_admin_role('editor'))
  WITH CHECK (private.has_admin_role('editor'));

CREATE OR REPLACE FUNCTION private.opportunities_church_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SET search_path = ''
AS $$
  SELECT id
  FROM public.churches
  WHERE name = 'Freeman Heights Baptist Church'
    AND is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.submit_opportunity_application(
  p_opportunity_id UUID,
  p_cover_message TEXT DEFAULT NULL,
  p_answers JSONB DEFAULT '{}'::jsonb,
  p_resume_path TEXT DEFAULT NULL,
  p_resume_name TEXT DEFAULT NULL
)
RETURNS public.opportunity_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_opportunity public.opportunities;
  v_application public.opportunity_applications;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.applicant_profiles
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Complete your applicant profile first';
  END IF;

  SELECT *
  INTO v_opportunity
  FROM public.opportunities
  WHERE id = p_opportunity_id;

  IF NOT FOUND
     OR v_opportunity.status <> 'published'
     OR (v_opportunity.closing_date IS NOT NULL AND v_opportunity.closing_date < CURRENT_DATE) THEN
    RAISE EXCEPTION 'This opportunity is not accepting applications';
  END IF;

  IF jsonb_typeof(COALESCE(p_answers, '{}'::jsonb)) <> 'object' THEN
    RAISE EXCEPTION 'Application answers must be an object';
  END IF;

  IF p_resume_path IS NOT NULL
     AND p_resume_path NOT LIKE auth.uid()::text || '/%' THEN
    RAISE EXCEPTION 'Invalid resume path';
  END IF;

  INSERT INTO public.opportunity_applications (
    opportunity_id,
    applicant_id,
    cover_message,
    answers,
    resume_path,
    resume_name
  )
  VALUES (
    p_opportunity_id,
    auth.uid(),
    NULLIF(BTRIM(p_cover_message), ''),
    COALESCE(p_answers, '{}'::jsonb),
    NULLIF(BTRIM(p_resume_path), ''),
    NULLIF(BTRIM(p_resume_name), '')
  )
  RETURNING * INTO v_application;

  RETURN v_application;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'You have already applied for this opportunity';
END;
$$;

CREATE OR REPLACE FUNCTION private.withdraw_opportunity_application(
  p_application_id UUID
)
RETURNS public.opportunity_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_application public.opportunity_applications;
BEGIN
  UPDATE public.opportunity_applications
  SET status = 'withdrawn',
      updated_at = NOW()
  WHERE id = p_application_id
    AND applicant_id = auth.uid()
    AND status NOT IN ('accepted', 'declined', 'withdrawn')
  RETURNING * INTO v_application;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application cannot be withdrawn';
  END IF;

  RETURN v_application;
END;
$$;

REVOKE ALL ON FUNCTION private.opportunities_church_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.submit_opportunity_application(UUID, TEXT, JSONB, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.withdraw_opportunity_application(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.opportunities_church_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.submit_opportunity_application(UUID, TEXT, JSONB, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.withdraw_opportunity_application(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.submit_opportunity_application(
  p_opportunity_id UUID,
  p_cover_message TEXT DEFAULT NULL,
  p_answers JSONB DEFAULT '{}'::jsonb,
  p_resume_path TEXT DEFAULT NULL,
  p_resume_name TEXT DEFAULT NULL
)
RETURNS public.opportunity_applications
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.submit_opportunity_application(
    p_opportunity_id,
    p_cover_message,
    p_answers,
    p_resume_path,
    p_resume_name
  );
$$;

CREATE OR REPLACE FUNCTION public.withdraw_opportunity_application(
  p_application_id UUID
)
RETURNS public.opportunity_applications
LANGUAGE SQL
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.withdraw_opportunity_application(p_application_id);
$$;

REVOKE ALL ON FUNCTION public.submit_opportunity_application(UUID, TEXT, JSONB, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.withdraw_opportunity_application(UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_opportunity_application(UUID, TEXT, JSONB, TEXT, TEXT)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.withdraw_opportunity_application(UUID)
  TO authenticated, service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'application-resumes',
  'application-resumes',
  false,
  5242880,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Applicants upload own resumes"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'application-resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Applicants and admins read resumes"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'application-resumes'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR private.is_approved_admin()
    )
  );

CREATE POLICY "Applicants delete own resumes"
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'application-resumes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(new.raw_user_meta_data ->> 'account_type', 'admin')
     NOT IN ('parent', 'applicant') THEN
    INSERT INTO public.admin_approvals (user_id, email)
    VALUES (new.id, new.email)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
