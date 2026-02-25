"use server";

import { parseItinerary } from "@/lib/parse-itinerary";
import { enrichItinerary } from "@/lib/enrich-places";
import { saveTrip } from "@/lib/save-trip";

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
