-- Allow anonymous/community submissions from frontend anon key.
-- This aligns DB policy with app behavior in SubmitPlace.

DROP POLICY IF EXISTS "Authenticated users can insert places" ON places;

CREATE POLICY "Anyone can insert community places"
  ON places
  FOR INSERT
  WITH CHECK (
    source = 'community'
  );
