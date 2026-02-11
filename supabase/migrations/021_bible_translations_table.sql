-- Create Bible Translations reference table
CREATE TABLE bible_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bible_translations ENABLE ROW LEVEL SECURITY;

-- Public read policy for active translations
CREATE POLICY "Allow public read" ON bible_translations
  FOR SELECT
  USING (is_active = true);

-- Index for performance
CREATE INDEX idx_bible_translations_active_order
  ON bible_translations(is_active, display_order)
  WHERE is_active = true;

-- Insert all Bible translations from AI Assistant
INSERT INTO bible_translations (code, name, abbreviation, display_order, is_active) VALUES
('ESV', 'English Standard Version', 'ESV', 1, true),
('NIV', 'New International Version', 'NIV', 2, true),
('KJV', 'King James Version', 'KJV', 3, true),
('NKJV', 'New King James Version', 'NKJV', 4, true),
('NLT', 'New Living Translation', 'NLT', 5, true),
('NASB', 'New American Standard Bible', 'NASB', 6, true),
('CSB', 'Christian Standard Bible', 'CSB', 7, true),
('MSG', 'The Message', 'MSG', 8, true),
('AMP', 'Amplified Bible', 'AMP', 9, true),
('HCSB', 'Holman Christian Standard Bible', 'HCSB', 10, true),
('RSV', 'Revised Standard Version', 'RSV', 11, true),
('NRSV', 'New Revised Standard Version', 'NRSV', 12, true),
('NET', 'New English Translation', 'NET', 13, true),
('GNT', 'Good News Translation', 'GNT', 14, true),
('CEV', 'Contemporary English Version', 'CEV', 15, true),
('ERV', 'Easy-to-Read Version', 'ERV', 16, true),
('WEB', 'World English Bible', 'WEB', 17, true),
('ASV', 'American Standard Version', 'ASV', 18, true),
('YLT', 'Young''s Literal Translation', 'YLT', 19, true),
('Darby', 'Darby Translation', 'Darby', 20, true),
('ISV', 'International Standard Version', 'ISV', 21, true),
('AKJV', 'American King James Version', 'AKJV', 22, true),
('TS2009', 'The Scriptures 2009', 'TS2009', 23, true),
('NRSVA', 'New Revised Standard Version Anglicized', 'NRSVA', 24, true),
('ICB', 'International Children''s Bible', 'ICB', 25, true);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_bible_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bible_translations_updated_at
  BEFORE UPDATE ON bible_translations
  FOR EACH ROW EXECUTE FUNCTION update_bible_translations_updated_at();
