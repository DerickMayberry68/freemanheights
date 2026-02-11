-- Storage bucket for church images (ministries, staff, events, gallery)
-- Public read so images can be displayed on the site
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'church-images',
  'church-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public to read from church-images bucket
CREATE POLICY "Public read church-images bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'church-images');

-- Allow approved admins to upload images
CREATE POLICY "Approved admin insert church-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'church-images'
    AND public.is_approved_admin()
  );

-- Allow approved admins to update images
CREATE POLICY "Approved admin update church-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'church-images'
    AND public.is_approved_admin()
  );

-- Allow approved admins to delete images
CREATE POLICY "Approved admin delete church-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'church-images'
    AND public.is_approved_admin()
  );
