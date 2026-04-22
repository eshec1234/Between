-- =============================================================================
-- BETWEEN — Supabase SQL (one file; section 010 is at the bottom)
--
-- OPTION A — New / empty project (full setup)
--   SQL Editor → New query → paste THIS ENTIRE FILE → Run once.
--   Creates schema, policies, seeds, and 010 tradition places (last block).
--
-- OPTION B — Tables already exist; you only want the 6 tradition seeds
--   SQL Editor → New query (new tab is fine) → paste ONLY the contents of:
--     supabase/migrations/010_seed_sanctuary_traditions_diverse.sql
--   OR copy from the line "-- --- 010:" below through the final "SELECT name, city..."
--   then Run. Safe to re-run (skips duplicate name+city).
--
-- Use the SAME Supabase project as your Vercel env VITE_SUPABASE_URL (host must match).
-- If PostGIS fails: Dashboard → Database → Extensions → enable "postgis" first.
-- =============================================================================

-- --- 001: schema (from migrations/001_initial_schema.sql) ---------------------

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('PA', 'NJ', 'NY')),
  coordinates GEOGRAPHY(POINT) NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('sanctuary', 'theophany', 'both')),
  category_tags TEXT[] DEFAULT '{}',
  traditions TEXT,
  cultural_sensitivities TEXT,
  access_protocols TEXT,
  source TEXT NOT NULL CHECK (source IN ('verified', 'community')),
  description TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 5),
  approach_tags TEXT[] DEFAULT '{}',
  flags INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS experience_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL,
  content TEXT NOT NULL,
  reflection_tag TEXT CHECK (
    reflection_tag IN (
      'Helped me slow down',
      'Felt intense',
      'Made me reflect',
      'Not what I expected'
    )
  ),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS anonymous_sessions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_places_mode ON places(mode);
CREATE INDEX IF NOT EXISTS idx_places_coordinates ON places USING GIST(coordinates);
CREATE INDEX IF NOT EXISTS idx_places_source ON places(source);
CREATE INDEX IF NOT EXISTS idx_experience_reports_place ON experience_reports(place_id);
CREATE INDEX IF NOT EXISTS idx_experience_reports_session ON experience_reports(session_id);

ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Places are viewable by everyone" ON places;
CREATE POLICY "Places are viewable by everyone"
  ON places FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert places" ON places;
CREATE POLICY "Authenticated users can insert places"
  ON places FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Experience reports are viewable by everyone" ON experience_reports;
CREATE POLICY "Experience reports are viewable by everyone"
  ON experience_reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can submit experience reports" ON experience_reports;
CREATE POLICY "Anyone can submit experience reports"
  ON experience_reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can manage their own session" ON anonymous_sessions;
CREATE POLICY "Anyone can manage their own session"
  ON anonymous_sessions FOR ALL USING (true);

-- --- 002: allow anon inserts for community places ----------------------------

DROP POLICY IF EXISTS "Authenticated users can insert places" ON places;

DROP POLICY IF EXISTS "Anyone can insert community places" ON places;
CREATE POLICY "Anyone can insert community places"
  ON places
  FOR INSERT
  WITH CHECK (source = 'community');

-- --- 003: optional coordinates ----------------------------------------------

ALTER TABLE places
  ALTER COLUMN coordinates DROP NOT NULL;

-- --- 004: seed test row -----------------------------------------------------

INSERT INTO places (
  name,
  address,
  city,
  state,
  coordinates,
  mode,
  category_tags,
  traditions,
  cultural_sensitivities,
  access_protocols,
  source,
  description,
  photos
)
SELECT
  '472 Vine Street Church',
  '472 Vine St',
  'Philadelphia',
  'PA',
  NULL,
  'sanctuary',
  ARRAY['church', 'historic'],
  'Catholic',
  'Active place of worship; respect quiet prayer areas.',
  'Public-facing areas during posted open hours.',
  'community',
  'A calm church setting used as a seed location for testing Between app functionality.',
  ARRAY[
    'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=1400&q=80'
  ]::TEXT[]
WHERE NOT EXISTS (
  SELECT 1
  FROM places
  WHERE name = '472 Vine Street Church'
    AND address = '472 Vine St'
    AND city = 'Philadelphia'
    AND state = 'PA'
);

-- --- 005: spatial RPC + moderation flag (run after base schema exists) --------

