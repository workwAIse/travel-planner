"use server";

import { formatFetchError } from "./errors";
import type { ParsedItinerary, EnrichedItinerary, EnrichedPlace, EpisodeKey } from "./schema";

const EPISODE_ORDER: EpisodeKey[] = ["Morning", "Afternoon", "Evening"];

const NOMINATIM_USER_AGENT = "TravelPlannerItineraryEnricher/1.0 (https://github.com/travel-planner)";
const NOMINATIM_DELAY_MS = 1100;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function enrichItinerary(parsed: ParsedItinerary): Promise<{
  data?: EnrichedItinerary;
  error?: string;
}> {
  try {
    const days: EnrichedItinerary["days"] = [];

    for (const day of parsed.days) {
      const places: EnrichedPlace[] = [];
      let sortOrder = 0;
      for (const episode of EPISODE_ORDER) {
        const list = day.episodes[episode] ?? [];
        for (const p of list) {
          const address = p.addressOrDescription || p.name;
          const [lat, lng] = await geocodeNominatim(address);
          await delay(NOMINATIM_DELAY_MS);
          const imageUrl = await getPlaceImageWikipedia(p.name, day.place, lat ?? undefined, lng ?? undefined);
          places.push({
            ...p,
            lat,
            lng,
            imageUrl,
            episode,
            sortOrder: sortOrder++,
          });
        }
      }
      days.push({ ...day, places });
    }

    return { data: { days } };
  } catch (err) {
    return { error: formatFetchError(err, "Enrichment (geocoding or place images)") };
  }
}

async function geocodeNominatim(address: string): Promise<[number | null, number | null]> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", address);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": NOMINATIM_USER_AGENT },
    });
    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const first = data?.[0];
    if (!first?.lat || !first?.lon) return [null, null];
    return [parseFloat(first.lat), parseFloat(first.lon)];
  } catch {
    return [null, null];
  }
}

async function getPlaceImageWikipedia(
  placeName: string,
  cityOrRegion: string,
  _lat?: number,
  _lng?: number
): Promise<string | null> {
  try {
    const searchQuery = `${placeName} ${cityOrRegion}`.trim();
    const searchUrl = new URL("https://en.wikipedia.org/w/api.php");
    searchUrl.searchParams.set("action", "query");
    searchUrl.searchParams.set("list", "search");
    searchUrl.searchParams.set("srsearch", searchQuery);
    searchUrl.searchParams.set("srlimit", "1");
    searchUrl.searchParams.set("format", "json");
    searchUrl.searchParams.set("origin", "*");

    const searchRes = await fetch(searchUrl.toString());
    const searchData = (await searchRes.json()) as {
      query?: { search?: Array<{ pageid?: number }> };
    };
    const pageId = searchData.query?.search?.[0]?.pageid;
    if (pageId == null) return null;

    const imageUrl = new URL("https://en.wikipedia.org/w/api.php");
    imageUrl.searchParams.set("action", "query");
    imageUrl.searchParams.set("prop", "pageimages");
    imageUrl.searchParams.set("pageids", String(pageId));
    imageUrl.searchParams.set("piprop", "original");
    imageUrl.searchParams.set("format", "json");
    imageUrl.searchParams.set("origin", "*");

    const imageRes = await fetch(imageUrl.toString());
    const imageData = (await imageRes.json()) as {
      query?: { pages?: Record<string, { original?: { source?: string } }> };
    };
    const pages = imageData.query?.pages;
    const page = pages?.[String(pageId)];
    return page?.original?.source ?? null;
  } catch {
    return null;
  }
}

