import { describe, expect, it } from "vitest";
import {
  buildImportedRecommendations,
  mergeSavedPlaceCandidates,
  parseSavedPlacesInput,
  type SavedPlaceSuggestionRow,
} from "./saved-places";

describe("parseSavedPlacesInput", () => {
  it("parses Google Maps-style lines and URLs", () => {
    const input = [
      "Louvre Museum - Paris",
      "https://www.google.com/maps/place/Buvette/@48.8566,2.3522,15z",
      "Angelina Paris | Paris",
    ].join("\n");

    const result = parseSavedPlacesInput(input, "google_maps");
    const names = result.items.map((item) => item.placeName);

    expect(names).toContain("Louvre Museum");
    expect(names).toContain("Buvette");
    expect(names).toContain("Angelina Paris");
  });

  it("parses nested JSON payloads from Instagram exports", () => {
    const input = JSON.stringify({
      folders: [
        {
          name: "Paris ideas",
          items: [
            {
              title: "Du Pain et des Idees",
              city: "Paris",
              url: "https://www.google.com/maps/place/Du+Pain+et+des+Idees",
            },
            {
              caption: "Sunset at Griffith Observatory",
            },
          ],
        },
      ],
    });

    const result = parseSavedPlacesInput(input, "instagram");
    const names = result.items.map((item) => item.placeName);

    expect(names).toContain("Du Pain et des Idees");
    expect(names).toContain("Sunset");
  });
});

describe("mergeSavedPlaceCandidates", () => {
  it("deduplicates and keeps richer fields", () => {
    const merged = mergeSavedPlaceCandidates([
      {
        placeName: "Louvre Museum",
        cityHint: null,
        categoryHint: "sight",
        googleMapsUrl: null,
        notes: null,
        source: "google_maps",
      },
      {
        placeName: "Louvre Museum",
        cityHint: "Paris",
        categoryHint: "activity",
        googleMapsUrl: "https://www.google.com/maps/place/Louvre+Museum",
        notes: "Book a timed entry.",
        source: "instagram",
      },
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].cityHint).toBe("Paris");
    expect(merged[0].googleMapsUrl).toContain("Louvre+Museum");
    expect(merged[0].notes).toBe("Book a timed entry.");
  });
});

describe("buildImportedRecommendations", () => {
  it("filters current stops, ranks by city, and dedupes names", () => {
    const rows: SavedPlaceSuggestionRow[] = [
      {
        place_name: "Louvre Museum",
        city_hint: "Paris",
        category_hint: "sight",
        source: "google_maps",
        collection_name: "Paris musts",
      },
      {
        place_name: "Buvette",
        city_hint: "Paris",
        category_hint: "food",
        source: "instagram",
        collection_name: "Date night",
      },
      {
        place_name: "Louvre Museum",
        city_hint: "Paris",
        category_hint: "activity",
        source: "instagram",
        collection_name: "Culture",
      },
      {
        place_name: "NYC Pizza",
        city_hint: "New York",
        category_hint: "food",
        source: "google_maps",
        collection_name: null,
      },
    ];

    const recommendations = buildImportedRecommendations(rows, {
      currentStops: ["Buvette"],
      city: "Paris",
      episode: "Afternoon",
      limit: 5,
    });

    expect(recommendations.map((rec) => rec.name)).toEqual(["Louvre Museum", "NYC Pizza"]);
    expect(recommendations[0].reason).toMatch(/Paris/);
    expect(recommendations[0].sourceLabel).toBe("Google Maps");
    expect(recommendations[0].sourceCollection).toBe("Paris musts");
  });
});
