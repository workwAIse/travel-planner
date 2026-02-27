"use server";

import { formatFetchError } from "./errors";
import type { ParsedItinerary, EnrichedItinerary, EnrichedPlace, EpisodeKey } from "./schema";
import { fetchWeather } from "./weather";
import { generatePlaceDetails } from "./place-details";

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
          const [lat, lng] = await smartGeocode(p.name, day.place, p.addressOrDescription);
          await delay(NOMINATIM_DELAY_MS);
          const imageUrl = await getPlaceImageWikipedia(p.name, day.place, lat ?? undefined, lng ?? undefined);
          places.push({
            ...p,
            lat,
            lng,
            imageUrl,
            episode,
            sortOrder: sortOrder++,
            descriptionLong: null,
            category: null,
            durationMinutes: null,
            addressShort: null,
          });
        }
      }

      try {
        const detailInputs = places.map((p) => ({
          name: p.name,
          city: day.place,
          description: p.description ?? undefined,
        }));
        const details = await generatePlaceDetails(detailInputs);
        for (let i = 0; i < places.length; i++) {
          if (details[i]) {
            places[i] = {
              ...places[i],
              descriptionLong: details[i].descriptionLong,
              category: details[i].category,
              durationMinutes: details[i].durationMinutes,
              addressShort: details[i].addressShort,
            };
          }
        }
      } catch {
        // Non-fatal: place details are optional enrichment
      }

      let weatherHighC: number | null = null;
      let weatherLowC: number | null = null;
      let weatherCondition: string | null = null;
      let weatherIcon: string | null = null;

      const firstGeocodedPlace = places.find((p) => p.lat !== null && p.lng !== null);
      if (firstGeocodedPlace?.lat && firstGeocodedPlace?.lng) {
        try {
          const weather = await fetchWeather(firstGeocodedPlace.lat, firstGeocodedPlace.lng, day.date);
          if (weather) {
            weatherHighC = weather.highC;
            weatherLowC = weather.lowC;
            weatherCondition = weather.condition;
            weatherIcon = weather.icon;
          }
        } catch {
          // Non-fatal: weather is optional
        }
      }

      days.push({
        ...day,
        places,
        weatherHighC,
        weatherLowC,
        weatherCondition,
        weatherIcon,
      });
    }

    return { data: { days } };
  } catch (err) {
    return { error: formatFetchError(err, "Enrichment (geocoding or place images)") };
  }
}

// ─── Multi-strategy geocoding pipeline ────────────────────────────

const NOISE_WORDS = /\b(check[- ]?in|check[- ]?out|arrive|depart|departure|arrival|lunch|dinner|breakfast|street food|walking tour|free day|rest day|explore|visit|stroll|wander)\b/gi;
const COMBINERS = /\s*[+&]\s*/g;

function cleanPlaceName(name: string): string {
  return name
    .replace(COMBINERS, ", ")
    .replace(NOISE_WORDS, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function generateQueries(name: string, city: string, addressHint?: string | null): string[] {
  const queries: string[] = [];
  const cleaned = cleanPlaceName(name);

  // Strategy 1: full name + city
  queries.push(`${name} ${city}`);

  // Strategy 2: cleaned name + city (if different)
  if (cleaned !== name && cleaned.length > 2) {
    queries.push(`${cleaned} ${city}`);
  }

  // Strategy 3: address hint + city (if available)
  if (addressHint && addressHint.length > 3) {
    queries.push(`${addressHint} ${city}`);
  }

  // Strategy 4: name alone (for famous landmarks)
  if (name.length > 4) {
    queries.push(name);
  }

  // Strategy 5: first meaningful part before comma/+/& 
  const firstPart = name.split(/[,+&·–—]/)[0].trim();
  if (firstPart !== name && firstPart.length > 3) {
    queries.push(`${firstPart} ${city}`);
  }

  // Strategy 6: city center as last resort
  queries.push(city);

  // Deduplicate
  const seen = new Set<string>();
  return queries.filter((q) => {
    const key = q.toLowerCase().trim();
    if (seen.has(key) || key.length < 2) return false;
    seen.add(key);
    return true;
  });
}

export async function smartGeocode(
  name: string,
  city: string,
  addressHint?: string | null
): Promise<[number | null, number | null]> {
  const queries = generateQueries(name, city, addressHint);

  for (const query of queries) {
    const [lat, lng] = await geocodeNominatim(query);
    if (lat != null && lng != null) return [lat, lng];
    await delay(NOMINATIM_DELAY_MS);
  }

  return [null, null];
}

export async function geocodeNominatim(address: string): Promise<[number | null, number | null]> {
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

export async function getPlaceImageWikipedia(
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
