-- Adds photo_url column to experience_reports so visitors can upload images
-- from a location. Photos are stored in the 'place-photos' Supabase Storage
-- bucket (public, must be created manually in the Supabase dashboard).

ALTER TABLE experience_reports
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- RLS: the column is readable by anyone (same policy as the rest of the row).
-- No extra policy needed — existing anon SELECT policy covers new columns.
