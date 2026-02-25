export type Trip = {
  id: string;
  name: string;
  raw_input: string | null;
  created_at: string;
  user_id: string | null;
};

export type Day = {
  id: string;
  trip_id: string;
  date: string;
  place: string;
  theme: string | null;
  summary: string | null;
  episode_order: string[];
  created_at: string;
};

export type Place = {
  id: string;
  day_id: string;
  name: string;
  episode: string;
  details: string | null;
  google_maps_url: string | null;
  lat: number | null;
  lng: number | null;
  image_url: string | null;
  sort_order: number;
  created_at: string;
};

export type TripWithDaysAndPlaces = Trip & {
  days: (Day & { places: Place[] })[];
};
