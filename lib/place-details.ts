"use server";

import OpenAI from "openai";
import type { PlaceCategory } from "./schema";

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set.");
  return new OpenAI({ apiKey: key });
}

export type PlaceDetail = {
  descriptionLong: string;
  category: PlaceCategory;
  durationMinutes: number;
  addressShort: string;
};

export async function generatePlaceDetails(
  places: { name: string; city: string; description?: string }[]
): Promise<PlaceDetail[]> {
  if (places.length === 0) return [];

  try {
    const openai = getOpenAI();

    const placesText = places
      .map((p, i) => `${i + 1}. "${p.name}" in ${p.city}${p.description ? ` - ${p.description}` : ""}`)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a travel guide writer. For each place, provide:
- descriptionLong: A 2-3 sentence engaging travel guide description. Be specific and helpful.
- category: One of: sight, food, nightlife, transport, accommodation, activity
- durationMinutes: Estimated visit duration in minutes (e.g. 60 for a museum, 30 for a cafe)
- addressShort: A short, human-friendly location (e.g. "District 1, HCMC" not full address)

Return a JSON array of objects with these four fields, in the same order as the input.`,
        },
        {
          role: "user",
          content: `Generate travel guide details for these places:\n${placesText}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "PlaceDetails",
          strict: true,
          schema: {
            type: "object",
            properties: {
              places: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    descriptionLong: { type: "string" },
                    category: {
                      type: "string",
                      enum: ["sight", "food", "nightlife", "transport", "accommodation", "activity"],
                    },
                    durationMinutes: { type: "number" },
                    addressShort: { type: "string" },
                  },
                  required: ["descriptionLong", "category", "durationMinutes", "addressShort"],
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
    if (!content) return places.map(() => fallbackDetail());

    const parsed = JSON.parse(content) as { places: PlaceDetail[] };
    if (!Array.isArray(parsed.places)) return places.map(() => fallbackDetail());

    return parsed.places.map((p) => ({
      descriptionLong: p.descriptionLong || "A notable stop on your journey.",
      category: p.category || "sight",
      durationMinutes: p.durationMinutes || 45,
      addressShort: p.addressShort || "",
    }));
  } catch {
    return places.map(() => fallbackDetail());
  }
}

function fallbackDetail(): PlaceDetail {
  return {
    descriptionLong: "A notable stop on your journey.",
    category: "sight",
    durationMinutes: 45,
    addressShort: "",
  };
}
