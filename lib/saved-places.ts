import type { Recommendation } from "./recommendations";

export const SAVED_PLACE_SOURCES = ["google_maps", "instagram"] as const;
export type SavedPlaceSource = (typeof SAVED_PLACE_SOURCES)[number];

export const SAVED_PLACE_CATEGORIES = ["sight", "food", "nightlife", "activity"] as const;
export type SavedPlaceCategory = (typeof SAVED_PLACE_CATEGORIES)[number];

export type SavedPlaceCandidate = {
  placeName: string;
  cityHint: string | null;
  categoryHint: SavedPlaceCategory;
  googleMapsUrl: string | null;
  notes: string | null;
  source: SavedPlaceSource;
};

export type SavedPlaceSuggestionRow = {
  place_name: string;
  city_hint: string | null;
  category_hint: string | null;
  source: SavedPlaceSource;
  collection_name: string | null;
};

export type ParseSavedPlacesResult = {
  items: SavedPlaceCandidate[];
  warnings: string[];
};

const URL_REGEX = /https?:\/\/[^\s<>"')]+/gi;
const LAT_LNG_REGEX = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
const SPLIT_SEPARATORS = [" - ", " | ", " — ", " – ", " · "];

const PLACE_NAME_KEYS = [
  "place_name",
  "venue_name",
  "location_name",
  "name",
  "title",
  "place",
  "venue",
] as const;

const CITY_KEYS = ["city", "city_name", "location_city", "town"] as const;
const NOTES_KEYS = ["description", "caption", "notes", "note", "address"] as const;
const URL_KEYS = ["google_maps_url", "maps_url", "map_url", "url", "link", "href"] as const;

const FOOD_KEYWORDS = [
  "restaurant",
  "cafe",
  "coffee",
  "brunch",
  "bakery",
  "dinner",
  "lunch",
  "barbecue",
  "bistro",
  "ramen",
  "pizza",
  "kitchen",
];

const NIGHTLIFE_KEYWORDS = [
  "club",
  "nightclub",
  "cocktail",
  "speakeasy",
  "pub",
  "bar",
  "rooftop",
  "lounge",
  "night",
];

const ACTIVITY_KEYWORDS = [
  "hike",
  "trail",
  "tour",
  "class",
  "workshop",
  "spa",
  "beach",
  "kayak",
  "climb",
  "surf",
  "bike",
  "adventure",
];

const NOISE_LINE_PATTERNS: RegExp[] = [
  /^saved\s*(places|posts|items|folders)?$/i,
  /^collection(s)?$/i,
  /^folder(s)?$/i,
  /^see all$/i,
  /^open in app$/i,
  /^view (all|more)$/i,
  /^updated/i,
  /^share(d)?\b/i,
  /^copy link$/i,
  /^untitled list$/i,
];

export function parseSavedPlacesInput(rawInput: string, source: SavedPlaceSource): ParseSavedPlacesResult {
  const trimmed = rawInput.trim();
  if (!trimmed) return { items: [], warnings: [] };

  const warnings: string[] = [];
  const candidates: SavedPlaceCandidate[] = [];

  const parsedJson = parseMaybeJson(trimmed);
  if (parsedJson.parsed != null) {
    candidates.push(...extractCandidatesFromJson(parsedJson.parsed, source));
  } else if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    warnings.push("JSON block looks invalid, falling back to line and URL parsing.");
  }

  candidates.push(...extractCandidatesFromUrls(trimmed, source));
  candidates.push(...extractCandidatesFromLines(trimmed, source));

  return {
    items: mergeSavedPlaceCandidates(candidates),
    warnings,
  };
}

