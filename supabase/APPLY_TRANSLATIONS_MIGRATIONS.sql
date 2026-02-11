-- Combined migration file for Bible translations support
-- Run this in Supabase SQL Editor if you don't have Supabase CLI

-- ==============================================
-- MIGRATION 020: User Preferences & Bible Verse Translations
-- ==============================================

-- Create user_preferences table for storing user settings
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_bible_translation TEXT DEFAULT 'ESV',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add translation column to bible_verses table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='bible_verses' AND column_name='translation') THEN
    ALTER TABLE bible_verses ADD COLUMN translation TEXT DEFAULT 'ESV';
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_bible_verses_translation ON bible_verses(translation);

-- Enable RLS on user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own preferences
DO $$ BEGIN
  CREATE POLICY "Users can view own preferences"
    ON user_preferences FOR SELECT
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own preferences"
    ON user_preferences FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_preferences_updated_at ON user_preferences;
CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_user_preferences_updated_at();

-- Function to get or create user preferences
CREATE OR REPLACE FUNCTION get_user_preferences()
RETURNS user_preferences AS $$
DECLARE
  prefs user_preferences;
BEGIN
  -- Try to get existing preferences
  SELECT * INTO prefs
  FROM user_preferences
  WHERE user_id = auth.uid();

  -- If not found, create default preferences
  IF NOT FOUND THEN
    INSERT INTO user_preferences (user_id)
    VALUES (auth.uid())
    RETURNING * INTO prefs;
  END IF;

  RETURN prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- MIGRATION 021: Bible Translations Reference Table
-- ==============================================

-- Create Bible Translations reference table
CREATE TABLE IF NOT EXISTS bible_translations (
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
DO $$ BEGIN
  CREATE POLICY "Allow public read" ON bible_translations
    FOR SELECT
    USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_bible_translations_active_order
  ON bible_translations(is_active, display_order)
  WHERE is_active = true;

-- Insert all Bible translations (only if table is empty)
INSERT INTO bible_translations (code, name, abbreviation, display_order, is_active)
SELECT * FROM (VALUES
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
  ('ICB', 'International Children''s Bible', 'ICB', 25, true)
) AS v(code, name, abbreviation, display_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM bible_translations LIMIT 1);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_bible_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bible_translations_updated_at ON bible_translations;
CREATE TRIGGER bible_translations_updated_at
  BEFORE UPDATE ON bible_translations
  FOR EACH ROW EXECUTE FUNCTION update_bible_translations_updated_at();

-- Done!
SELECT 'Migrations applied successfully! Bible translations table now has ' || COUNT(*) || ' translations.' AS result
FROM bible_translations;
