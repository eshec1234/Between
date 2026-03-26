-- =============================================================================
-- BETWEEN — Run this ENTIRE file once in Supabase: SQL Editor → New query → Run
--
-- Supabase Pro does NOT create these tables for you. You must run SQL yourself.
-- Use the SAME Supabase project as your Vercel env VITE_SUPABASE_URL (check URL host).
--
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
  ARRAY[]::TEXT[]
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

-- Done. In Supabase: Table Editor → you should see `places` with one row.
