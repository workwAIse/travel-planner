"use server";

import OpenAI from "openai";

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set.");
  return new OpenAI({ apiKey: key });
}

export type DaySummaryResult = {
  summary: string;
  theme: string;
};

export async function regenerateDaySummary(
  city: string,
  places: { name: string; episode: string; category: string | null }[]
): Promise<DaySummaryResult> {
  try {
    const openai = getOpenAI();

    const placeList = places
      .map((p) => `${p.episode}: ${p.name}${p.category ? ` (${p.category})` : ""}`)
      .join(", ");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You write brief, engaging travel day summaries. Return JSON with:
- theme: a 1-3 word theme for the day (e.g. "Arrival", "Sightseeing", "Culture & Art", "Food Tour")
- summary: a single sentence (max 20 words) summarizing what the traveler will experience that day`,
        },
        {
          role: "user",
          content: `City: ${city}. Stops: ${placeList}. Write a theme and summary for this day.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "DaySummary",
          strict: true,
          schema: {
            type: "object",
            properties: {
              theme: { type: "string" },
              summary: { type: "string" },
            },
            required: ["theme", "summary"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return fallback(city);

    const parsed = JSON.parse(content) as DaySummaryResult;
    return {
      theme: parsed.theme || "Exploration",
      summary: parsed.summary || `Explore ${city}.`,
    };
  } catch {
    return fallback(city);
  }
}

function fallback(city: string): DaySummaryResult {
  return { theme: "Exploration", summary: `Explore ${city}.` };
}
