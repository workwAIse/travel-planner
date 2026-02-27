import { describe, expect, it } from "vitest";
import { extractImportTextFromFetchedContent } from "./import-source";

describe("extractImportTextFromFetchedContent", () => {
  it("passes through JSON payloads", () => {
    const json = JSON.stringify({
      places: [{ name: "Louvre Museum", city: "Paris" }],
    });

    const result = extractImportTextFromFetchedContent({
      source: "google_maps",
      contentType: "application/json",
      body: json,
      url: "https://example.com/export.json",
    });

    expect(result.text).toBe(json);
    expect(result.warnings).toEqual([]);
  });

  it("extracts title and map links from HTML", () => {
    const html = `
      <html>
        <head>
          <title>Tokyo saved list</title>
          <meta property="og:description" content="Neighborhood gems" />
        </head>
        <body>
          <a href="https://www.google.com/maps/place/Golden+Gai">Golden Gai</a>
          <a href="https://maps.app.goo.gl/example">Short maps link</a>
        </body>
      </html>
    `;

    const result = extractImportTextFromFetchedContent({
      source: "google_maps",
      contentType: "text/html",
      body: html,
      url: "https://example.com/list",
    });

    expect(result.text).toMatch(/Tokyo saved list/);
    expect(result.text).toMatch(/Golden\+Gai/);
    expect(result.text).toMatch(/maps\.app\.goo\.gl/);
  });

  it("extracts Instagram location links from HTML", () => {
    const html = `
      <html>
        <head>
          <title>Saved reels</title>
        </head>
        <body>
          <a href="https://www.instagram.com/explore/locations/12345/nezu-museum/">Nezu</a>
          <a href="https://www.instagram.com/p/abc123/">Post</a>
        </body>
      </html>
    `;

    const result = extractImportTextFromFetchedContent({
      source: "instagram",
      contentType: "text/html",
      body: html,
      url: "https://example.com/ig",
    });

    expect(result.text).toMatch(/Saved reels/);
    expect(result.text).toMatch(/instagram\.com\/explore\/locations/);
  });
});
