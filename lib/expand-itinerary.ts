"use server";

import OpenAI from "openai";
import type { ParsedItinerary, ParsedDay, ParsedPlace, EpisodeKey } from "./schema";

const EPISODE_KEYS: EpisodeKey[] = ["Morning", "Afternoon", "Evening"];

/** Minimum total places per day to consider the day "full". Below this we expand. */
const MIN_PLACES_PER_DAY = 4;

/** Minimum places per episode. If any episode has fewer, we expand the day. */
const MIN_PLACES_PER_EPISODE = 1;

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set.");
  return new OpenAI({ apiKey: key });
}

function countPlaces(day: ParsedDay): number {
  let n = 0;
  for (const key of EPISODE_KEYS) {
    const list = day.episodes[key] ?? [];
    n += list.length;
  }
  return n;
}

function isDayThin(day: ParsedDay): boolean {
  const total = countPlaces(day);
  if (total < MIN_PLACES_PER_DAY) return true;
  for (const key of EPISODE_KEYS) {
    const list = day.episodes[key] ?? [];
    if (list.length < MIN_PLACES_PER_EPISODE) return true;
  }
  return false;
}

const EXPAND_SYSTEM = `You are a travel itinerary designer. Given a day with only a city/region name (and optional context), create a fast-paced day plan with multiple concrete stops.

Rules:
- Output exactly three time blocks: Morning, Afternoon, Evening.
- Each block must have 2–4 specific places (sights, restaurants, neighborhoods, activities). Prefer a mix: one main attraction, one food stop, one walkable area or market.
- For each place provide: name (specific venue or area), addressOrDescription (district/street or "City center" if generic), description (one short sentence: what you see/do there), googleMapsUrl (leave empty string "").
- Be specific: use real landmarks, famous streets, and typical local experiences (e.g. "Bến Thành Market", "War Remnants Museum", "Phở 2000", not just "market" or "museum").
- If the user's summary mentions a day trip (e.g. "maybe Ha Long Bay 1 day"), use one full day for that (e.g. Morning/Afternoon/Evening all for the day trip) with 2–4 stops there.
- Dates are YYYY-MM-DD; use them only for context (e.g. weekday) if relevant.`;

function placeItemSchema(): Record<string, unknown> {
  return {
    type: "object",
    properties: {
      name: { type: "string" },
      addressOrDescription: { type: "string" },
      description: { type: "string" },
      googleMapsUrl: { type: "string" },
    },
    required: ["name", "addressOrDescription", "description", "googleMapsUrl"],
    additionalProperties: false,
  };
}

function expandedDayJsonSchema(): { name: string; strict: boolean; schema: Record<string, unknown> } {
  return {
    name: "ExpandedDay",
    strict: true,
    schema: {
      type: "object",
      properties: {
        Morning: {
          type: "array",
          items: placeItemSchema(),
        },
        Afternoon: {
          type: "array",
          items: placeItemSchema(),
        },
        Evening: {
          type: "array",
          items: placeItemSchema(),
        },
      },
      required: ["Morning", "Afternoon", "Evening"],
      additionalProperties: false,
    },
  };
}

function parseExpandedEpisodes(json: unknown): ParsedDay["episodes"] | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const result: ParsedDay["episodes"] = { Morning: [], Afternoon: [], Evening: [] };
  for (const key of EPISODE_KEYS) {
    const arr = o[key];
    if (!Array.isArray(arr)) return null;
    const places: ParsedPlace[] = [];
    for (const item of arr) {
      if (!item || typeof item !== "object") continue;
      const p = item as Record<string, unknown>;
      const name = typeof p.name === "string" ? p.name : "";
      const addressOrDescription = typeof p.addressOrDescription === "string" ? p.addressOrDescription : "";
      const description = typeof p.description === "string" ? p.description : "";
      const googleMapsUrl = typeof p.googleMapsUrl === "string" ? p.googleMapsUrl : "";
      if (name.trim()) {
        places.push({ name: name.trim(), addressOrDescription, description, googleMapsUrl });
      }
    }
    result[key as EpisodeKey] = places;
  }
  return result;
}

/**
 * Expand a single thin day into a full day plan (2–4 stops per Morning/Afternoon/Evening).
 */
export async function expandDay(day: ParsedDay): Promise<ParsedDay> {
  if (!process.env.OPENAI_API_KEY) return day;

  const openai = getOpenAI();
  const context = [day.place, day.date].filter(Boolean).join(", ");
  const extra = [day.theme, day.summary].filter(Boolean).join(". ");
  const userMessage = extra
    ? `Create a fast-paced day plan for: ${context}. Context: ${extra}`
    : `Create a fast-paced day plan for: ${context}.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: EXPAND_SYSTEM },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_schema", json_schema: expandedDayJsonSchema() },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return day;

    let json: unknown;
    try {
      json = JSON.parse(content);
    } catch {
      const stripped = content.replace(/^```\w*\n?|\n?```$/g, "").trim();
      json = JSON.parse(stripped);
    }

    const episodes = parseExpandedEpisodes(json);
    if (episodes) {
      return { ...day, episodes };
    }
  } catch {
    // Non-fatal: keep original thin day
  }
  return day;
}

/**
 * Expand any thin days in the itinerary (few or no stops) into full day plans with 2–4 stops per episode.
 */
export async function expandThinItinerary(parsed: ParsedItinerary): Promise<ParsedItinerary> {
  if (!process.env.OPENAI_API_KEY) return parsed;

  const days: ParsedDay[] = [];
  for (const day of parsed.days) {
    if (isDayThin(day)) {
      days.push(await expandDay(day));
    } else {
      days.push(day);
    }
  }
  return { days };
}

export async function isThinDay(day: ParsedDay): Promise<boolean> {
  return isDayThin(day);
}
