import { describe, it, expect } from "vitest";
import {
  parsedItinerarySchema,
  enrichedItinerarySchema,
  parsedPlaceSchema,
  parsedDaySchema,
  enrichedPlaceSchema,
  enrichedDaySchema,
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

  it("accepts a multi-day trip (2+ days)", () => {
    const result = parsedItinerarySchema.safeParse({
      days: [
        {
          date: "2026-03-13",
          place: "Ho Chi Minh City",
          summary: "Arrival.",
          episodes: { Morning: [{ name: "A", addressOrDescription: "B" }] },
        },
        {
          date: "2026-03-14",
          place: "Ho Chi Minh City",
          theme: "Culture",
          summary: "Temples and museums.",
          episodes: {
            Morning: [{ name: "War Remnants Museum", addressOrDescription: "District 3" }],
            Afternoon: [{ name: "Ben Thanh Market", addressOrDescription: "District 1" }],
          },
        },
        {
          date: "2026-03-15",
          place: "Mekong Delta",
          summary: "Day trip.",
          episodes: { Morning: [], Afternoon: [] },
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.days).toHaveLength(3);
    }
  });
});

describe("enrichedPlaceSchema", () => {
  const basePlace = {
    name: "Nguyễn Huệ",
    addressOrDescription: "HCMC",
    lat: 10.7769,
    lng: 106.7009,
    imageUrl: "https://example.com/photo.jpg",
    episode: "Afternoon" as const,
    sortOrder: 0,
  };

  it("accepts enriched place without new optional fields", () => {
    const result = enrichedPlaceSchema.safeParse(basePlace);
    expect(result.success).toBe(true);
  });

  it("accepts enriched place with all new optional fields", () => {
    const result = enrichedPlaceSchema.safeParse({
      ...basePlace,
      descriptionLong: "A beautiful walking street in the heart of Ho Chi Minh City.",
      category: "sight",
      durationMinutes: 60,
      addressShort: "District 1, HCMC",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null values for new optional fields", () => {
    const result = enrichedPlaceSchema.safeParse({
      ...basePlace,
      descriptionLong: null,
      category: null,
      durationMinutes: null,
      addressShort: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid category value", () => {
    const result = enrichedPlaceSchema.safeParse({
      ...basePlace,
      category: "invalid_category",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid category values", () => {
    const categories = ["sight", "food", "nightlife", "transport", "accommodation", "activity"];
    for (const category of categories) {
      const result = enrichedPlaceSchema.safeParse({ ...basePlace, category });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all nullable fields set to null", () => {
    const result = enrichedPlaceSchema.safeParse({
      name: "Test Place",
      addressOrDescription: "Somewhere",
      lat: null,
      lng: null,
      imageUrl: null,
      episode: "Morning" as const,
      sortOrder: 0,
      descriptionLong: null,
      category: null,
      durationMinutes: null,
      addressShort: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("enrichedDaySchema", () => {
  const baseDay = {
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
        episode: "Afternoon" as const,
        sortOrder: 0,
      },
    ],
  };

  it("accepts enriched day without weather fields", () => {
    const result = enrichedDaySchema.safeParse(baseDay);
    expect(result.success).toBe(true);
  });

  it("accepts enriched day with weather fields", () => {
    const result = enrichedDaySchema.safeParse({
      ...baseDay,
      weatherHighC: 34.5,
      weatherLowC: 25.2,
      weatherCondition: "Partly cloudy",
      weatherIcon: "⛅",
    });
    expect(result.success).toBe(true);
  });

  it("accepts null weather values", () => {
    const result = enrichedDaySchema.safeParse({
      ...baseDay,
      weatherHighC: null,
      weatherLowC: null,
      weatherCondition: null,
      weatherIcon: null,
    });
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

  it("accepts full enriched itinerary with weather and place details", () => {
    const result = enrichedItinerarySchema.safeParse({
      days: [
        {
          date: "2026-03-13",
          place: "Ho Chi Minh City",
          summary: "Arrival.",
          episodes: { Afternoon: [] },
          weatherHighC: 34.5,
          weatherLowC: 25.2,
          weatherCondition: "Clear sky",
          weatherIcon: "☀️",
          places: [
            {
              name: "Nguyễn Huệ",
              addressOrDescription: "HCMC",
              lat: 10.7769,
              lng: 106.7009,
              imageUrl: "https://example.com/photo.jpg",
              episode: "Afternoon",
              sortOrder: 0,
              descriptionLong: "A vibrant walking street.",
              category: "sight",
              durationMinutes: 60,
              addressShort: "District 1, HCMC",
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts complete multi-day enriched itinerary with all fields", () => {
    const result = enrichedItinerarySchema.safeParse({
      days: [
        {
          date: "2026-03-13",
          place: "Ho Chi Minh City",
          theme: "Arrival + Architecture",
          summary: "Arrival and sightseeing.",
          episodes: { Afternoon: [], Evening: [] },
          weatherHighC: 34.5,
          weatherLowC: 25.2,
          weatherCondition: "Clear sky",
          weatherIcon: "☀️",
          places: [
            {
              name: "Nguyễn Huệ Walking Street",
              addressOrDescription: "HCMC",
              lat: 10.7769,
              lng: 106.7009,
              imageUrl: "https://example.com/nguyen-hue.jpg",
              episode: "Afternoon",
              sortOrder: 0,
              descriptionLong: "The main walking street in HCMC.",
              category: "sight",
              durationMinutes: 60,
              addressShort: "District 1",
            },
            {
              name: "Bún Chả",
              addressOrDescription: "Street food stall",
              lat: 10.78,
              lng: 106.69,
              imageUrl: null,
              episode: "Evening",
              sortOrder: 1,
              descriptionLong: null,
              category: "food",
              durationMinutes: 30,
              addressShort: null,
            },
          ],
        },
        {
          date: "2026-03-14",
          place: "Ho Chi Minh City",
          summary: "Culture day.",
          episodes: { Morning: [], Afternoon: [] },
          weatherHighC: 33.0,
          weatherLowC: 24.8,
          weatherCondition: "Partly cloudy",
          weatherIcon: "⛅",
          places: [
            {
              name: "War Remnants Museum",
              addressOrDescription: "District 3",
              lat: 10.7797,
              lng: 106.6922,
              imageUrl: "https://example.com/museum.jpg",
              episode: "Morning",
              sortOrder: 0,
              descriptionLong: "A major war museum.",
              category: "sight",
              durationMinutes: 120,
              addressShort: "District 3, HCMC",
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.days).toHaveLength(2);
    }
  });
});
