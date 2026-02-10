-- Create Bible Verses table
CREATE TABLE bible_verses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  verse_text TEXT NOT NULL,
  reference TEXT NOT NULL,
  book TEXT NOT NULL,
  chapter INTEGER,
  verse_start INTEGER,
  verse_end INTEGER,
  category TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bible_verses ENABLE ROW LEVEL SECURITY;

-- Public read policy for active verses
CREATE POLICY "Allow public read" ON bible_verses
  FOR SELECT
  USING (is_active = true);

-- Index for performance
CREATE INDEX idx_bible_verses_active_order
  ON bible_verses(is_active, display_order)
  WHERE is_active = true;

-- Insert sample verses
INSERT INTO bible_verses (verse_text, reference, book, chapter, verse_start, category, display_order, is_active) VALUES
('For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.', 'John 3:16', 'John', 3, 16, 'Love', 0, true),
('I can do all this through him who gives me strength.', 'Philippians 4:13', 'Philippians', 4, 13, 'Strength', 1, true),
('Trust in the LORD with all your heart and lean not on your own understanding.', 'Proverbs 3:5', 'Proverbs', 3, 5, 'Faith', 2, true),
('The LORD is my shepherd, I lack nothing.', 'Psalm 23:1', 'Psalms', 23, 1, 'Peace', 3, true),
('And we know that in all things God works for the good of those who love him.', 'Romans 8:28', 'Romans', 8, 28, 'Hope', 4, true);
