import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/parse-itinerary", () => ({
  parseItinerary: vi.fn(),
}));
vi.mock("@/lib/enrich-places", () => ({
  enrichItinerary: vi.fn(),
}));
vi.mock("@/lib/save-trip", () => ({
  saveTrip: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({
  getSupabase: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { enrichAndSaveTrip } from "@/app/actions";

describe("enrichAndSaveTrip input validation", () => {
  it("returns error for empty rawText", async () => {
    const result = await enrichAndSaveTrip("", "My Trip");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/paste some itinerary/i);
    }
  });

  it("returns error for whitespace-only rawText", async () => {
    const result = await enrichAndSaveTrip("   \n  ", "My Trip");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/paste some itinerary/i);
    }
  });

  it("returns error for empty tripName", async () => {
    const result = await enrichAndSaveTrip("Day 1: Visit the museum", "");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/enter a trip name/i);
    }
  });

  it("returns error for whitespace-only tripName", async () => {
    const result = await enrichAndSaveTrip("Day 1: Visit the museum", "   ");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/enter a trip name/i);
    }
  });
});
