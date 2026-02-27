import OpenAI from "openai";
import { formatFetchError } from "./errors";
import {
  mergeSavedPlaceCandidates,
  normalizeSavedPlaceCategory,
  parseSavedPlacesInput,
  type SavedPlaceCandidate,
  type SavedPlaceSource,
} from "./saved-places";

export type SmartParseSavedPlacesResult = {
  items: SavedPlaceCandidate[];
  warnings: string[];
  aiItems: number;
};

export async function smartParseSavedPlaces(
  rawInput: string,
  source: SavedPlaceSource
): Promise<SmartParseSavedPlacesResult> {
  const heuristic = parseSavedPlacesInput(rawInput, source);
  const warnings = [...heuristic.warnings];
  const trimmed = rawInput.trim();

  const shouldUseAi = trimmed.length >= 80 && heuristic.items.length < 40;
  if (!shouldUseAi) {
    return { items: heuristic.items, warnings, aiItems: 0 };
  }

  if (!process.env.OPENAI_API_KEY) {
    warnings.push("OPENAI_API_KEY is missing, AI parsing boost was skipped.");
    return { items: heuristic.items, warnings, aiItems: 0 };
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You extract real-world places from user exports. Return JSON only. Keep only places that a traveler can visit. Ignore usernames, folders, timestamps, likes, and generic labels.",
        },
        {
          role: "user",
          content: [
            `Source: ${source}`,
            "Extract saved places from this raw export/paste. Return up to 120 places.",
            "Each place must include: name, cityHint, category (sight|food|nightlife|activity), googleMapsUrl, notes.",
            "If a field is unknown, return an empty string.",
            "Raw input:",
            trimmed,
          ].join("\n"),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "SavedPlacesImport",
          strict: true,
          schema: {
            type: "object",
            properties: {
              places: {
                type: "array",
                maxItems: 120,
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    cityHint: { type: "string" },
                    category: { type: "string" },
                    googleMapsUrl: { type: "string" },
                    notes: { type: "string" },
                  },
                  required: ["name", "cityHint", "category", "googleMapsUrl", "notes"],
                  additionalProperties: false,
                },
              },
            },
            required: ["places"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      warnings.push("AI parser returned no content.");
      return { items: heuristic.items, warnings, aiItems: 0 };
    }

    let json: unknown;
    try {
      json = JSON.parse(content);
    } catch {
      warnings.push("AI parser returned malformed JSON.");
      return { items: heuristic.items, warnings, aiItems: 0 };
    }

    const aiItems = parseAiCandidates(json, source);
    const merged = mergeSavedPlaceCandidates([...heuristic.items, ...aiItems]);
    return { items: merged, warnings, aiItems: aiItems.length };
  } catch (err) {
    warnings.push(`AI parsing boost failed: ${formatFetchError(err, "Saved places parsing")}`);
    return { items: heuristic.items, warnings, aiItems: 0 };
  }
}

function parseAiCandidates(payload: unknown, source: SavedPlaceSource): SavedPlaceCandidate[] {
  if (!payload || typeof payload !== "object") return [];
  const places = (payload as { places?: unknown }).places;
  if (!Array.isArray(places)) return [];

  const items: SavedPlaceCandidate[] = [];
  for (const place of places) {
    if (!place || typeof place !== "object") continue;
    const row = place as Record<string, unknown>;
    const name = asCleanString(row.name);
    if (!name) continue;

    items.push({
      placeName: name,
      cityHint: asCleanString(row.cityHint),
      categoryHint: normalizeSavedPlaceCategory(asCleanString(row.category)),
      googleMapsUrl: asUrl(row.googleMapsUrl),
      notes: asCleanString(row.notes),
      source,
    });
  }
  return items;
}

function asCleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

function asUrl(value: unknown): string | null {
  const asString = asCleanString(value);
  if (!asString) return null;
  if (!asString.startsWith("http://") && !asString.startsWith("https://")) return null;
  return asString;
}
