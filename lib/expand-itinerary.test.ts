import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ParsedDay, ParsedItinerary } from "@/lib/schema";
import { isThinDay, expandThinItinerary, expandDay } from "@/lib/expand-itinerary";

function dayWithPlaces(
  place: string,
  date: string,
  counts: { Morning?: number; Afternoon?: number; Evening?: number }
): ParsedDay {
  const placeEntry = {
    name: "Some place",
    addressOrDescription: "",
    description: "A place",
    googleMapsUrl: "",
  };
  const make = (n: number) => Array.from({ length: n }, () => ({ ...placeEntry }));
  return {
    date,
    place,
    summary: "",
    episodes: {
      Morning: make(counts.Morning ?? 0),
      Afternoon: make(counts.Afternoon ?? 0),
      Evening: make(counts.Evening ?? 0),
    },
  };
}

describe("isThinDay", () => {
  it("returns true when day has no places", async () => {
    const day = dayWithPlaces("Ho Chi Minh City", "2025-03-13", {
      Morning: 0,
      Afternoon: 0,
      Evening: 0,
    });
    expect(await isThinDay(day)).toBe(true);
  });

  it("returns true when day has fewer than 4 places total", async () => {
    const day = dayWithPlaces("Hoi An", "2025-03-16", {
      Morning: 1,
      Afternoon: 0,
      Evening: 1,
    });
    expect(await isThinDay(day)).toBe(true);
  });

  it("returns true when any episode has 0 places", async () => {
    const day = dayWithPlaces("Da Nang", "2025-03-18", {
      Morning: 2,
      Afternoon: 0,
      Evening: 2,
    });
    expect(await isThinDay(day)).toBe(true);
  });

  it("returns false when day has 4+ places and every episode has at least 1", async () => {
    const day = dayWithPlaces("Hue", "2025-03-19", {
      Morning: 2,
      Afternoon: 1,
      Evening: 1,
    });
    expect(await isThinDay(day)).toBe(false);
  });

  it("returns false when day has 2+ per episode (6 total)", async () => {
    const day = dayWithPlaces("Hanoi", "2025-03-22", {
      Morning: 2,
      Afternoon: 2,
      Evening: 2,
    });
    expect(await isThinDay(day)).toBe(false);
  });
});

describe("expandThinItinerary", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns same itinerary when OPENAI_API_KEY is not set", async () => {
    delete process.env.OPENAI_API_KEY;
    const parsed: ParsedItinerary = {
      days: [
        dayWithPlaces("HCMC", "2025-03-13", { Morning: 0, Afternoon: 0, Evening: 0 }),
      ],
    };
    const result = await expandThinItinerary(parsed);
    expect(result.days).toHaveLength(1);
    expect(result.days[0].episodes.Morning).toHaveLength(0);
  });
});

describe("expandDay", () => {
  it("returns same day when OPENAI_API_KEY is not set", async () => {
    const env = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const day = dayWithPlaces("Hanoi", "2025-03-22", {
      Morning: 0,
      Afternoon: 0,
      Evening: 0,
    });
    const result = await expandDay(day);
    expect(result).toEqual(day);
    if (env) process.env.OPENAI_API_KEY = env;
  });
});
