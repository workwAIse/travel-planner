"use server";

import OpenAI from "openai";
import { formatFetchError } from "./errors";
import { parsedItinerarySchema, type ParsedItinerary } from "./schema";

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set.");
  return new OpenAI({ apiKey: key });
}

const SYSTEM_PROMPT = `You are an itinerary parser. Given raw travel itinerary text, extract structured data.
Output valid JSON only (no markdown, no code fence). Dates must be YYYY-MM-DD.
For each day include: date, place (city/region), optional theme, summary (what you'll see that day), and episodes.
Episodes are Morning, Afternoon, Evening. Each episode can have an array of places.
For each place provide:
- name: the place or activity name
- addressOrDescription: full address or location text from the input
- description: one short sentence (1–2 lines) describing what you will see or do there; infer from the name and context if the input does not state it (e.g. "Famous pedestrian boulevard with cafes and city views", "Historic apartment building with independent shops and cafes")
- googleMapsUrl: if present in the text, else empty string`;

const USER_PROMPT_PREFIX = `Parse this itinerary into the following JSON shape. Return only the JSON object, no other text.
Each place must include: name, addressOrDescription, description (one sentence about what you'll see/do there), googleMapsUrl.

Itinerary text:
`;

export async function parseItinerary(rawText: string): Promise<{ data?: ParsedItinerary; error?: string }> {
  if (!process.env.OPENAI_API_KEY) {
    return { error: "OPENAI_API_KEY is not set." };
  }
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { error: "Paste some itinerary text first." };
  }

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: USER_PROMPT_PREFIX + trimmed },
      ],
      response_format: { type: "json_schema", json_schema: itineraryJsonSchema() },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { error: "No response from the model." };
    }

    let json: unknown;
    try {
      json = JSON.parse(content);
    } catch {
      const stripped = content.replace(/^```\w*\n?|\n?```$/g, "").trim();
      json = JSON.parse(stripped);
    }

    const parsed = parsedItinerarySchema.safeParse(json);
    if (!parsed.success) {
      return { error: `Validation failed: ${parsed.error.message}` };
    }
    return { data: parsed.data };
  } catch (err) {
    const message = formatFetchError(err, "Parsing (OpenAI)") + " Check OPENAI_API_KEY.";
    return { error: message };
  }
}

function itineraryJsonSchema(): {
  name: string;
  strict: boolean;
  schema: Record<string, unknown>;
} {
  return {
    name: "Itinerary",
    strict: true,
    schema: {
      type: "object",
      properties: {
        days: {
          type: "array",
          items: {
            type: "object",
            properties: {
              date: { type: "string" },
              place: { type: "string" },
              theme: { type: "string" },
              summary: { type: "string" },
              episodes: {
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
            },
            required: ["date", "place", "theme", "summary", "episodes"],
            additionalProperties: false,
          },
        },
      },
      required: ["days"],
      additionalProperties: false,
    },
  };
}

function placeItemSchema(): { type: "object"; properties: Record<string, unknown>; required: string[]; additionalProperties: boolean } {
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
