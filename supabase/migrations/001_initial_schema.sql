-- Enable PostGIS for location data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Places table with Tier 1 fields
CREATE TABLE places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('PA', 'NJ', 'NY')),
  coordinates GEOGRAPHY(POINT) NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('sanctuary', 'theophany', 'both')),
  category_tags TEXT[] DEFAULT '{}',

  -- Tier 1: Tradition + Sensitivity fields
  traditions TEXT,
  cultural_sensitivities TEXT,
  access_protocols TEXT,

  source TEXT NOT NULL CHECK (source IN ('verified', 'community')),
  description TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id),

  -- For future Tier 2 features (schema included now, implementation deferred)
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 5),
  approach_tags TEXT[] DEFAULT '{}',
  flags INTEGER DEFAULT 0
);

-- Experience Reports (renamed from reviews — Tier 1 Feature #1)
CREATE TABLE experience_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id UUID REFERENCES places(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL, -- Anonymous device-based ID
  content TEXT NOT NULL,

  -- Tier 1: Reflection tags
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

-- Anonymous sessions tracking (device-based, no login)
CREATE TABLE anonymous_sessions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX idx_places_mode ON places(mode);
CREATE INDEX idx_places_coordinates ON places USING GIST(coordinates);
CREATE INDEX idx_places_source ON places(source);
CREATE INDEX idx_experience_reports_place ON experience_reports(place_id);
CREATE INDEX idx_experience_reports_session ON experience_reports(session_id);

-- Row Level Security
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_sessions ENABLE ROW LEVEL SECURITY;

-- Places: public read, authenticated insert
CREATE POLICY "Places are viewable by everyone"
  ON places FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert places"
  ON places FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Experience Reports: public read and insert (anonymous submissions)
CREATE POLICY "Experience reports are viewable by everyone"
  ON experience_reports FOR SELECT USING (true);

CREATE POLICY "Anyone can submit experience reports"
  ON experience_reports FOR INSERT WITH CHECK (true);

-- Anonymous sessions: managed by client
CREATE POLICY "Anyone can manage their own session"
  ON anonymous_sessions FOR ALL USING (true);