export function mergeSavedPlaceCandidates(items: SavedPlaceCandidate[]): SavedPlaceCandidate[] {
  const byKey = new Map<string, SavedPlaceCandidate>();
  const keysByName = new Map<string, string[]>();

  for (const item of items) {
    const cleaned = sanitizeCandidate(item);
    if (!cleaned) continue;

    const nameKey = normalizeSavedPlaceText(cleaned.placeName);
    const incomingCityKey = normalizeSavedPlaceText(cleaned.cityHint ?? "");
    const candidateKeys = keysByName.get(nameKey) ?? [];

    const matchedKey = candidateKeys.find((candidateKey) => {
      const existingCandidate = byKey.get(candidateKey);
      if (!existingCandidate) return false;
      const existingCityKey = normalizeSavedPlaceText(existingCandidate.cityHint ?? "");
      if (!existingCityKey || !incomingCityKey) return true;
      return existingCityKey === incomingCityKey;
    });

    const key = matchedKey ?? buildSavedPlaceKey(cleaned.placeName, cleaned.cityHint);
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, cleaned);
      const next = keysByName.get(nameKey) ?? [];
      next.push(key);
      keysByName.set(nameKey, next);
      continue;
    }

    byKey.set(key, {
      ...existing,
      cityHint: existing.cityHint ?? cleaned.cityHint,
      categoryHint:
        existing.categoryHint === "sight" && cleaned.categoryHint !== "sight"
          ? cleaned.categoryHint
          : existing.categoryHint,
      googleMapsUrl: existing.googleMapsUrl ?? cleaned.googleMapsUrl,
      notes: selectRicherText(existing.notes, cleaned.notes),
    });
  }

  return [...byKey.values()];
}

export function normalizeSavedPlaceCategory(value: string | null | undefined): SavedPlaceCategory {
  const normalized = normalizeSavedPlaceText(value ?? "");
  if (normalized.includes("food")) return "food";
  if (normalized.includes("night")) return "nightlife";
  if (normalized.includes("activity")) return "activity";
  if ((SAVED_PLACE_CATEGORIES as readonly string[]).includes(normalized)) {
    return normalized as SavedPlaceCategory;
  }
  return "sight";
}

export function normalizeSavedPlaceText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildSavedPlaceKey(placeName: string, cityHint: string | null): string {
  const place = normalizeSavedPlaceText(placeName);
  const city = normalizeSavedPlaceText(cityHint ?? "");
  return city ? `${place}::${city}` : place;
}

export function buildImportedRecommendations(
  rows: SavedPlaceSuggestionRow[],
  options: {
    currentStops: string[];
    city: string;
    episode: string;
    limit?: number;
  }
): Recommendation[] {
  const currentStopKeys = new Set(options.currentStops.map((name) => normalizeSavedPlaceText(name)));
  const deduped = new Map<string, { rec: Recommendation; score: number }>();
  const normalizedCity = normalizeSavedPlaceText(options.city);

  for (const row of rows) {
    const placeName = sanitizeFreeText(row.place_name);
    if (!placeName) continue;

    const normalizedPlace = normalizeSavedPlaceText(placeName);
    if (!normalizedPlace || currentStopKeys.has(normalizedPlace)) continue;

    const cityHint = sanitizeFreeText(row.city_hint ?? "");
    const category = normalizeSavedPlaceCategory(row.category_hint);
    const score = scoreCandidate({
      category,
      cityHint,
      city: normalizedCity,
      episode: options.episode,
      source: row.source,
    });

    const sourceLabel = row.source === "google_maps" ? "Google Maps" : "Instagram";
    const collectionName = sanitizeFreeText(row.collection_name ?? "");
    const reason = [
      `Saved from ${sourceLabel}`,
      collectionName ? `list "${collectionName}"` : null,
      cityHint ? `for ${cityHint}` : null,
    ]
      .filter(Boolean)
      .join(" - ");

    const recommendation: Recommendation = {
      name: placeName,
      category,
      reason: `${reason}.`,
    };

    const existing = deduped.get(normalizedPlace);
    if (!existing || score > existing.score) {
      deduped.set(normalizedPlace, { rec: recommendation, score });
    }
  }

  const limit = options.limit ?? 8;
  return [...deduped.values()]
    .sort((a, b) => b.score - a.score || a.rec.name.localeCompare(b.rec.name))
    .slice(0, limit)
    .map((entry) => entry.rec);
}

function parseMaybeJson(value: string): { parsed: unknown | null } {
  try {
    return { parsed: JSON.parse(value) };
  } catch {
    return { parsed: null };
  }
}

function extractCandidatesFromJson(payload: unknown, source: SavedPlaceSource): SavedPlaceCandidate[] {
  const candidates: SavedPlaceCandidate[] = [];
  walkJson(payload, (node) => {
    const candidate = candidateFromObject(node, source);
    if (candidate) candidates.push(candidate);
  });
  return candidates;
}

