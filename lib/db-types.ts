export type Trip = {
  id: string;
  name: string;
  raw_input: string | null;
  created_at: string;
  user_id: string | null;
  start_date: string | null;
  end_date: string | null;
  cover_image_url: string | null;
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
  weather_high_c: number | null;
  weather_low_c: number | null;
  weather_condition: string | null;
  weather_icon: string | null;
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
  description_long: string | null;
  category: string | null;
  duration_minutes: number | null;
  address_short: string | null;
  user_notes: string | null;
  time_info: string | null;
  booking_url: string | null;
};

export type TripWithDaysAndPlaces = Trip & {
  days: (Day & { places: Place[] })[];
};
