-- 10 Sanctuary + 10 Theophany curated seeds (PA / NJ / NY) with photo URLs.
-- Images: Unsplash (hotlink OK per Unsplash license for demos).
-- Run in Supabase SQL Editor as a privileged user (bypasses RLS for verified rows).

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
  -- Sanctuary — stillness, prayer, sacred architecture & gardens
  (
    'Heinz Memorial Chapel',
    '3500 Forbes Ave',
    'Pittsburgh',
    'PA',
    ST_SetSRID(ST_MakePoint(-79.9509, 40.4445), 4326)::geography,
    'sanctuary',
    ARRAY['chapel', 'gothic', 'university']::TEXT[],
    'Interdenominational',
    'Active memorial chapel; services and quiet visiting hours vary.',
    'Visitors welcome during posted hours; remain silent during prayer.',
    'verified',
    'Gothic stone, stained glass, and still air — a high vault that seems to hold the city''s breath. Many sit in wordless rest before the chancel.',
    ARRAY[
      'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1504052434569-70add5ae4832?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    NULL,
    ARRAY['tasteful', 'historic']::TEXT[]
  ),
  (
    'Cathedral Basilica of Saints Peter and Paul',
    '1723 Race St',
    'Philadelphia',
    'PA',
    ST_SetSRID(ST_MakePoint(-75.1686, 39.9576), 4326)::geography,
    'sanctuary',
    ARRAY['cathedral', 'historic', 'roman catholic']::TEXT[],
    'Roman Catholic',
    'Major liturgical site; dress modestly; no flash during services.',
    'Open for prayer between services; check parish calendar.',
    'verified',
    'Pale stone rises in Center City like a quiet mountain of intention. Candles and incense carry prayers upward in slow spirals.',
    ARRAY[
      'https://images.unsplash.com/photo-1548625149-fc4a29d70959?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    NULL,
    ARRAY['tasteful', 'historic']::TEXT[]
  ),
  (
    'Princeton University Chapel',
    '1 Chapel Dr',
    'Princeton',
    'NJ',
    ST_SetSRID(ST_MakePoint(-74.6561, 40.3499), 4326)::geography,
    'sanctuary',
    ARRAY['chapel', 'collegiate gothic']::TEXT[],
    'Interdenominational Protestant',
    'University sacred space; respect academic and liturgical schedules.',
    'Public visiting windows posted at the chapel entrance.',
    'verified',
    'Collegiate Gothic arches frame light like folded hands. Footsteps soften on stone worn smooth by generations of seekers.',
    ARRAY[
      'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    NULL,
    ARRAY['tasteful', 'historic']::TEXT[]
  ),
  (
    'Cathedral Basilica of the Sacred Heart',
    '89 Ridge St',
    'Newark',
    'NJ',
    ST_SetSRID(ST_MakePoint(-74.1782, 40.7541), 4326)::geography,
    'sanctuary',
    ARRAY['cathedral', 'french gothic']::TEXT[],
    'Roman Catholic',
    'One of the largest cathedrals in the U.S.; active parish.',
    'Visitors welcome; maintain silence in side chapels.',
    'verified',
    'Domes and spires lift the gaze before the heart can name what it wants. Side chapels feel like small rooms inside a single breath.',
    ARRAY[
      'https://images.unsplash.com/photo-1464207687429-7505649dae38?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1508672019048-805c876b43e2?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    NULL,
    ARRAY['tasteful', 'historic']::TEXT[]
  ),
  (
    'St. Patrick''s Cathedral',
    '5th Ave & 50th St',
    'New York',
    'NY',
    ST_SetSRID(ST_MakePoint(-73.9757, 40.7587), 4326)::geography,
    'sanctuary',
    ARRAY['cathedral', 'landmark']::TEXT[],
    'Roman Catholic',
    'Major tourist and worship site; no photography during Mass.',
    'Open daily; security screening at entrance.',
    'verified',
    'Neon and noise fall away at the doors. Inside, vaults and candlelight hold a different kind of weather — inward, hushed, ancient.',
    ARRAY[
      'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1523726492515-3f608ea38ad5?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    NULL,
    ARRAY['tasteful', 'historic']::TEXT[]
  ),
  (
    'Riverside Church',
    '490 Riverside Dr',
    'New York',
    'NY',
    ST_SetSRID(ST_MakePoint(-73.9670, 40.8120), 4326)::geography,
    'sanctuary',
    ARRAY['church', 'interfaith', 'tower']::TEXT[],
    'Interdenominational / progressive Christian',
    'Social-justice oriented congregation; all welcome.',
    'Tours and services as posted; tower visits seasonal.',
    'verified',
    'A bell tower watches the Hudson. The nave gathers voices that lean toward justice as a kind of prayer.',
    ARRAY[
      'https://images.unsplash.com/photo-1438232992999-9957057aa3bf?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1505843513577-22bb7d1d5f0e?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    NULL,
    ARRAY['tasteful', 'historic']::TEXT[]
  ),
  (
    'Soldiers'' National Cemetery — Reflective Walk',
    'Taneytown Rd',
    'Gettysburg',
    'PA',
    ST_SetSRID(ST_MakePoint(-77.2304, 39.8221), 4326)::geography,
    'sanctuary',
    ARRAY['cemetery', 'memorial', 'overlook']::TEXT[],
    'Civil War memorial landscape',
    'National cemetery; highest reverence; no recreational noise.',
    'Stay on paths; quiet speech only.',
    'verified',
    'Rows of stone speak in silence. The land remembers what words cannot finish — a place for slow walking and unhurried grief.',
    ARRAY[
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    NULL,
    ARRAY['respectful', 'historic']::TEXT[]
  ),
  (
    'Sage Chapel',
    'East Ave & College Ave',
    'Ithaca',
    'NY',
    ST_SetSRID(ST_MakePoint(-76.4835, 42.4477), 4326)::geography,
    'sanctuary',
    ARRAY['chapel', 'university']::TEXT[],
    'Interdenominational',
    'Campus worship and concerts; respect academic quiet.',
    'Open hours vary by semester.',
    'verified',
    'Wood and stone lean together above the hill. Light through clerestory windows feels like a gentle verdict: pause, listen, begin again.',
    ARRAY[
      'https://images.unsplash.com/photo-1516339901601-2e1fcd62b8ab?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1494783367193-149034c050e4?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    NULL,
    ARRAY['tasteful', 'historic']::TEXT[]
  ),
  (
    'Our Lady of Victory Basilica',
    '767 Ridge Rd',
    'Lackawanna',
    'NY',
    ST_SetSRID(ST_MakePoint(-78.8234, 42.8755), 4326)::geography,
    'sanctuary',
    ARRAY['basilica', 'polish catholic']::TEXT[],
    'Roman Catholic',
    'Marian devotion; active parish community.',
    'Visitors welcome; modest dress appreciated.',
    'verified',
    'Domes rise above Buffalo''s weather like a promise made in stone. Inside, color and gold insist that hope can be a place you enter.',
    ARRAY[
      'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    NULL,
    ARRAY['tasteful', 'historic']::TEXT[]
  ),
  (
    'St. Mary''s Church',
    '119 S Prince St',
    'Lancaster',
    'PA',
    ST_SetSRID(ST_MakePoint(-76.2899, 40.0424), 4326)::geography,
    'sanctuary',
    ARRAY['church', 'historic downtown']::TEXT[],
    'Catholic',
    'Urban parish; active neighborhood church.',
    'Doors open for Mass and scheduled adoration.',
    'verified',
    'Brick and bell tower anchor the old city. Step inside and the street''s hurry thins to a single line of breath and candle-flame.',
    ARRAY[
      'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    NULL,
    ARRAY['tasteful', 'historic']::TEXT[]
  ),

  -- Theophany — liminal, weighted history, fog between worlds
  (
    'Eastern State Penitentiary Grounds',
    '2027 Fairmount Ave',
    'Philadelphia',
    'PA',
    ST_SetSRID(ST_MakePoint(-75.1722, 39.9683), 4326)::geography,
    'theophany',
    ARRAY['historic site', 'ruins', 'anomalous site']::TEXT[],
    NULL,
    'Former prison; museum. Some areas uneven; low light.',
    'Daytime tours; follow staff guidance only.',
    'verified',
    'Cellblocks swallow sound. Light falls in shafts through rust and stone — a architecture of conscience, where silence has weight.',
    ARRAY[
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    4,
    ARRAY['after dark', 'historic', 'quiet']::TEXT[]
  ),
  (
    'Centralia Mine Fire Vicinity',
    'PA Route 61',
    'Centralia',
    'PA',
    ST_SetSRID(ST_MakePoint(-76.3397, 40.8043), 4326)::geography,
    'theophany',
    ARRAY['abandoned', 'anomalous site', 'overlook']::TEXT[],
    NULL,
    'Hazardous ground in areas; stay on public roads; respect closures.',
    'Roadside only; do not trespass on unstable land.',
    'verified',
    'Steam still threads from the earth where a town once lived. The road buckles as if the past were pushing up through asphalt.',
    ARRAY[
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    5,
    ARRAY['respectful', 'quiet']::TEXT[]
  ),
  (
    'Batsto Village Historic',
    '31 Batsto Rd',
    'Hammonton',
    'NJ',
    ST_SetSRID(ST_MakePoint(-74.6467, 39.7746), 4326)::geography,
    'theophany',
    ARRAY['historic village', 'forest', 'liminal']::TEXT[],
    NULL,
    'State historic site; wetlands and iron ruins; insects seasonally.',
    'Park hours; visitor center orientation recommended.',
    'verified',
    'Pine barrens press in on weathered brick. Water once ran the world here; now stillness pools between roofless walls.',
    ARRAY[
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    3,
    ARRAY['historic', 'quiet']::TEXT[]
  ),
  (
    'Pine Barrens Trail Crossing',
    'County Rd 563',
    'Chatsworth',
    'NJ',
    ST_SetSRID(ST_MakePoint(-74.3860, 39.8150), 4326)::geography,
    'theophany',
    ARRAY['forest', 'folklore', 'anomalous site']::TEXT[],
    NULL,
    'Remote sand roads; carry water; tell someone your route.',
    'Daylight visits strongly recommended.',
    'verified',
    'Sand and pitch pine thin the boundary between map and story. Footsteps sound like someone following who isn''t quite you.',
    ARRAY[
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1516214104703-d870798883c5?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    4,
    ARRAY['after dark', 'respectful']::TEXT[]
  ),
  (
    'Sleepy Hollow Cemetery — Old Section',
    '540 N Broadway',
    'Sleepy Hollow',
    'NY',
    ST_SetSRID(ST_MakePoint(-73.8584, 41.0956), 4326)::geography,
    'theophany',
    ARRAY['cemetery', 'historic', 'literary']::TEXT[],
    NULL,
    'Active cemetery; funerals may be in progress; keep distance.',
    'Dawn to dusk; stay on paths; no rubbings without permission.',
    'verified',
    'Headstones lean like half-heard sentences. Hills roll toward the river as if memory were geography.',
    ARRAY[
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    3,
    ARRAY['quiet', 'historic']::TEXT[]
  ),
  (
    'Bannerman Castle Ruins View',
    'Pollepel Island (view from shore)',
    'Beacon',
    'NY',
    ST_SetSRID(ST_MakePoint(-73.9511, 41.4561), 4326)::geography,
    'theophany',
    ARRAY['ruins', 'river', 'liminal']::TEXT[],
    NULL,
    'Island access by tour boat only; shore viewing from parks.',
    'Follow Hudson Highlands park rules.',
    'verified',
    'Broken arsenals face the Hudson like a question nobody asked aloud. Water moves; stone refuses to explain itself.',
    ARRAY[
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    4,
    ARRAY['historic', 'quiet']::TEXT[]
  ),
  (
    'Willard Asylum Historic Grounds Vicinity',
    'Willard Drug Treatment Center area',
    'Ovid',
    'NY',
    ST_SetSRID(ST_MakePoint(-76.8336, 42.6682), 4326)::geography,
    'theophany',
    ARRAY['historic', 'institutional', 'sensitive']::TEXT[],
    NULL,
    'Mental-health history site; approach with dignity; no sensationalism.',
    'Public roads and museum only where posted.',
    'verified',
    'Fields and brick hold stories told in whispers. Walk here as a guest to other people''s pain — slow shoes, soft eyes.',
    ARRAY[
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    4,
    ARRAY['respectful', 'quiet', 'historic']::TEXT[]
  ),
  (
    'Gettysburg National Battlefield — Virginia Memorial Vicinity',
    'S Confederate Ave',
    'Gettysburg',
    'PA',
    ST_SetSRID(ST_MakePoint(-77.2345, 39.8309), 4326)::geography,
    'theophany',
    ARRAY['battlefield', 'memorial', 'overlook']::TEXT[],
    NULL,
    'National park; firearms and drones prohibited; stay on marked routes.',
    'Park hours; visitor center orientation helpful.',
    'verified',
    'Bronze riders charge forever into afternoon heat. The fields still feel crowded with absence — a thin place between history and weather.',
    ARRAY[
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    5,
    ARRAY['respectful', 'historic']::TEXT[]
  ),
  (
    'Trenton Battle Monument',
    '348 N Warren St',
    'Trenton',
    'NJ',
    ST_SetSRID(ST_MakePoint(-74.7674, 40.2206), 4326)::geography,
    'theophany',
    ARRAY['monument', 'historic', 'liminal']::TEXT[],
    NULL,
    'Urban park setting; observe street safety.',
    'Public park hours.',
    'verified',
    'Column and stone braid revolution into sky. Traffic hurries past while something older keeps watch at the corner of the eye.',
    ARRAY[
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    2,
    ARRAY['historic', 'quiet']::TEXT[]
  ),
  (
    'Fort Mifflin Earthworks',
    'Fort Mifflin Rd',
    'Philadelphia',
    'PA',
    ST_SetSRID(ST_MakePoint(-75.2233, 39.8733), 4326)::geography,
    'theophany',
    ARRAY['fort', 'river', 'historic']::TEXT[],
    NULL,
    'Museum fort; uneven ground; seasonal events.',
    'Tickets during open hours; check schedule.',
    'verified',
    'Earthworks hold the Delaware in view. Wind off the water carries gunpowder ghosts and gulls — a border between river and story.',
    ARRAY[
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1400&q=80'
    ]::TEXT[],
    3,
    ARRAY['historic', 'tasteful']::TEXT[]
  )
) AS v(
  name, address, city, state, coordinates, mode, category_tags,
  traditions, cultural_sensitivities, access_protocols, source, description, photos,
  intensity, approach_tags
)
WHERE NOT EXISTS (SELECT 1 FROM places p WHERE p.name = v.name AND p.city = v.city);
