-- Store key/value settings (e.g. current livestream URL for /livestream page)
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site_settings"
  ON site_settings FOR SELECT USING (true);

CREATE POLICY "Approved admin manage site_settings"
  ON site_settings FOR ALL TO authenticated
  USING (public.is_approved_admin())
  WITH CHECK (public.is_approved_admin());

INSERT INTO site_settings (key, value) VALUES ('livestream_url', '')
ON CONFLICT (key) DO NOTHING;
