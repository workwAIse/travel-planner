-- Trip-level imports from external saved collections (Google Maps, Instagram)
CREATE TABLE IF NOT EXISTS public.trip_saved_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('google_maps', 'instagram')),
  collection_name text,
  place_name text NOT NULL,
  city_hint text,
  category_hint text CHECK (category_hint IN ('sight', 'food', 'nightlife', 'activity')),
  google_maps_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_saved_places_trip_id
  ON public.trip_saved_places(trip_id);

CREATE INDEX IF NOT EXISTS idx_trip_saved_places_trip_city
  ON public.trip_saved_places(trip_id, city_hint);

ALTER TABLE public.trip_saved_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on trip_saved_places"
  ON public.trip_saved_places
  FOR ALL
  USING (true)
  WITH CHECK (true);