function walkJson(value: unknown, onObject: (obj: Record<string, unknown>) => void, depth = 0): void {
  if (depth > 10) return;
  if (Array.isArray(value)) {
    for (const item of value) walkJson(item, onObject, depth + 1);
    return;
  }
  if (!value || typeof value !== "object") return;

  const obj = value as Record<string, unknown>;
  onObject(obj);
  for (const nested of Object.values(obj)) {
    walkJson(nested, onObject, depth + 1);
  }
}

function candidateFromObject(obj: Record<string, unknown>, source: SavedPlaceSource): SavedPlaceCandidate | null {
  const firstName = firstStringFromKeys(obj, PLACE_NAME_KEYS);
  const firstCity = firstStringFromKeys(obj, CITY_KEYS);
  const firstNotes = firstStringFromKeys(obj, NOTES_KEYS);
  const firstUrl = firstStringFromKeys(obj, URL_KEYS);

  const locationObj = asRecord(obj.location);
  const locationName = locationObj ? firstStringFromKeys(locationObj, PLACE_NAME_KEYS) : null;
  const locationCity = locationObj ? firstStringFromKeys(locationObj, CITY_KEYS) : null;
  const locationUrl = locationObj ? firstStringFromKeys(locationObj, URL_KEYS) : null;

  const mapsUrl = firstValidMapUrl(firstUrl, locationUrl);
  const fromUrl = mapsUrl ? extractPlaceFromUrl(mapsUrl, source) : null;

  let placeName = firstName ?? locationName ?? fromUrl?.placeName ?? null;
  let cityHint = firstCity ?? locationCity ?? fromUrl?.cityHint ?? null;
  const notes = firstNotes;

  if (!placeName && notes) {
    const fromNotes = parseLineToCandidate(notes, source);
    if (fromNotes) {
      placeName = fromNotes.placeName;
      cityHint = cityHint ?? fromNotes.cityHint;
    }
  }

  if (!placeName || !looksLikePlaceName(placeName, source)) return null;

  const combinedText = [placeName, notes, obj.category, obj.type]
    .map((value) => (typeof value === "string" ? value : ""))
    .join(" ");

  return {
    placeName,
    cityHint,
    categoryHint: inferCategoryFromText(combinedText),
    googleMapsUrl: mapsUrl ?? fromUrl?.googleMapsUrl ?? null,
    notes: notes ?? null,
    source,
  };
}

function extractCandidatesFromUrls(rawInput: string, source: SavedPlaceSource): SavedPlaceCandidate[] {
  const urls = extractUrls(rawInput);
  const candidates: SavedPlaceCandidate[] = [];
  for (const url of urls) {
    const candidate = extractPlaceFromUrl(url, source);
    if (!candidate || !looksLikePlaceName(candidate.placeName, source)) continue;
    candidates.push({
      placeName: candidate.placeName,
      cityHint: candidate.cityHint,
      categoryHint: inferCategoryFromText(candidate.placeName),
      googleMapsUrl: candidate.googleMapsUrl,
      notes: null,
      source,
    });
  }
  return candidates;
}

function extractCandidatesFromLines(rawInput: string, source: SavedPlaceSource): SavedPlaceCandidate[] {
  const candidates: SavedPlaceCandidate[] = [];
  const lines = rawInput.split(/\r?\n/);
  for (const line of lines) {
    const candidate = parseLineToCandidate(line, source);
    if (candidate) candidates.push(candidate);
  }
  return candidates;
}

