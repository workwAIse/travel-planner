"use server";

import OpenAI from "openai";

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set.");
  return new OpenAI({ apiKey: key });
}

export type Recommendation = {
  name: string;
  reason: string;
  category: string;
};

export async function getRecommendations(
  city: string,
  currentStops: string[],
  removedOrMovedStop: string | null,
  context: string
): Promise<Recommendation[]> {
  try {
    const openai = getOpenAI();

    const prompt = removedOrMovedStop
      ? `The traveler removed "${removedOrMovedStop}" from their day in ${city}. Current stops: ${currentStops.join(", ") || "none"}. Context: ${context}. Suggest 2-3 nearby alternatives.`
      : `The traveler is in ${city}. Current stops: ${currentStops.join(", ") || "none"}. Context: ${context}. Suggest 2-3 additional places worth visiting.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a travel advisor. Suggest alternative or additional stops for a traveler. Return a JSON object with a "recommendations" array. Each recommendation has: name (place name), reason (one sentence why), category (one of: sight, food, nightlife, activity).`,
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "Recommendations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    reason: { type: "string" },
                    category: { type: "string" },
                  },
                  required: ["name", "reason", "category"],
                  additionalProperties: false,
                },
              },
            },
            required: ["recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content) as { recommendations: Recommendation[] };
    return parsed.recommendations ?? [];
  } catch {
    return [];
  }
}
