-- If 016 already ran, it may have used a US-22 point near Watchung Square (Target/Home Depot).
-- True campus is on the hill off Terrill Rd (~40.6485 N), same vicinity as Mount St. Mary Academy.
UPDATE public.places
SET coordinates = ST_SetSRID(ST_MakePoint(-74.41455, 40.6485), 4326)::geography
WHERE name = 'Mount Saint Mary House of Prayer'
  AND city = 'Watchung'
  AND state = 'NJ';
