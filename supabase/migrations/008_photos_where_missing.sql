-- Default spiritual imagery for any place with an empty photos array (e.g. old 472 Vine seed).

UPDATE places
SET photos = ARRAY[
  'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=1400&q=80'
]::text[]
WHERE COALESCE(array_length(photos, 1), 0) = 0;
