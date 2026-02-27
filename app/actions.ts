"use server";

import { parseItinerary } from "@/lib/parse-itinerary";
import { enrichItinerary, smartGeocode, getPlaceImageWikipedia } from "@/lib/enrich-places";
import { saveTrip } from "@/lib/save-trip";
import { getSupabase } from "@/lib/supabase";
import { getRecommendations, type Recommendation } from "@/lib/recommendations";
import { generatePlaceDetails } from "@/lib/place-details";
import { regenerateDaySummary } from "@/lib/regenerate-summary";
import {
  SAVED_PLACE_SOURCES,
  buildImportedRecommendations,
  buildSavedPlaceKey,
  normalizeSavedPlaceText,
  type SavedPlaceSource,
  type SavedPlaceSuggestionRow,
} from "@/lib/saved-places";
import { smartParseSavedPlaces } from "@/lib/smart-parse-saved-places";
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

export async function updatePlaceNotes(
  placeId: string,
  notes: string | null
): Promise<ActionResult> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("places")
      .update({ user_notes: notes })
      .eq("id", placeId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/trips");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to save note." };
  }
}

export async function deletePlace(
  placeId: string,
  dayId: string
): Promise<ActionResult> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("places")
      .delete()
      .eq("id", placeId);
    if (error) return { ok: false, error: error.message };

    await updateDaySummary(supabase, dayId);

    revalidatePath("/trips");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to remove stop." };
  }
}