function parseLineToCandidate(line: string, source: SavedPlaceSource): SavedPlaceCandidate | null {
  const urls = extractUrls(line);
  const fromUrl = urls.length > 0 ? extractPlaceFromUrl(urls[0], source) : null;

  let cleaned = line.replace(URL_REGEX, " ");
  cleaned = cleaned.replace(/^[\s\d().\-*#\u2022]+/, "");
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  if (!cleaned) return fromUrl ? candidateFromUrlOnly(fromUrl, source) : null;
  if (isNoiseLine(cleaned, source)) return fromUrl ? candidateFromUrlOnly(fromUrl, source) : null;

  const { name, cityHint } = splitNameAndCity(cleaned);
  const placeName = sanitizeFreeText(name ?? cleaned);
  if (!placeName || !looksLikePlaceName(placeName, source)) {
    return fromUrl ? candidateFromUrlOnly(fromUrl, source) : null;
  }

  const chosenCity = cityHint ?? fromUrl?.cityHint ?? null;
  return {
    placeName,
    cityHint: chosenCity,
    categoryHint: inferCategoryFromText(cleaned),
    googleMapsUrl: fromUrl?.googleMapsUrl ?? null,
    notes: null,
    source,
  };
}

function splitNameAndCity(raw: string): { name: string; cityHint: string | null } {
  const instagramAt = raw.match(/\bat\s+([^,|()]+)$/i);
  if (instagramAt) {
    const maybeName = raw.slice(0, instagramAt.index).trim();
    const maybeCity = sanitizeCityHint(instagramAt[1]);
    return {
      name: maybeName || raw,
      cityHint: maybeCity,
    };
  }

  for (const sep of SPLIT_SEPARATORS) {
    if (!raw.includes(sep)) continue;
    const [left, right] = raw.split(sep, 2);
    const candidateCity = sanitizeCityHint(right);
    if (candidateCity) {
      return { name: left.trim(), cityHint: candidateCity };
    }
  }

  const parenCity = raw.match(/^(.*)\(([^()]+)\)\s*$/);
  if (parenCity) {
    const maybeCity = sanitizeCityHint(parenCity[2]);
    if (maybeCity) {
      return { name: parenCity[1].trim(), cityHint: maybeCity };
    }
  }

  return { name: raw, cityHint: null };
}

function candidateFromUrlOnly(
  parsed: { placeName: string; cityHint: string | null; googleMapsUrl: string | null },
  source: SavedPlaceSource
): SavedPlaceCandidate {
  return {
    placeName: parsed.placeName,
    cityHint: parsed.cityHint,
    categoryHint: inferCategoryFromText(parsed.placeName),
    googleMapsUrl: parsed.googleMapsUrl,
    notes: null,
    source,
  };
}

function extractPlaceFromUrl(
  rawUrl: string,
  source: SavedPlaceSource
): { placeName: string; cityHint: string | null; googleMapsUrl: string | null } | null {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();

    if (host.includes("google.") || host.includes("maps.app.goo.gl")) {
      const queryCandidate = firstNonEmpty(
        decodeQueryValue(url.searchParams.get("query")),
        decodeQueryValue(url.searchParams.get("q")),
        decodeQueryValue(url.searchParams.get("destination"))
      );

      const pathCandidate = decodeFromPath(url.pathname);
      const combined = queryCandidate ?? pathCandidate;
      if (!combined || LAT_LNG_REGEX.test(combined)) return null;

      const { name, cityHint } = splitNameAndCity(combined);
      return {
        placeName: sanitizeFreeText(name) ?? combined,
        cityHint,
        googleMapsUrl: rawUrl,
      };
    }

    if (source === "instagram" && host.includes("instagram.com")) {
      const locationSlug = decodeInstagramLocationSlug(url.pathname);
      if (locationSlug) {
        const { name, cityHint } = splitNameAndCity(locationSlug);
        return {
          placeName: sanitizeFreeText(name) ?? locationSlug,
          cityHint,
          googleMapsUrl: null,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

function decodeInstagramLocationSlug(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.findIndex((part) => part === "locations");
  if (idx === -1 || !parts[idx + 2]) return null;
  const slug = parts[idx + 2];
  return sanitizeFreeText(decodeURIComponent(slug.replace(/[-_]+/g, " ")));
}

function decodeFromPath(pathname: string): string | null {
  const decoded = decodeURIComponent(pathname);
  const placeMatch = decoded.match(/\/place\/([^/]+)/i);
  if (placeMatch?.[1]) return sanitizeFreeText(placeMatch[1].replace(/\+/g, " "));

  const searchMatch = decoded.match(/\/search\/([^/]+)/i);
  if (searchMatch?.[1]) return sanitizeFreeText(searchMatch[1].replace(/\+/g, " "));

  return null;
}

function decodeQueryValue(value: string | null): string | null {
  if (!value) return null;
  return sanitizeFreeText(decodeURIComponent(value.replace(/\+/g, " ")));
}

function extractUrls(input: string): string[] {
  return [...input.matchAll(URL_REGEX)].map((m) => m[0]);
}

function inferCategoryFromText(text: string): SavedPlaceCategory {
  const normalized = normalizeSavedPlaceText(text);
  if (!normalized) return "sight";
  if (FOOD_KEYWORDS.some((word) => normalized.includes(word))) return "food";
  if (NIGHTLIFE_KEYWORDS.some((word) => normalized.includes(word))) return "nightlife";
  if (ACTIVITY_KEYWORDS.some((word) => normalized.includes(word))) return "activity";
  return "sight";
}

function sanitizeCandidate(candidate: SavedPlaceCandidate): SavedPlaceCandidate | null {
  const placeName = sanitizeFreeText(candidate.placeName);
  if (!placeName) return null;
  if (!looksLikePlaceName(placeName, candidate.source)) return null;

  return {
    placeName,
    cityHint: sanitizeCityHint(candidate.cityHint),
    categoryHint: normalizeSavedPlaceCategory(candidate.categoryHint),
    googleMapsUrl: sanitizeMapUrl(candidate.googleMapsUrl),
    notes: sanitizeFreeText(candidate.notes),
    source: candidate.source,
  };
}

function sanitizeMapUrl(url: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return null;
  return trimmed;
}

function sanitizeCityHint(value: string | null | undefined): string | null {
  const cleaned = sanitizeFreeText(value ?? "");
  if (!cleaned) return null;
  if (cleaned.split(" ").length > 4) return null;
  if (/\d/.test(cleaned)) return null;
  return cleaned;
}

function sanitizeFreeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
}

function looksLikePlaceName(name: string, source: SavedPlaceSource): boolean {
  const cleaned = sanitizeFreeText(name);
  if (!cleaned) return false;
  if (cleaned.length < 2 || cleaned.length > 120) return false;
  if (!/[a-zA-Z]/.test(cleaned)) return false;
  if (source === "instagram" && /^@[\w._-]+$/.test(cleaned)) return false;
  if (NOISE_LINE_PATTERNS.some((pattern) => pattern.test(cleaned))) return false;
  return true;
}

function isNoiseLine(line: string, source: SavedPlaceSource): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (NOISE_LINE_PATTERNS.some((pattern) => pattern.test(trimmed))) return true;
  if (source === "instagram" && /^@[\w._-]+$/.test(trimmed)) return true;
  if (trimmed.split(" ").length > 18) return true;
  return false;
}

function firstStringFromKeys<T extends readonly string[]>(
  obj: Record<string, unknown>,
  keys: T
): string | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function firstValidMapUrl(...candidates: Array<string | null>): string | null {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const cleaned = sanitizeMapUrl(candidate);
    if (cleaned) return cleaned;
  }
  return null;
}

function firstNonEmpty(...candidates: Array<string | null>): string | null {
  for (const candidate of candidates) {
    if (candidate) return candidate;
  }
  return null;
}

function selectRicherText(a: string | null, b: string | null): string | null {
  const aClean = sanitizeFreeText(a);
  const bClean = sanitizeFreeText(b);
  if (!aClean) return bClean;
  if (!bClean) return aClean;
  return bClean.length > aClean.length ? bClean : aClean;
}

function scoreCandidate(input: {
  category: SavedPlaceCategory;
  cityHint: string | null;
  city: string;
  episode: string;
  source: SavedPlaceSource;
}): number {
  const episodeBias = episodeCategoryBias(input.episode, input.category);
  const cityScore = scoreCityMatch(input.cityHint, input.city);
  const sourceScore = input.source === "google_maps" ? 3 : 2;
  return episodeBias + cityScore + sourceScore;
}

function scoreCityMatch(cityHint: string | null, normalizedCity: string): number {
  if (!cityHint) return 8;
  const normalizedHint = normalizeSavedPlaceText(cityHint);
  if (!normalizedHint) return 0;
  if (!normalizedCity) return 2;
  if (normalizedHint === normalizedCity) return 35;
  if (normalizedHint.includes(normalizedCity) || normalizedCity.includes(normalizedHint)) return 25;
  const hintTokens = normalizedHint.split(" ");
  const cityTokens = normalizedCity.split(" ");
  if (hintTokens.some((token) => cityTokens.includes(token))) return 10;
  return -5;
}

function episodeCategoryBias(episode: string, category: SavedPlaceCategory): number {
  const normalizedEpisode = normalizeSavedPlaceText(episode);
  const preference =
    normalizedEpisode === "morning"
      ? ["food", "sight", "activity", "nightlife"]
      : normalizedEpisode === "afternoon"
        ? ["sight", "activity", "food", "nightlife"]
        : ["food", "nightlife", "activity", "sight"];

  const idx = preference.indexOf(category);
  if (idx === -1) return 0;
  return (preference.length - idx) * 5;
}
