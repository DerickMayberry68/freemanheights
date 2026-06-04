-- Repair missing church-images bucket in production.
-- Migration 023 is marked applied remotely, but the bucket and storage policies
-- were absent in the live project.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'church-images',
  'church-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public buckets already serve known object URLs; avoid listable public SELECT.
DROP POLICY IF EXISTS "Public read church-images bucket" ON storage.objects;

DROP POLICY IF EXISTS "Approved admin insert church-images" ON storage.objects;
CREATE POLICY "Approved admin insert church-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'church-images'
    AND public.is_approved_admin()
  );

DROP POLICY IF EXISTS "Approved admin update church-images" ON storage.objects;
CREATE POLICY "Approved admin update church-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'church-images'
    AND public.is_approved_admin()
  );

DROP POLICY IF EXISTS "Approved admin delete church-images" ON storage.objects;
CREATE POLICY "Approved admin delete church-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'church-images'
    AND public.is_approved_admin()
  );
