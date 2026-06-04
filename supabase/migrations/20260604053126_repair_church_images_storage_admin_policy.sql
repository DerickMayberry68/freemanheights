-- Repoint church image storage policies at the private admin helper.
-- The public compatibility wrapper is intentionally not executable by client roles.

DROP POLICY IF EXISTS "Approved admin insert church-images" ON storage.objects;
CREATE POLICY "Approved admin insert church-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'church-images'
    AND private.is_approved_admin()
  );

DROP POLICY IF EXISTS "Approved admin update church-images" ON storage.objects;
CREATE POLICY "Approved admin update church-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'church-images'
    AND private.is_approved_admin()
  )
  WITH CHECK (
    bucket_id = 'church-images'
    AND private.is_approved_admin()
  );

DROP POLICY IF EXISTS "Approved admin delete church-images" ON storage.objects;
CREATE POLICY "Approved admin delete church-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'church-images'
    AND private.is_approved_admin()
  );
