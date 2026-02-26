"use server";

import { parseItinerary } from "@/lib/parse-itinerary";
import { enrichItinerary } from "@/lib/enrich-places";
import { saveTrip } from "@/lib/save-trip";
import { getSupabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export type EnrichAndSaveResult =
  | { ok: true; tripId: string }
  | { ok: false; error: string };

export async function enrichAndSaveTrip(
  rawText: string,
  tripName: string
): Promise<EnrichAndSaveResult> {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { ok: false, error: "Paste some itinerary text first." };
  }
  if (!tripName.trim()) {
    return { ok: false, error: "Enter a trip name." };
  }

  const parseResult = await parseItinerary(trimmed);
  if (parseResult.error || !parseResult.data) {
    return { ok: false, error: `[1/3 Parsing] ${parseResult.error ?? "Parsing failed."}` };
  }

  const enrichResult = await enrichItinerary(parseResult.data);
  if (enrichResult.error || !enrichResult.data) {
    return { ok: false, error: `[2/3 Enrichment] ${enrichResult.error ?? "Enrichment failed."}` };
  }

  const saveResult = await saveTrip(tripName.trim(), trimmed, enrichResult.data);
  if (saveResult.error) {
    return { ok: false, error: `[3/3 Saving] ${saveResult.error}` };
  }

  return { ok: true, tripId: saveResult.tripId! };
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function reorderPlaces(
  dayId: string,
  placeIds: string[]
): Promise<ActionResult> {
  try {
    const supabase = getSupabase();
    for (let i = 0; i < placeIds.length; i++) {
      const { error } = await supabase
        .from("places")
        .update({ sort_order: i })
        .eq("id", placeIds[i])
        .eq("day_id", dayId);
      if (error) return { ok: false, error: error.message };
    }
    revalidatePath("/trips");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to reorder." };
  }
}

export async function movePlaceToEpisode(
  placeId: string,
  dayId: string,
  newEpisode: string
): Promise<ActionResult> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("places")
      .update({ episode: newEpisode })
      .eq("id", placeId)
      .eq("day_id", dayId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/trips");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to move place." };
  }
}

export async function deleteTrip(tripId: string): Promise<ActionResult> {
  try {
    const supabase = getSupabase();

    const { data: days } = await supabase
      .from("days")
      .select("id")
      .eq("trip_id", tripId);

    if (days && days.length > 0) {
      const dayIds = days.map((d) => d.id);
      const { error: placesError } = await supabase
        .from("places")
        .delete()
        .in("day_id", dayIds);
      if (placesError) return { ok: false, error: placesError.message };
    }

    const { error: daysError } = await supabase
      .from("days")
      .delete()
      .eq("trip_id", tripId);
    if (daysError) return { ok: false, error: daysError.message };

    const { error: tripError } = await supabase
      .from("trips")
      .delete()
      .eq("id", tripId);
    if (tripError) return { ok: false, error: tripError.message };

    revalidatePath("/trips");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete trip." };
  }
}

export async function extendTrip(
  tripId: string,
  afterDate: string,
  city: string
): Promise<ActionResult> {
  try {
    const supabase = getSupabase();

    const { data: days, error: fetchError } = await supabase
      .from("days")
      .select("id, date")
      .eq("trip_id", tripId)
      .gt("date", afterDate)
      .order("date", { ascending: false });

    if (fetchError) return { ok: false, error: fetchError.message };

    for (const day of days ?? []) {
      const current = new Date(day.date + "T00:00:00");
      current.setDate(current.getDate() + 1);
      const newDate = current.toISOString().split("T")[0];
      const { error } = await supabase
        .from("days")
        .update({ date: newDate })
        .eq("id", day.id);
      if (error) return { ok: false, error: error.message };
    }

    const insertDate = new Date(afterDate + "T00:00:00");
    insertDate.setDate(insertDate.getDate() + 1);
    const newDayDate = insertDate.toISOString().split("T")[0];

    const { error: insertError } = await supabase.from("days").insert({
      trip_id: tripId,
      date: newDayDate,
      place: city,
      summary: "Free day — explore at your own pace.",
      episode_order: ["Morning", "Afternoon", "Evening"],
    });

    if (insertError) return { ok: false, error: insertError.message };

    const allDates = [...(days ?? []).map((d) => d.date), afterDate, newDayDate].sort();
    const tripStart = allDates[0];
    const tripEnd = allDates[allDates.length - 1];

    await supabase
      .from("trips")
      .update({ start_date: tripStart, end_date: tripEnd })
      .eq("id", tripId);

    revalidatePath("/trips");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to extend trip." };
  }
}
