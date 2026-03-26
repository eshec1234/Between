-- Allow place submissions without map coordinates.
ALTER TABLE places
  ALTER COLUMN coordinates DROP NOT NULL;
