-- Seed a test place for app functionality checks.
-- Safe to run multiple times.

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
