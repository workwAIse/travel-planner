import type { SavedPlaceSuggestionRow, SavedPlaceSource } from "./saved-places";

export type EmbeddedSavedPlaceRow = SavedPlaceSuggestionRow & {
  google_maps_url: string | null;
  notes: string | null;
  created_at: string;
};

const START_MARKER = "\n\n<!-- SAVED_PLACES_IMPORTS_START -->\n";
const END_MARKER = "\n<!-- SAVED_PLACES_IMPORTS_END -->";

type EmbeddedPayload = {
  version: 1;
  rows: EmbeddedSavedPlaceRow[];
};

export function parseTripRawInputSavedPlaces(rawInput: string | null): {
  baseRawInput: string;
  rows: EmbeddedSavedPlaceRow[];
} {
  const value = rawInput ?? "";
  const start = value.indexOf(START_MARKER);
  if (start === -1) {
    return { baseRawInput: value, rows: [] };
  }

  const jsonStart = start + START_MARKER.length;
  const end = value.indexOf(END_MARKER, jsonStart);
  if (end === -1) {
    return { baseRawInput: value, rows: [] };
  }

  const baseRawInput = value.slice(0, start).trimEnd();
  const jsonPayload = value.slice(jsonStart, end).trim();
  if (!jsonPayload) {
    return { baseRawInput, rows: [] };
  }

  try {
    const parsed = JSON.parse(jsonPayload) as EmbeddedPayload;
    if (parsed.version !== 1 || !Array.isArray(parsed.rows)) {
      return { baseRawInput, rows: [] };
    }
    return {
      baseRawInput,
      rows: parsed.rows
        .map((row) => sanitizeEmbeddedRow(row))
        .filter((row): row is EmbeddedSavedPlaceRow => row !== null),
    };
  } catch {
    return { baseRawInput, rows: [] };
  }
}

export function serializeTripRawInputSavedPlaces(
  baseRawInput: string,
  rows: EmbeddedSavedPlaceRow[]
): string {
  const trimmedBase = baseRawInput.trimEnd();
  if (rows.length === 0) return trimmedBase;

  const payload: EmbeddedPayload = { version: 1, rows };
  return `${trimmedBase}${START_MARKER}${JSON.stringify(payload)}${END_MARKER}`;
}

function sanitizeEmbeddedRow(value: unknown): EmbeddedSavedPlaceRow | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;

  const source = normalizeSource(row.source);
  const placeName = toStringOrNull(row.place_name);
  if (!source || !placeName) return null;

  return {
    source,
    place_name: placeName,
    city_hint: toStringOrNull(row.city_hint),
    category_hint: toStringOrNull(row.category_hint),
    collection_name: toStringOrNull(row.collection_name),
    google_maps_url: toStringOrNull(row.google_maps_url),
    notes: toStringOrNull(row.notes),
    created_at: toStringOrNull(row.created_at) ?? new Date().toISOString(),
  };
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

function normalizeSource(value: unknown): SavedPlaceSource | null {
  if (value === "google_maps" || value === "instagram") return value;
  return null;
}
