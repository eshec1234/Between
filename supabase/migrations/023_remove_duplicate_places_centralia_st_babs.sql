-- Remove erroneous / duplicate place rows; normalize Centralia coverage.
-- - St. Babs!: bad municipality label; product decision to drop the row.
-- - St. Mark's Church in-the-Bowery (Brooklyn): erroneous duplicate; canonical site is Manhattan (East Village).
-- - Bannerman Castle (Pollepel Island) Cornwall: duplicate POI; keep Beacon listing (tour departure / visitor-facing).
-- - "The DANGEROUS Abandoned Borough of Centralia": duplicate of Centralia geography; keep existing "Centralia Fire Zone" row.

BEGIN;

DELETE FROM public.places
WHERE name = 'St. Babs!' AND state = 'NJ';

DELETE FROM public.places
WHERE name = 'St. Mark''s Church in-the-Bowery' AND city = 'Brooklyn' AND state = 'NY';

DELETE FROM public.places
WHERE name = 'Bannerman Castle (Pollepel Island)' AND city = 'Cornwall' AND state = 'NY';

DELETE FROM public.places
WHERE state = 'PA'
  AND trim(city) ILIKE 'centralia'
  AND name ILIKE '%dangerous%'
  AND name ILIKE '%abandoned%'
  AND name ILIKE '%borough%';

COMMIT;
