-- Full places export (lat/lng) for QA, maps, and CSV download.
-- For `npm run qa:places-inventory` with accurate home-feed rules, also export
-- `export_places_for_qa_audit.sql` and pass `--tags-csv <file>.csv`.
-- Run in Supabase SQL Editor, then use "Download" → CSV. Do not add LIMIT.
--
-- If you only see ~100 rows in the result grid, the grid may be paginated;
-- the downloaded CSV should still include every row returned by this query.

SELECT
  id,
  name,
  address,
  city,
  state,
  mode,
  ST_Y(coordinates::geometry) AS lat,
  ST_X(coordinates::geometry) AS lng
FROM public.places
ORDER BY state, city, name;
