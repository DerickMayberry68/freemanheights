-- Create user_preferences table for storing user settings
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_bible_translation TEXT DEFAULT 'KJV',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add translation column to bible_verses table
ALTER TABLE bible_verses ADD COLUMN translation TEXT DEFAULT 'KJV';

-- Create index for performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_bible_verses_translation ON bible_verses(translation);

-- Enable RLS on user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Common Bible translations for reference
COMMENT ON COLUMN user_preferences.preferred_bible_translation IS
'Common values: KJV (King James Version), NIV (New International Version), ESV (English Standard Version), NKJV (New King James Version), NLT (New Living Translation), NASB (New American Standard Bible), CSB (Christian Standard Bible), AMP (Amplified Bible), MSG (The Message)';

COMMENT ON COLUMN bible_verses.translation IS
'Bible translation used for this verse. Common values: KJV, NIV, ESV, NKJV, NLT, NASB, CSB, AMP, MSG';
