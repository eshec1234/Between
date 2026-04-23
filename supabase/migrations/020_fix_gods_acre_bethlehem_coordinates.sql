-- God's Acre (Moravian Cemetery), Bethlehem: "W Market St" geocoded to the wrong end of town
-- (near W Broad / Pennsylvania). OSM landuse=cemetery "God's Acre" centroid.
-- Name in DB uses Unicode apostrophe U+2019 in "God's".
UPDATE public.places
SET
  address = 'W Church St',
  coordinates = ST_SetSRID(ST_MakePoint(-75.3795638, 40.6201601), 4326)::geography
WHERE city = 'Bethlehem'
  AND state = 'PA'
  AND name = 'God’s Acre (Moravian Cemetery)';
