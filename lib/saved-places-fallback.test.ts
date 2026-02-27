import { describe, expect, it } from "vitest";
import {
  parseTripRawInputSavedPlaces,
  serializeTripRawInputSavedPlaces,
} from "./saved-places-fallback";

describe("saved places raw_input fallback", () => {
  it("serializes and parses embedded saved places metadata", () => {
    const rawInput = "Day 1: Tokyo";
    const serialized = serializeTripRawInputSavedPlaces(rawInput, [
      {
        source: "google_maps",
        place_name: "teamLab Planets",
        city_hint: "Tokyo",
        category_hint: "activity",
        collection_name: "Tokyo shortlist",
        google_maps_url: "https://www.google.com/maps/place/teamLab+Planets",
        notes: null,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ]);

    const parsed = parseTripRawInputSavedPlaces(serialized);
    expect(parsed.baseRawInput).toBe(rawInput);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0].place_name).toBe("teamLab Planets");
    expect(parsed.rows[0].source).toBe("google_maps");
  });

  it("returns original raw input when no marker is present", () => {
    const parsed = parseTripRawInputSavedPlaces("Simple itinerary text");
    expect(parsed.baseRawInput).toBe("Simple itinerary text");
    expect(parsed.rows).toHaveLength(0);
  });
});