export async function updateTrip(
  tripId: string,
  name: string,
  startDate: string | null,
  endDate: string | null
): Promise<ActionResult> {
  try {
    const supabase = getSupabase();
    const trimmedName = name.trim();
    if (!trimmedName) return { ok: false, error: "Trip name is required." };

    const updates: Record<string, unknown> = { name: trimmedName };
    if (startDate !== undefined) updates.start_date = startDate;
    if (endDate !== undefined) updates.end_date = endDate;

    const { error } = await supabase
      .from("trips")
      .update(updates)
      .eq("id", tripId);
    if (error) return { ok: false, error: error.message };

    if (startDate && endDate) {
      const { data: days } = await supabase
        .from("days")
        .select("id, date")
        .eq("trip_id", tripId)
        .order("date");

      if (days && days.length > 0) {
        const oldStart = new Date(days[0].date + "T00:00:00");
        const newStart = new Date(startDate + "T00:00:00");
        const diffDays = Math.round((newStart.getTime() - oldStart.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays !== 0) {
          for (const day of days) {
            const d = new Date(day.date + "T00:00:00");
            d.setDate(d.getDate() + diffDays);
            const newDate = d.toISOString().split("T")[0];
            await supabase.from("days").update({ date: newDate }).eq("id", day.id);
          }
        }
      }
    }

    revalidatePath("/trips");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update trip." };
  }
}

export async function regeocodeTrip(
  tripId: string
): Promise<{ ok: true; fixed: number; total: number } | { ok: false; error: string }> {
  try {
    const supabase = getSupabase();

    const { data: days } = await supabase
      .from("days")
      .select("id, place")
      .eq("trip_id", tripId);
    if (!days || days.length === 0) return { ok: true, fixed: 0, total: 0 };

    const dayMap = new Map(days.map((d) => [d.id, d.place]));
    const dayIds = days.map((d) => d.id);

    const { data: places } = await supabase
      .from("places")
      .select("id, name, day_id, lat, lng, image_url")
      .in("day_id", dayIds);
    if (!places) return { ok: true, fixed: 0, total: 0 };

    const missing = places.filter((p) => p.lat == null || p.lng == null);
    if (missing.length === 0) return { ok: true, fixed: 0, total: 0 };

    let fixed = 0;
    for (const place of missing) {
      const city = dayMap.get(place.day_id) ?? "";

      const [lat, lng] = await smartGeocode(place.name, city);
      if (lat == null || lng == null) continue;

      const updates: Record<string, unknown> = {
        lat,
        lng,
        google_maps_url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      };

      if (!place.image_url) {
        const img = await getPlaceImageWikipedia(place.name, city, lat, lng);
        if (img) updates.image_url = img;
      }

      const { error } = await supabase
        .from("places")
        .update(updates)
        .eq("id", place.id);

      if (!error) fixed++;

      await new Promise((r) => setTimeout(r, 1100));
    }

    revalidatePath("/trips");
    return { ok: true, fixed, total: missing.length };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to re-geocode." };
  }
}

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

export type SuggestResult =
  | { ok: true; recommendations: Recommendation[] }
  | { ok: false; error: string };

export async function suggestAlternatives(
  dayId: string,
  placeId: string
): Promise<SuggestResult> {
  try {
    const supabase = getSupabase();

    const { data: day, error: dayError } = await supabase
      .from("days")
      .select("trip_id, place, theme, summary")
      .eq("id", dayId)
      .single();
    if (dayError || !day) return { ok: false, error: "Day not found." };

    const { data: places, error: placesError } = await supabase
      .from("places")
      .select("id, name, episode")
      .eq("day_id", dayId)
      .order("sort_order");
    if (placesError) return { ok: false, error: placesError.message };

    const target = places?.find((p) => p.id === placeId);
    if (!target) return { ok: false, error: "Place not found." };

    const currentStops = (places ?? []).map((p) => p.name);
    const otherStops = (places ?? []).filter((p) => p.id !== placeId).map((p) => p.name);
    const context = [day.theme, day.summary, `Time of day: ${target.episode}`].filter(Boolean).join(". ");

    const [savedRecommendations, aiRecommendations] = await Promise.all([
      getImportedRecommendationsForDay({
        supabase,
        tripId: day.trip_id,
        city: day.place,
        episode: target.episode,
        currentStops,
        limit: 6,
      }),
      getRecommendations(day.place, otherStops, target.name, context),
    ]);

    const recs = mergeRecommendations(savedRecommendations, aiRecommendations, 8);
    if (recs.length === 0) {
      return { ok: false, error: "No alternatives found. Try again." };
    }
    return { ok: true, recommendations: recs };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to get suggestions." };
  }
}

export type ReplaceResult =
  | { ok: true }
  | { ok: false; error: string };

export async function replacePlace(
  placeId: string,
  dayId: string,
  newName: string,
  newCategory: string
): Promise<ReplaceResult> {
  try {
    const supabase = getSupabase();

    const { data: day } = await supabase
      .from("days")
      .select("place")
      .eq("id", dayId)
      .single();
    const city = day?.place ?? "";

    const { data: oldPlace } = await supabase
      .from("places")
      .select("episode, sort_order")
      .eq("id", placeId)
      .single();
    if (!oldPlace) return { ok: false, error: "Original place not found." };

    const [lat, lng] = await smartGeocode(newName, city);
    const imageUrl = await getPlaceImageWikipedia(newName, city, lat ?? undefined, lng ?? undefined);

    let descriptionLong = "A notable stop on your journey.";
    let durationMinutes = 60;
    let addressShort = "";
    try {
      const details = await generatePlaceDetails([{ name: newName, city }]);
      if (details[0]) {
        descriptionLong = details[0].descriptionLong;
        newCategory = details[0].category || newCategory;
        durationMinutes = details[0].durationMinutes;
        addressShort = details[0].addressShort;
      }
    } catch {
      // Non-fatal
    }

    const { error: updateError } = await supabase
      .from("places")
      .update({
        name: newName,
        lat,
        lng,
        image_url: imageUrl,
        description_long: descriptionLong,
        category: newCategory,
        duration_minutes: durationMinutes,
        address_short: addressShort,
        details: null,
        google_maps_url: lat && lng
          ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
          : null,
      })
      .eq("id", placeId);

    if (updateError) return { ok: false, error: updateError.message };

    await updateDaySummary(supabase, dayId);

    revalidatePath("/trips");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to replace place." };
  }
}

async function updateDaySummary(
  supabase: ReturnType<typeof getSupabase>,
  dayId: string
): Promise<void> {
  try {
    const { data: day } = await supabase
      .from("days")
      .select("place")
      .eq("id", dayId)
      .single();
    if (!day) return;

    const { data: places } = await supabase
      .from("places")
      .select("name, episode, category")
      .eq("day_id", dayId)
      .order("sort_order");
    if (!places || places.length === 0) return;

    const result = await regenerateDaySummary(
      day.place,
      places.map((p) => ({
        name: p.name,
        episode: p.episode,
        category: p.category,
      }))
    );

    await supabase
      .from("days")
      .update({ summary: result.summary, theme: result.theme })
      .eq("id", dayId);
  } catch {
    // Non-fatal: summary update is best-effort
  }
}

export async function suggestNewStops(
  dayId: string,
  episode: string
): Promise<SuggestResult> {
  try {
    const supabase = getSupabase();

    const { data: day, error: dayError } = await supabase
      .from("days")
      .select("trip_id, place, theme, summary")
      .eq("id", dayId)
      .single();
    if (dayError || !day) return { ok: false, error: "Day not found." };

    const { data: places, error: placesError } = await supabase
      .from("places")
      .select("name, episode")
      .eq("day_id", dayId)
      .order("sort_order");
    if (placesError) return { ok: false, error: placesError.message };

    const currentStops = (places ?? []).map((p) => p.name);
    const context = [
      day.theme,
      day.summary,
      `Looking for ${episode.toLowerCase()} activities`,
    ].filter(Boolean).join(". ");

    const [savedRecommendations, aiRecommendations] = await Promise.all([
      getImportedRecommendationsForDay({
        supabase,
        tripId: day.trip_id,
        city: day.place,
        episode,
        currentStops,
        limit: 8,
      }),
      getRecommendations(day.place, currentStops, null, context),
    ]);

    const recs = mergeRecommendations(savedRecommendations, aiRecommendations, 10);
    if (recs.length === 0) {
      return { ok: false, error: "No suggestions found. Try again." };
    }
    return { ok: true, recommendations: recs };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to get suggestions." };
  }
}

export async function addStop(
  dayId: string,
  episode: string,
  name: string,
  category: string
): Promise<ReplaceResult> {
  try {
    const supabase = getSupabase();

    const { data: day } = await supabase
      .from("days")
      .select("place")
      .eq("id", dayId)
      .single();
    const city = day?.place ?? "";

    const { data: existingPlaces } = await supabase
      .from("places")
      .select("sort_order")
      .eq("day_id", dayId)
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextSortOrder = ((existingPlaces?.[0]?.sort_order ?? -1) as number) + 1;

    const [lat, lng] = await smartGeocode(name, city);
    const imageUrl = await getPlaceImageWikipedia(name, city, lat ?? undefined, lng ?? undefined);

    let descriptionLong = "A notable stop on your journey.";
    let durationMinutes = 60;
    let addressShort = "";
    try {
      const details = await generatePlaceDetails([{ name, city }]);
      if (details[0]) {
        descriptionLong = details[0].descriptionLong;
        category = details[0].category || category;
        durationMinutes = details[0].durationMinutes;
        addressShort = details[0].addressShort;
      }
    } catch {
      // Non-fatal
    }

    const { error: insertError } = await supabase.from("places").insert({
      day_id: dayId,
      name,
      episode,
      lat,
      lng,
      image_url: imageUrl,
      description_long: descriptionLong,
      category,
      duration_minutes: durationMinutes,
      address_short: addressShort,
      sort_order: nextSortOrder,
      details: null,
      google_maps_url: lat && lng
        ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        : null,
    });

    if (insertError) return { ok: false, error: insertError.message };

    await updateDaySummary(supabase, dayId);

    revalidatePath("/trips");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to add stop." };
  }
}

export type ImportSavedPlacesResult =
  | {
    ok: true;
    parsed: number;
    imported: number;
    duplicates: number;
    aiItems: number;
    warnings: string[];
  }
  | { ok: false; error: string };

export async function importSavedPlacesForTrip(
  tripId: string,
  source: SavedPlaceSource,
  collectionName: string,
  rawInput: string
): Promise<ImportSavedPlacesResult> {
  try {
    if (!tripId.trim()) {
      return { ok: false, error: "Trip id is required." };
    }
    if (!SAVED_PLACE_SOURCES.includes(source)) {
      return { ok: false, error: "Select a valid source." };
    }
    if (!rawInput.trim()) {
      return { ok: false, error: "Paste your Google Maps or Instagram data first." };
    }

    const supabase = getSupabase();
    const parsed = await smartParseSavedPlaces(rawInput, source);
    if (parsed.items.length === 0) {
      return { ok: false, error: "No places found. Paste a list, URLs, or exported JSON." };
    }

    const { data: existingRows, error: existingError } = await supabase
      .from("trip_saved_places")
      .select("place_name, city_hint")
      .eq("trip_id", tripId);
    if (existingError) return { ok: false, error: existingError.message };

    const existingKeys = new Set(
      (existingRows ?? []).map((row) => buildSavedPlaceKey(row.place_name, row.city_hint))
    );

    const normalizedCollectionName = collectionName.trim() || null;
    const toInsert = parsed.items
      .filter((item) => {
        const key = buildSavedPlaceKey(item.placeName, item.cityHint);
        if (existingKeys.has(key)) return false;
        existingKeys.add(key);
        return true;
      })
      .map((item) => ({
        trip_id: tripId,
        source: item.source,
        collection_name: normalizedCollectionName,
        place_name: item.placeName,
        city_hint: item.cityHint,
        category_hint: item.categoryHint,
        google_maps_url: item.googleMapsUrl,
        notes: item.notes,
      }));

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("trip_saved_places")
        .insert(toInsert);
      if (insertError) return { ok: false, error: insertError.message };
    }

    revalidatePath("/trips");
    revalidatePath(`/trips/${tripId}`);

    return {
      ok: true,
      parsed: parsed.items.length,
      imported: toInsert.length,
      duplicates: parsed.items.length - toInsert.length,
      aiItems: parsed.aiItems,
      warnings: parsed.warnings,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to import saved places." };
  }
}

async function getImportedRecommendationsForDay({
  supabase,
  tripId,
  city,
  episode,
  currentStops,
  limit,
}: {
  supabase: ReturnType<typeof getSupabase>;
  tripId: string;
  city: string;
  episode: string;
  currentStops: string[];
  limit: number;
}): Promise<Recommendation[]> {
  const { data, error } = await supabase
    .from("trip_saved_places")
    .select("place_name, city_hint, category_hint, source, collection_name")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !data) return [];

  return buildImportedRecommendations(data as SavedPlaceSuggestionRow[], {
    currentStops,
    city,
    episode,
    limit,
  });
}

function mergeRecommendations(
  primary: Recommendation[],
  secondary: Recommendation[],
  limit = 10
): Recommendation[] {
  const merged: Recommendation[] = [];
  const seen = new Set<string>();

  for (const rec of [...primary, ...secondary]) {
    const key = normalizeSavedPlaceText(rec.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push({
      ...rec,
      category: normalizeSuggestionCategory(rec.category),
    });
    if (merged.length >= limit) break;
  }

  return merged;
}

function normalizeSuggestionCategory(category: string): string {
  const normalized = normalizeSavedPlaceText(category);
  if (normalized.includes("food")) return "food";
  if (normalized.includes("night")) return "nightlife";
  if (normalized.includes("activity")) return "activity";
  return "sight";
}
