-- Curated quotes per place + anonymous "this stayed with me" resonance counts

ALTER TABLE places ADD COLUMN IF NOT EXISTS curated_quote TEXT;

COMMENT ON COLUMN places.curated_quote IS 'Short literary or reflective line shown on the place page';

UPDATE places SET curated_quote = 'Silence is not empty; it is where the world stops insisting.'
WHERE name = 'Heinz Memorial Chapel' AND curated_quote IS NULL;

UPDATE places SET curated_quote = 'What we seek in high stone is often something we already carry.'
WHERE name = 'Cathedral Basilica of Saints Peter and Paul' AND curated_quote IS NULL;

UPDATE places SET curated_quote = 'Light moves slowly where generations learned to listen.'
WHERE name = 'Princeton University Chapel' AND curated_quote IS NULL;

UPDATE places SET curated_quote = 'Every vault is a question held open long enough to soften.'
WHERE name = 'Cathedral Basilica of the Sacred Heart' AND curated_quote IS NULL;

UPDATE places SET curated_quote = 'Between traffic and transaction, a door that remembers older weather.'
WHERE name = 'St. Patrick''s Cathedral' AND curated_quote IS NULL;

CREATE TABLE IF NOT EXISTS place_resonance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (place_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_place_resonance_place ON place_resonance(place_id);

ALTER TABLE place_resonance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resonance readable by everyone"
  ON place_resonance FOR SELECT USING (true);

CREATE POLICY "Anyone may record resonance once per place"
  ON place_resonance FOR INSERT WITH CHECK (true);
