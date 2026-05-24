INSERT INTO site_settings (key, value)
SELECT 'bible_verse_rotation_seconds', '8'
WHERE NOT EXISTS (
  SELECT 1
  FROM site_settings
  WHERE key = 'bible_verse_rotation_seconds'
);
