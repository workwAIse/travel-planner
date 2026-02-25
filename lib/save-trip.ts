"use server";

import { formatFetchError } from "./errors";
import { getSupabase } from "./supabase";
import type { EnrichedItinerary } from "./schema";

export async function saveTrip(
  name: string,
  rawInput: string,
  enriched: EnrichedItinerary
): Promise<{ tripId?: string; error?: string }> {
  try {
    const supabase = getSupabase();

    const dates = enriched.days.map((d) => d.date).sort();
    const startDate = dates[0] ?? null;
    const endDate = dates[dates.length - 1] ?? null;

    let coverImageUrl: string | null = null;
    for (const day of enriched.days) {
      for (const place of day.places) {
        if (place.imageUrl) {
          coverImageUrl = place.imageUrl;
          break;
        }
      }
      if (coverImageUrl) break;
    }

    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .insert({
        name,
        raw_input: rawInput,
        start_date: startDate,
        end_date: endDate,
        cover_image_url: coverImageUrl,
      })
      .select("id")
      .single();

    if (tripError || !trip) {
      const msg = tripError?.message ?? "Failed to create trip.";
      if (tripError?.code === "PGRST301" || msg.toLowerCase().includes("invalid api key") || msg.includes("401")) {
        return {
          error:
            "Invalid Supabase API key. In .env.local set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY (see docs/SUPABASE-SETUP.md).",
        };
      }
      return { error: msg };
    }

    const tripId = trip.id as string;

    for (const day of enriched.days) {
      const episodeOrder = ["Morning", "Afternoon", "Evening"].filter(
        (ep) =>
          (day.episodes.Morning?.length ?? 0) +
            (day.episodes.Afternoon?.length ?? 0) +
            (day.episodes.Evening?.length ?? 0) > 0
      );
      if (episodeOrder.length === 0) episodeOrder.push("Morning", "Afternoon", "Evening");

      const { data: dayRow, error: dayError } = await supabase
        .from("days")
        .insert({
          trip_id: tripId,
          date: day.date,
          place: day.place,
          theme: day.theme ?? null,
          summary: day.summary ?? "",
          episode_order: episodeOrder,
          weather_high_c: day.weatherHighC ?? null,
          weather_low_c: day.weatherLowC ?? null,
          weather_condition: day.weatherCondition ?? null,
          weather_icon: day.weatherIcon ?? null,
        })
        .select("id")
        .single();

      if (dayError || !dayRow) {
        return { error: dayError?.message ?? "Failed to create day." };
      }

      const dayId = dayRow.id as string;

      for (const p of day.places) {
        const details = [p.description, p.addressOrDescription].filter(Boolean).join("\n") || null;
        const { error: placeError } = await supabase.from("places").insert({
          day_id: dayId,
          name: p.name,
          episode: p.episode,
          details,
          google_maps_url: p.googleMapsUrl ?? null,
          lat: p.lat,
          lng: p.lng,
          image_url: p.imageUrl ?? null,
          sort_order: p.sortOrder,
          description_long: p.descriptionLong ?? null,
          category: p.category ?? null,
          duration_minutes: p.durationMinutes ?? null,
          address_short: p.addressShort ?? null,
        });

        if (placeError) {
          return { error: placeError.message };
        }
      }
    }

    return { tripId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const cause = err instanceof Error && err.cause != null ? String(err.cause) : "";
    const isBadUrl =
      cause.includes("ENOTFOUND") ||
      cause.includes("your-project") ||
      msg.includes("your-project") ||
      msg.includes("Replace your-project");
    if (isBadUrl) {
      return {
        error:
          "Supabase URL is missing or wrong. In .env.local set NEXT_PUBLIC_SUPABASE_URL to your project URL (e.g. https://xxxx.supabase.co from Dashboard → Project Settings).",
      };
    }
    return { error: formatFetchError(err, "Saving (Supabase)") + " Check NEXT_PUBLIC_SUPABASE_URL and your key." };
  }
}
