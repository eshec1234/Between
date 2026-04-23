-- Full places export for `npm run qa:places-inventory -- --tags-csv <this-file>.csv`
-- Includes category_tags + traditions so home-feed orphan detection matches production
-- without relying on seed migration 011.
--
-- category_tags is pipe-separated (e.g. historic|park). traditions is plain text (may contain commas → quoted in CSV).

SELECT
  id,
  name,
  address,
  city,
  state,
  mode,
  ST_Y(coordinates::geometry) AS lat,
  ST_X(coordinates::geometry) AS lng,
  array_to_string(category_tags, '|') AS category_tags,
  COALESCE(traditions, '') AS traditions
FROM public.places
ORDER BY state, city, name;