CREATE OR REPLACE FUNCTION places_nearby(
  lat double precision,
  lng double precision,
  radius_m double precision,
  mode_filter text
)
RETURNS SETOF places
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM places
  WHERE coordinates IS NOT NULL
    AND ST_DWithin(
      coordinates,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_m
    )
    AND (
      mode_filter IS NULL
      OR mode = mode_filter
      OR mode = 'both'
    )
  ORDER BY ST_Distance(
    coordinates,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  )
  LIMIT 50;
$$;

CREATE OR REPLACE FUNCTION report_place_flag(p_place_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE places
  SET flags = COALESCE(flags, 0) + 1
  WHERE id = p_place_id;
END;
$$;

GRANT EXECUTE ON FUNCTION places_nearby(double precision, double precision, double precision, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION report_place_flag(uuid) TO anon, authenticated;

-- --- 006: reviews vs tips + stillness (migration 006_reviews_tips_and_vibe.sql) ----------

ALTER TABLE experience_reports
  ADD COLUMN IF NOT EXISTS content_kind TEXT NOT NULL DEFAULT 'review'
    CHECK (content_kind IN ('review', 'tip'));

ALTER TABLE experience_reports
  ADD COLUMN IF NOT EXISTS stillness_rating INTEGER
    CHECK (stillness_rating IS NULL OR (stillness_rating >= 1 AND stillness_rating <= 5));

CREATE INDEX IF NOT EXISTS idx_experience_reports_created_at ON experience_reports(created_at DESC);

-- --- 007: 20 spiritual curated places (10 sanctuary + 10 theophany) with photos ----------
-- Run the full script in this repo: supabase/migrations/007_seed_spiritual_places_20.sql
-- (paste the entire file into SQL Editor and execute). Safe to re-run: skips if name+city exists.

-- --- 008: backfill photos for rows that still have empty arrays --------------------------

UPDATE places
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=1400&q=80'
]::text[]
WHERE COALESCE(array_length(photos, 1), 0) = 0;

-- --- 009: curated quotes + place resonance (migration 009_curated_quotes_resonance.sql) ----------

ALTER TABLE places ADD COLUMN IF NOT EXISTS curated_quote TEXT;

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

DROP POLICY IF EXISTS "Resonance readable by everyone" ON place_resonance;
CREATE POLICY "Resonance readable by everyone"
  ON place_resonance FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone may record resonance once per place" ON place_resonance;
CREATE POLICY "Anyone may record resonance once per place"
  ON place_resonance FOR INSERT WITH CHECK (true);

-- --- 010: diverse sanctuary traditions (Judaism, Islam, Hindu, Buddhist, Sikh, Baha'i) -----------
-- Christianity is already covered in 007. Safe to re-run: skips if same name + city exists.

INSERT INTO places (
  name,
  address,
  city,
  state,
  coordinates,
  mode,
  category_tags,
  traditions,
  cultural_sensitivities,
  access_protocols,
  source,
  description,
  photos,
  intensity,
  approach_tags
)
SELECT * FROM (VALUES
  (
    'Congregation Rodeph Shalom',
    '615 N Broad St',
    'Philadelphia',
    'PA',
    ST_SetSRID(ST_MakePoint(-75.1595, 39.9634), 4326)::geography,
    'sanctuary',
    ARRAY['synagogue', 'reform judaism', 'historic']::TEXT[],
    'Judaism - Reform',
    'Active congregation; dress modestly; follow posted security and service times.',
    'Visitors welcome at advertised services and open-house events.',
    'verified',
    'Stained glass and ark light hold the room in a single long breath. Here Torah is carried as both text and trust - a place to arrive as you are and listen.',
    ARRAY[
      'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1504052434569-70add5ae4832?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    NULL::INTEGER,
    ARRAY['tasteful', 'historic']::TEXT[]
  ),
  (
    'Islamic Cultural Center of New York',
    '1711 3rd Ave',
    'New York',
    'NY',
    ST_SetSRID(ST_MakePoint(-73.9492, 40.7914), 4326)::geography,
    'sanctuary',
    ARRAY['mosque', 'islamic', 'minaret']::TEXT[],
    'Islam - Sunni',
    'Active masjid; remove shoes in prayer hall; modest dress.',
    'Check prayer and visitor hours; Friday Jumu''ah especially busy.',
    'verified',
    'Stone and calligraphy lift the eye before the heart names what it needs. Ablution, prayer, and community fold the day into something quieter than the avenue outside.',
    ARRAY[
      'https://images.unsplash.com/photo-1548625149-fc4a29d70959?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    NULL::INTEGER,
    ARRAY['respectful', 'historic']::TEXT[]
  ),
  (
    'Ganesh Temple of Queens',
    '45-57 Smart St',
    'Flushing',
    'NY',
    ST_SetSRID(ST_MakePoint(-73.9056, 40.7478), 4326)::geography,
    'sanctuary',
    ARRAY['mandir', 'hindu', 'ganesha']::TEXT[],
    'Hinduism - Sri Maha Vallabha Ganapati Devasthanam',
    'Remove shoes; modest dress; follow temple etiquette for prasad and photography.',
    'Daily darshan; festival days especially crowded.',
    'verified',
    'Ghee lamps and bell-sound braid into a single bright hush. Feet cool on marble; the mind slows where devotion has worn the stone smooth.',
    ARRAY[
      'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1494783367193-149034c050e4?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    NULL::INTEGER,
    ARRAY['tasteful', 'respectful']::TEXT[]
  ),
  (
    'New York Buddhist Church',
    '352 W 37th St',
    'New York',
    'NY',
    ST_SetSRID(ST_MakePoint(-73.9945, 40.7545), 4326)::geography,
    'sanctuary',
    ARRAY['buddhist', 'jodo shinshu', 'urban']::TEXT[],
    'Buddhism - Jodo Shinshu',
    'Shin Buddhist sangha; shoes off in inner hall as posted.',
    'Services and meditation schedules posted at entrance and online.',
    'verified',
    'Incense thins the air until the city sounds like something happening one room away. A place to sit without performing stillness - only breathing.',
    ARRAY[
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    NULL::INTEGER,
    ARRAY['quiet', 'tasteful']::TEXT[]
  ),
  (
    'Sikh Cultural Society Gurdwara',
    '113-10 101st Ave',
    'South Richmond Hill',
    'NY',
    ST_SetSRID(ST_MakePoint(-73.8389, 40.6787), 4326)::geography,
    'sanctuary',
    ARRAY['gurdwara', 'sikh', 'langar']::TEXT[],
    'Sikhism - Khalsa sangat',
    'Cover head in darbar hall; remove shoes; langar is communal - accept food with respect.',
    'Open daily; major gurpurbs draw large crowds.',
    'verified',
    'Steel and marble echo with kirtan and kitchen steam. Here dignity is practiced in rows of shoes and rows of hands passing bread - belief made practical.',
    ARRAY[
      'https://images.unsplash.com/photo-1505843513577-22bb7d1d5f0e?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1438232992999-9957057aa3bf?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    NULL::INTEGER,
    ARRAY['respectful', 'tasteful']::TEXT[]
  ),
  (
    'Baha''i Center of Philadelphia',
    '5831 Germantown Ave',
    'Philadelphia',
    'PA',
    ST_SetSRID(ST_MakePoint(-75.1754, 40.0364), 4326)::geography,
    'sanctuary',
    ARRAY['bahai', 'interfaith welcome', 'community']::TEXT[],
    'Baha''i Faith',
    'Study circles and devotional gatherings; all backgrounds welcome.',
    'Check calendar for public devotional and interfaith events.',
    'verified',
    'Light rooms and plain chairs - no cult of ornament, only of gathering. Prayers from several traditions sometimes share the same evening air.',
    ARRAY[
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    NULL::INTEGER,
    ARRAY['quiet', 'tasteful']::TEXT[]
  )
) AS v(
  name, address, city, state, coordinates, mode, category_tags,
  traditions, cultural_sensitivities, access_protocols, source, description, photos,
  intensity, approach_tags
)
WHERE NOT EXISTS (SELECT 1 FROM places p WHERE p.name = v.name AND p.city = v.city);

-- After 010: you should see up to 6 rows (one per tradition seed). If zero, check the SQL Editor "Messages" tab for errors.
SELECT name, city, mode, source
FROM places
WHERE name IN (
  'Congregation Rodeph Shalom',
  'Islamic Cultural Center of New York',
  'Ganesh Temple of Queens',
  'New York Buddhist Church',
  'Sikh Cultural Society Gurdwara',
  'Baha''i Center of Philadelphia'
)
ORDER BY name;

-- Done. In Supabase: Table Editor -> places -> confirm rows. App feed merges recent rows after RPC (see Home fetchPlaces).

-- --- 013: Storage policies for visitor photo uploads (place-photos bucket) ------------
-- Run AFTER creating public bucket `place-photos` in Dashboard → Storage.
-- Copy from supabase/migrations/013_storage_place_photos_policies.sql if this block is missing.

DROP POLICY IF EXISTS "place_photos_anon_insert" ON storage.objects;
DROP POLICY IF EXISTS "place_photos_public_read" ON storage.objects;

CREATE POLICY "place_photos_anon_insert"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'place-photos');

CREATE POLICY "place_photos_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'place-photos');
