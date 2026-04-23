-- 1651 US Route 22, Watchung. Geocodes for "US-22" often snap to the Watchung Square retail strip
-- (Target / Home Depot). The retreat campus is on the hill off Terrill Rd, same vicinity as
-- Mount St. Mary Academy (OSM ~40.6487,-74.4146) — a short distance north of the mall.
UPDATE public.places
SET coordinates = ST_SetSRID(ST_MakePoint(-74.41455, 40.6485), 4326)::geography
WHERE name = 'Mount Saint Mary House of Prayer'
  AND city = 'Watchung'
  AND state = 'NJ';
