-- Table for recording metadata (file is stored in Storage)
CREATE TABLE livestream_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  storage_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE livestream_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read livestream_recordings"
  ON livestream_recordings FOR SELECT USING (true);

CREATE POLICY "Approved admin insert livestream_recordings"
  ON livestream_recordings FOR INSERT TO authenticated
  WITH CHECK (public.is_approved_admin());

CREATE POLICY "Approved admin update livestream_recordings"
  ON livestream_recordings FOR UPDATE TO authenticated
  USING (public.is_approved_admin()) WITH CHECK (public.is_approved_admin());

CREATE POLICY "Approved admin delete livestream_recordings"
  ON livestream_recordings FOR DELETE TO authenticated
  USING (public.is_approved_admin());

-- Storage bucket for recordings (public read so site can play)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recordings',
  'recordings',
  true,
  536870912,
  ARRAY['video/webm', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public to read from recordings bucket
CREATE POLICY "Public read recordings bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recordings');

-- Allow authenticated (approved admin) to upload
CREATE POLICY "Authenticated insert recordings bucket"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'recordings');
