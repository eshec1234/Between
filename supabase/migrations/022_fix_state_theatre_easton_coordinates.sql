-- State Theatre, Easton: prior coords (~-75.219, 40.688) were blocks off downtown.
-- OSM amenity: State Theatre Center for the Arts, 453 Northampton St.
UPDATE public.places
SET coordinates = ST_SetSRID(ST_MakePoint(-75.2124225, 40.6915938), 4326)::geography
WHERE name = 'State Theatre Centre for the Arts — Easton'
  AND city = 'Easton'
  AND state = 'PA'
  AND address = '453 Northampton St';
