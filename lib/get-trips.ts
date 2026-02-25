import { getSupabase } from "./supabase";
import type { TripWithDaysAndPlaces } from "./db-types";

export async function getTrips(): Promise<{ id: string; name: string; created_at: string }[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("trips")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as { id: string; name: string; created_at: string }[];
}

export async function getTripById(id: string): Promise<TripWithDaysAndPlaces | null> {
  const supabase = getSupabase();
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single();

  if (tripError || !trip) return null;

  const { data: days, error: daysError } = await supabase
    .from("days")
    .select("*")
    .eq("trip_id", id)
    .order("date", { ascending: true });

  if (daysError) throw daysError;

  const daysWithPlaces = await Promise.all(
    (days ?? []).map(async (day) => {
      const { data: places, error: placesError } = await supabase
        .from("places")
        .select("*")
        .eq("day_id", day.id)
        .order("sort_order", { ascending: true });

      if (placesError) throw placesError;
      return { ...day, places: places ?? [] };
    })
  );

  return {
    ...trip,
    days: daysWithPlaces,
  } as TripWithDaysAndPlaces;
}
