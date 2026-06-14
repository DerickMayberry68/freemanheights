-- Applicants retain read access to positions they applied for after those
-- positions close or are archived, so application history keeps its context.

DROP POLICY IF EXISTS "opportunities_authenticated_read" ON public.opportunities;

CREATE POLICY "opportunities_authenticated_read"
  ON public.opportunities
  FOR SELECT TO authenticated
  USING (
    (
      status = 'published'
      AND (closing_date IS NULL OR closing_date >= CURRENT_DATE)
    )
    OR private.is_approved_admin()
    OR EXISTS (
      SELECT 1
      FROM public.opportunity_applications application
      WHERE application.opportunity_id = opportunities.id
        AND application.applicant_id = auth.uid()
    )
  );
