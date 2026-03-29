-- One curated Sanctuary row per underserved tradition filter (Christianity already in 007).
-- PA / NJ / NY — public-facing names; coordinates approximate. Safe to re-run: skips if name+city exists.
-- Matches RUN_THIS section 010 (ASCII hyphens in text fields).
--
-- Use alone: Supabase SQL Editor → New query → paste this whole file → Run.
-- Or: same INSERT is embedded at the bottom of RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql (run full file for setup).

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
    NULL,
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
    NULL,
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
    NULL,
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
    NULL,
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
    NULL,
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
    NULL,
    ARRAY['quiet', 'tasteful']::TEXT[]
  )
) AS v(
  name, address, city, state, coordinates, mode, category_tags,
  traditions, cultural_sensitivities, access_protocols, source, description, photos,
  intensity, approach_tags
)
WHERE NOT EXISTS (SELECT 1 FROM places p WHERE p.name = v.name AND p.city = v.city);
