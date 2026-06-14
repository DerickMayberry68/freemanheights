-- Keep anonymous listing access separate while avoiding duplicate authenticated
-- SELECT policies for public listings and admin management.

DROP POLICY IF EXISTS "opportunities_public_read" ON public.opportunities;
DROP POLICY IF EXISTS "opportunities_admin_read" ON public.opportunities;

CREATE POLICY "opportunities_anon_read"
  ON public.opportunities
  FOR SELECT TO anon
  USING (
    status = 'published'
    AND (closing_date IS NULL OR closing_date >= CURRENT_DATE)
  );

CREATE POLICY "opportunities_authenticated_read"
  ON public.opportunities
  FOR SELECT TO authenticated
  USING (
    (
      status = 'published'
      AND (closing_date IS NULL OR closing_date >= CURRENT_DATE)
    )
    OR private.is_approved_admin()
  );
