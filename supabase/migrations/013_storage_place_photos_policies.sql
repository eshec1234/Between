-- Allow anonymous visitors to upload into the public place-photos bucket.
-- Without these policies, uploads return 403 and the app never saves photo_url — hero stays on the SVG placeholder.
-- Prerequisites: bucket `place-photos` exists and is set to Public.

DROP POLICY IF EXISTS "place_photos_anon_insert" ON storage.objects;
DROP POLICY IF EXISTS "place_photos_public_read" ON storage.objects;

CREATE POLICY "place_photos_anon_insert"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'place-photos');

CREATE POLICY "place_photos_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'place-photos');
