-- AI Assistant Favorites Table
CREATE TABLE ai_assistant_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assistant_response TEXT NOT NULL,
  query_type TEXT NOT NULL CHECK (query_type IN ('bible_search', 'cross_reference', 'verse_context', 'sermon_ideas')),
  user_query TEXT NOT NULL,
  primary_verse_reference TEXT,
  related_verses TEXT[],
  title TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ai_favorites_user_id ON ai_assistant_favorites(user_id);
CREATE INDEX idx_ai_favorites_query_type ON ai_assistant_favorites(query_type);
CREATE INDEX idx_ai_favorites_created_at ON ai_assistant_favorites(created_at DESC);

-- Enable RLS
ALTER TABLE ai_assistant_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own favorites
CREATE POLICY "Users can view own favorites"
  ON ai_assistant_favorites FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own favorites"
  ON ai_assistant_favorites FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own favorites"
  ON ai_assistant_favorites FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own favorites"
  ON ai_assistant_favorites FOR DELETE
  USING (user_id = auth.uid());

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_ai_favorites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_favorites_updated_at
  BEFORE UPDATE ON ai_assistant_favorites
  FOR EACH ROW EXECUTE FUNCTION update_ai_favorites_updated_at();
