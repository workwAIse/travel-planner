"use server";

import OpenAI from "openai";
import type { ParsedPlace, EpisodeKey } from "./schema";

const EPISODE_KEYS: EpisodeKey[] = ["Morning", "Afternoon", "Evening"];

export type ReshuffleDayInput = {
  date: string;
  place: string;
  theme?: string | null;
  summary?: string | null;
};

export type ReshuffledEpisodes = {
  Morning: ParsedPlace[];
  Afternoon: ParsedPlace[];
  Evening: ParsedPlace[];
};

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set.");
  return new OpenAI({ apiKey: key });
}

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

function reshuffledDayJsonSchema(): { name: string; strict: boolean; schema: Record<string, unknown> } {
  return {
    name: "ReshuffledDay",
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

function parseReshuffledEpisodes(json: unknown): ReshuffledEpisodes | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const result: ReshuffledEpisodes = { Morning: [], Afternoon: [], Evening: [] };
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
 * Generate a new full-day plan (Morning/Afternoon/Evening) for one day, excluding places
 * that appear on other days of the same trip. Optional userPrompt steers the result.
 */
export async function generateReshuffledDay(
  day: ReshuffleDayInput,
  otherDaysPlaceNames: string[],
  userPrompt?: string
): Promise<ReshuffledEpisodes | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const openai = getOpenAI();
  const excludedList = [...new Set(otherDaysPlaceNames.map((n) => n.trim()).filter(Boolean))];
  const exclusionText =
    excludedList.length > 0
      ? `Do NOT suggest any of these places (the traveler will visit them on other days):\n${excludedList.map((n) => `- ${n}`).join("\n")}`
      : "";

  const systemContent = `You are a travel itinerary designer. Create a new full-day plan for one day with multiple concrete stops.

Rules:
- Output exactly three time blocks: Morning, Afternoon, Evening.
- Each block must have 2–4 specific places (sights, restaurants, neighborhoods, activities) in ${day.place}. Use real venues and a mix of experiences.
${exclusionText ? `${exclusionText}\n- Only suggest places in ${day.place} for this day.` : ""}
- For each place provide: name (specific venue or area), addressOrDescription (district/street or "City center" if generic), description (one short sentence: what you see/do there), googleMapsUrl (leave empty string "").`;

  const contextParts = [day.date, day.place];
  if (day.theme) contextParts.push(`Theme: ${day.theme}`);
  if (day.summary) contextParts.push(`Summary: ${day.summary}`);
  let userContent = `Create a new day plan for: ${contextParts.join(". ")}.`;
  if (userPrompt?.trim()) {
    userContent += `\nTraveler request for this day: ${userPrompt.trim()}`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_schema", json_schema: reshuffledDayJsonSchema() },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    let json: unknown;
    try {
      json = JSON.parse(content);
    } catch {
      const stripped = content.replace(/^```\w*\n?|\n?```$/g, "").trim();
      json = JSON.parse(stripped);
    }

    return parseReshuffledEpisodes(json);
  } catch {
    return null;
  }
}
