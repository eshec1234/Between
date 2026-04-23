-- 437 Main St, Bethlehem, PA — align with OSM building footprint (015 was ~0.5km off).
UPDATE public.places
SET coordinates = ST_SetSRID(ST_MakePoint(-75.3824373, 40.6201695), 4326)::geography
WHERE name = 'Historic Hotel Bethlehem'
  AND city = 'Bethlehem'
  AND state = 'PA';
