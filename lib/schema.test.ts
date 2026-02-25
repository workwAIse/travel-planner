import { describe, it, expect } from "vitest";
import {
  parsedItinerarySchema,
  enrichedItinerarySchema,
  parsedPlaceSchema,
  parsedDaySchema,
} from "./schema";

describe("parsedPlaceSchema", () => {
  it("accepts valid place", () => {
    const result = parsedPlaceSchema.safeParse({
      name: "Nguyễn Huệ Walking Street",
      addressOrDescription: "Nguyen Hue Walking Street, Ho Chi Minh City, Vietnam",
    });
    expect(result.success).toBe(true);
  });

  it("accepts place with optional googleMapsUrl", () => {
    const result = parsedPlaceSchema.safeParse({
      name: "Café Apartment",
      addressOrDescription: "42 Nguyen Hue",
      googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=test",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name or addressOrDescription", () => {
    expect(parsedPlaceSchema.safeParse({ name: "X" }).success).toBe(false);
    expect(parsedPlaceSchema.safeParse({ addressOrDescription: "Y" }).success).toBe(false);
  });
});

describe("parsedDaySchema", () => {
  it("accepts valid day with episodes", () => {
    const result = parsedDaySchema.safeParse({
      date: "2026-03-13",
      place: "Ho Chi Minh City",
      theme: "Arrival + Architecture",
      summary: "Arrival and sightseeing.",
      episodes: {
        Afternoon: [
          { name: "Nguyễn Huệ Walking Street", addressOrDescription: "Nguyen Hue, HCMC" },
        ],
        Evening: [],
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts day with date as string and empty episodes", () => {
    const result = parsedDaySchema.safeParse({
      date: "2026-03-13",
      place: "HCMC",
      summary: "Day one",
      episodes: {},
    });
    expect(result.success).toBe(true);
  });
});

describe("parsedItinerarySchema", () => {
  it("accepts valid itinerary with multiple days", () => {
    const result = parsedItinerarySchema.safeParse({
      days: [
        {
          date: "2026-03-13",
          place: "Ho Chi Minh City",
          summary: "Arrival.",
          episodes: { Afternoon: [{ name: "A", addressOrDescription: "B" }] },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty days", () => {
    const result = parsedItinerarySchema.safeParse({ days: [] });
    expect(result.success).toBe(true);
  });
});

describe("enrichedItinerarySchema", () => {
  it("accepts enriched day with places with lat/lng and imageUrl", () => {
    const result = enrichedItinerarySchema.safeParse({
      days: [
        {
          date: "2026-03-13",
          place: "Ho Chi Minh City",
          summary: "Arrival.",
          episodes: { Afternoon: [] },
          places: [
            {
              name: "Nguyễn Huệ",
              addressOrDescription: "HCMC",
              lat: 10.7769,
              lng: 106.7009,
              imageUrl: "https://example.com/photo.jpg",
              episode: "Afternoon",
              sortOrder: 0,
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});
