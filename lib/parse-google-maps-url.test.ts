import { describe, it, expect, vi, afterEach } from "vitest";
import {
  parseGoogleMapsUrl,
  isShortLink,
  parseGoogleMapsUrlAsync,
} from "./parse-google-maps-url";

describe("parseGoogleMapsUrl", () => {
  it("returns null for empty or invalid input", () => {
    expect(parseGoogleMapsUrl("")).toBeNull();
    expect(parseGoogleMapsUrl("   ")).toBeNull();
    expect(parseGoogleMapsUrl("https://example.com")).toBeNull();
    expect(parseGoogleMapsUrl("not a url")).toBeNull();
  });

  it("parses search URL with query=lat,lng", () => {
    const url = "https://www.google.com/maps/search/?api=1&query=10.7769,106.7009";
    expect(parseGoogleMapsUrl(url)).toEqual({ lat: 10.7769, lng: 106.7009 });
  });

  it("parses search URL with encoded comma in query", () => {
    const url = "https://www.google.com/maps/search/?api=1&query=10.7769%2C106.7009";
    expect(parseGoogleMapsUrl(url)).toEqual({ lat: 10.7769, lng: 106.7009 });
  });

  it("parses place URL with @lat,lng,zoom", () => {
    const url = "https://www.google.com/maps/@10.7769,106.7009,17z";
    expect(parseGoogleMapsUrl(url)).toEqual({ lat: 10.7769, lng: 106.7009 });
  });

  it("parses place URL with place name and @lat,lng", () => {
    const url =
      "https://www.google.com/maps/place/War+Remnants+Museum/@10.7793,106.6922,17z";
    expect(parseGoogleMapsUrl(url)).toEqual({ lat: 10.7793, lng: 106.6922 });
  });

  it("parses negative coordinates (southern/western hemisphere)", () => {
    const url = "https://www.google.com/maps/search/?api=1&query=-33.8567,151.2152";
    expect(parseGoogleMapsUrl(url)).toEqual({ lat: -33.8567, lng: 151.2152 });
  });

  it("rejects out-of-range latitude", () => {
    expect(parseGoogleMapsUrl("https://www.google.com/maps/@91,0,17z")).toBeNull();
    expect(parseGoogleMapsUrl("https://www.google.com/maps/@-91,0,17z")).toBeNull();
  });

  it("rejects out-of-range longitude", () => {
    expect(parseGoogleMapsUrl("https://www.google.com/maps/@0,181,17z")).toBeNull();
    expect(parseGoogleMapsUrl("https://www.google.com/maps/@0,-181,17z")).toBeNull();
  });

  it("rejects query with non-numeric parts", () => {
    expect(
      parseGoogleMapsUrl("https://www.google.com/maps/search/?query=Ho+Chi+Minh+City")
    ).toBeNull();
  });

  it("parses directions URL with destination in data=!2m2!1d{lng}!2d{lat}", () => {
    const url =
      "https://www.google.com/maps/dir//74+B%C3%A1nh+M%C3%AC,+Cafe/@48.1651148,11.5732717,15z/data=!4m8!4m7!1m0!1m5!1m1!1s0x31752f04d394f1b3:0x664baa4679da8969!2m2!1d106.7038875!2d10.7782431!5m1!1e2?entry=ttu";
    expect(parseGoogleMapsUrl(url)).toEqual({ lat: 10.7782431, lng: 106.7038875 });
  });
});

describe("isShortLink", () => {
  it("returns true for share.google links", () => {
    expect(isShortLink("https://share.google/78DPXWpda1VSeeNGv")).toBe(true);
  });
  it("returns true for goo.gl maps links", () => {
    expect(isShortLink("https://goo.gl/maps/abc123")).toBe(true);
  });
  it("returns false for full Google Maps URLs", () => {
    expect(isShortLink("https://www.google.com/maps/@10.77,106.70,17z")).toBe(false);
  });
  it("returns false for invalid URL", () => {
    expect(isShortLink("not a url")).toBe(false);
  });
});

describe("parseGoogleMapsUrlAsync", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns coords when sync parse succeeds (no fetch)", async () => {
    const url = "https://www.google.com/maps/search/?api=1&query=10.7769,106.7009";
    expect(await parseGoogleMapsUrlAsync(url)).toEqual({ lat: 10.7769, lng: 106.7009 });
  });

  it("resolves short link then parses final URL", async () => {
    const shortUrl = "https://share.google/78DPXWpda1VSeeNGv";
    const resolvedUrl = "https://www.google.com/maps/place/X/@10.7782431,106.7038875,17z";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ url: resolvedUrl })
    );
    const result = await parseGoogleMapsUrlAsync(shortUrl);
    expect(result).toEqual({ lat: 10.7782431, lng: 106.7038875 });
  });

  it("returns null when short link resolves to URL without coords", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        url: "https://www.google.com/search?q=something",
        ok: true,
        text: () => Promise.resolve(""),
      })
    );
    const result = await parseGoogleMapsUrlAsync("https://share.google/abc");
    expect(result).toBeNull();
  });

  it("extracts coords from Maps link when short link redirects to Google Search page", async () => {
    const searchPageUrl = "https://www.google.com/search?q=Free+Walking+Tour";
    const htmlWithMapsLink = `
      <div><a href="https://www.google.com/maps/place/Free+Walking+Tour/@10.7769,106.7009,17z">View on Maps</a></div>
    `;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        url: searchPageUrl,
        ok: true,
        text: () => Promise.resolve(htmlWithMapsLink),
      })
    );
    const result = await parseGoogleMapsUrlAsync("https://share.google/P2G1fRoO6Iqjvyp0l");
    expect(result).toEqual({ lat: 10.7769, lng: 106.7009 });
  });
});
