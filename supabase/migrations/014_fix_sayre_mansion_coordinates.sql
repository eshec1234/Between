-- The Sayre Mansion: seed in 011 had an inaccurate point (blocks east of the real building).
-- Verified 2026-04-22 against Nominatim (OSM): guest_house "Sayre Mansion" at 250 Wyandotte St, Bethlehem, PA.
-- ST_MakePoint(lng, lat) WGS84

UPDATE places
SET coordinates = ST_SetSRID(ST_MakePoint(-75.3844551, 40.6121251), 4326)::geography
WHERE name = 'The Sayre Mansion'
  AND city = 'Bethlehem'
  AND state = 'PA'
  AND address = '250 Wyandotte St';
