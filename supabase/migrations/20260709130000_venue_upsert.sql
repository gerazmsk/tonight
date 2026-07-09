-- Extend venues table and add upsert_venue RPC for Tonight Mode draft flow

ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS formatted_address text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS place_id text,
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS venue_type text,
  ADD COLUMN IF NOT EXISTS is_manual boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS venues_place_id_unique
  ON venues (place_id)
  WHERE place_id IS NOT NULL AND place_id <> '';

CREATE OR REPLACE FUNCTION upsert_venue(
  p_name text,
  p_formatted_address text,
  p_city text DEFAULT NULL,
  p_state text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_latitude double precision DEFAULT NULL,
  p_longitude double precision DEFAULT NULL,
  p_place_id text DEFAULT NULL,
  p_provider text DEFAULT NULL,
  p_venue_type text DEFAULT 'other',
  p_is_manual boolean DEFAULT false,
  p_created_by uuid DEFAULT auth.uid()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_normalized_name text;
  v_normalized_address text;
BEGIN
  IF p_place_id IS NOT NULL AND trim(p_place_id) <> '' THEN
    SELECT id INTO v_id
    FROM venues
    WHERE place_id = p_place_id
    LIMIT 1;

    IF v_id IS NOT NULL THEN
      UPDATE venues SET
        name = p_name,
        formatted_address = p_formatted_address,
        address = COALESCE(p_formatted_address, address),
        city = COALESCE(p_city, city),
        state = COALESCE(p_state, state),
        country = COALESCE(p_country, country),
        latitude = COALESCE(p_latitude, latitude),
        longitude = COALESCE(p_longitude, longitude),
        provider = COALESCE(p_provider, provider),
        type = COALESCE(p_venue_type, type),
        venue_type = COALESCE(p_venue_type, venue_type),
        is_manual = p_is_manual,
        updated_at = now()
      WHERE id = v_id;
      RETURN v_id;
    END IF;
  END IF;

  v_normalized_name := lower(trim(regexp_replace(p_name, '\s+', ' ', 'g')));
  v_normalized_address := lower(trim(regexp_replace(COALESCE(p_formatted_address, ''), '\s+', ' ', 'g')));

  IF v_normalized_name <> '' AND v_normalized_address <> '' THEN
    SELECT id INTO v_id
    FROM venues
    WHERE lower(trim(regexp_replace(name, '\s+', ' ', 'g'))) = v_normalized_name
      AND lower(trim(regexp_replace(COALESCE(formatted_address, address, ''), '\s+', ' ', 'g'))) = v_normalized_address
    LIMIT 1;

    IF v_id IS NOT NULL THEN
      UPDATE venues SET
        place_id = COALESCE(p_place_id, place_id),
        provider = COALESCE(p_provider, provider),
        latitude = COALESCE(p_latitude, latitude),
        longitude = COALESCE(p_longitude, longitude),
        city = COALESCE(p_city, city),
        state = COALESCE(p_state, state),
        country = COALESCE(p_country, country),
        type = COALESCE(p_venue_type, type),
        venue_type = COALESCE(p_venue_type, venue_type),
        is_manual = p_is_manual,
        updated_at = now()
      WHERE id = v_id;
      RETURN v_id;
    END IF;
  END IF;

  INSERT INTO venues (
    name,
    formatted_address,
    address,
    city,
    state,
    country,
    latitude,
    longitude,
    place_id,
    provider,
    type,
    venue_type,
    is_manual,
    created_by
  ) VALUES (
    p_name,
    p_formatted_address,
    p_formatted_address,
    COALESCE(p_city, 'Unknown'),
    p_state,
    p_country,
    p_latitude,
    p_longitude,
    NULLIF(trim(p_place_id), ''),
    p_provider,
    COALESCE(p_venue_type, 'other'),
    COALESCE(p_venue_type, 'other'),
    p_is_manual,
    p_created_by
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_venue TO authenticated;
