import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateReshuffledDay } from "@/lib/reshuffle-day";

const mockDay = {
  date: "2025-03-13",
  place: "Ho Chi Minh City",
  theme: "City intro",
  summary: "First day in HCMC",
};

describe("generateReshuffledDay", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns null when OPENAI_API_KEY is not set", async () => {
    delete process.env.OPENAI_API_KEY;
    const result = await generateReshuffledDay(mockDay, ["War Remnants Museum"]);
    expect(result).toBeNull();
  });

  it("returns parsed episodes when OpenAI returns valid JSON and exclusions are passed", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const mockContent =
      '{"Morning":[{"name":"Ben Thanh Market","addressOrDescription":"District 1","description":"Central market.","googleMapsUrl":""}],"Afternoon":[{"name":"Notre-Dame Basilica","addressOrDescription":"District 1","description":"Landmark church.","googleMapsUrl":""}],"Evening":[{"name":"Pho 2000","addressOrDescription":"District 1","description":"Famous pho spot.","googleMapsUrl":""}]}';

    vi.doMock("openai", () => ({
      default: vi.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: mockContent } }],
            }),
          },
        },
      })),
    }));

    vi.resetModules();
    const { generateReshuffledDay: generate } = await import("@/lib/reshuffle-day");
    const result = await generate(mockDay, ["War Remnants Museum", "Cu Chi Tunnels"]);
    expect(result).not.toBeNull();
    expect(result!.Morning).toHaveLength(1);
    expect(result!.Afternoon).toHaveLength(1);
    expect(result!.Evening).toHaveLength(1);
    const allNames = [
      ...result!.Morning.map((p) => p.name),
      ...result!.Afternoon.map((p) => p.name),
      ...result!.Evening.map((p) => p.name),
    ];
    expect(allNames).not.toContain("War Remnants Museum");
    expect(allNames).not.toContain("Cu Chi Tunnels");
  });
});
