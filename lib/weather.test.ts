import { describe, it, expect } from "vitest";
import { decodeWmo, WMO_CODES } from "./weather-utils";

describe("decodeWmo", () => {
  it("maps code 0 to Clear sky", () => {
    const result = decodeWmo(0);
    expect(result.condition).toBe("Clear sky");
    expect(result.icon).toBe("☀️");
  });

  it("maps code 2 to Partly cloudy", () => {
    const result = decodeWmo(2);
    expect(result.condition).toBe("Partly cloudy");
    expect(result.icon).toBe("⛅");
  });

  it("maps code 65 to Heavy rain", () => {
    const result = decodeWmo(65);
    expect(result.condition).toBe("Heavy rain");
    expect(result.icon).toBe("🌧️");
  });

  it("maps code 95 to Thunderstorm", () => {
    const result = decodeWmo(95);
    expect(result.condition).toBe("Thunderstorm");
    expect(result.icon).toBe("⛈️");
  });

  it("returns Unknown for unrecognised code", () => {
    const result = decodeWmo(999);
    expect(result.condition).toBe("Unknown");
    expect(result.icon).toBe("❓");
  });

  it("handles all defined WMO codes", () => {
    for (const [code, expected] of Object.entries(WMO_CODES)) {
      const result = decodeWmo(Number(code));
      expect(result).toEqual(expected);
    }
  });
});
