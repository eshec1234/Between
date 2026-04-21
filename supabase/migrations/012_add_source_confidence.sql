-- Extend places.source enum-check to support low confidence imports.
-- Safe to re-run.

ALTER TABLE places
  DROP CONSTRAINT IF EXISTS places_source_check;

ALTER TABLE places
  ADD CONSTRAINT places_source_check
  CHECK (source IN ('verified', 'community', 'low_confidence_import'));
