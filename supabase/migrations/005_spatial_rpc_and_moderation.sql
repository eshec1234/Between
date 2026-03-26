-- Nearby places using PostGIS (spec: ST_DWithin / radius).
-- Moderation: increment flags without granting direct UPDATE on places to anon.

CREATE OR REPLACE FUNCTION places_nearby(
  lat double precision,
  lng double precision,
  radius_m double precision,
  mode_filter text
)
RETURNS SETOF places
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM places
  WHERE coordinates IS NOT NULL
    AND ST_DWithin(
      coordinates,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_m
    )
    AND (
      mode_filter IS NULL
      OR mode = mode_filter
      OR mode = 'both'
    )
  ORDER BY ST_Distance(
    coordinates,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  )
  LIMIT 50;
$$;

CREATE OR REPLACE FUNCTION report_place_flag(p_place_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE places
  SET flags = COALESCE(flags, 0) + 1
  WHERE id = p_place_id;
END;
$$;

GRANT EXECUTE ON FUNCTION places_nearby(double precision, double precision, double precision, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION report_place_flag(uuid) TO anon, authenticated;
