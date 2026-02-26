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

    const morningPlaces = places.filter((p) => p.episode === "Morning");
    const afternoonPlaces = places.filter((p) => p.episode === "Afternoon");
    const eveningPlaces = places.filter((p) => p.episode === "Evening");

    const formatSection = (label: string, list: typeof places) =>
      list.length > 0
        ? `${label}: ${list.map((p) => `${p.name}${p.category ? ` (${p.category})` : ""}`).join(", ")}`
        : null;

    const sections = [
      formatSection("Morning", morningPlaces),
      formatSection("Afternoon", afternoonPlaces),
      formatSection("Evening", eveningPlaces),
    ].filter(Boolean).join(". ");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a travel writer for a premium lifestyle magazine. Write vivid, personal day narratives for travelers.

Return JSON with:
- theme: a short 2-4 word editorial theme (e.g. "Arrival & First Impressions", "Imperial Heritage", "Street Food Safari", "Coastal Escape")
- summary: a rich 2-3 sentence narrative (40-60 words) describing what the traveler will experience. Write in second person ("you"). Be specific about the places. Evoke atmosphere, senses, and emotions. Mention transitions between episodes naturally. Do NOT just list places — weave them into a story.

Example: "Your morning begins at the ancient Imperial City, where towering citadel walls guard centuries of royal history. After lunch along the Perfume River promenade, the evening draws you into the lantern-lit streets for a bowl of bún bò Huế at a family-run stall."`,
        },
        {
          role: "user",
          content: `City: ${city}. ${sections}. Write the theme and narrative summary.`,
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
  return { theme: "Exploration", summary: `Explore the best of ${city} at your own pace.` };
}
