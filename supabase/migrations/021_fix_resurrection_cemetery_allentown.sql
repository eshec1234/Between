-- Resurrection Cemetery: research used "547 Krocks Rd" + Wescosville; geocode landed imprecise.
-- Official Diocesan listing: 547 N Krocks Rd, Allentown, PA 18106. OSM address point at that street number.
UPDATE public.places
SET
  address = '547 N Krocks Rd',
  city = 'Allentown',
  coordinates = ST_SetSRID(ST_MakePoint(-75.5655016, 40.5682273), 4326)::geography
WHERE name = 'Resurrection Cemetery'
  AND state = 'PA'
  AND (city = 'Wescosville' OR city = 'Allentown')
  AND (address = '547 Krocks Rd' OR address LIKE '547%Krocks%');
