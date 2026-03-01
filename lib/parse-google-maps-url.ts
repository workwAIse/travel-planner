const SHORT_LINK_HOSTS = new Set([
  "share.google",
  "goo.gl",
  "maps.app.goo.gl",
]);

const RESOLVE_TIMEOUT_MS = 8000;

/**
 * True if the URL is a known Google short/share link that may redirect to a Maps URL with coordinates.
 */
export function isShortLink(url: string): boolean {
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    return SHORT_LINK_HOSTS.has(host);
  } catch {
    return false;
  }
}

const FETCH_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

export type ResolvedShortLink = { finalUrl: string; html: string };

/**
 * Follow redirects for allowlisted short links; return final URL and response body.
 * Use the body when the final URL is a search page so we don't need a second fetch.
 */
export async function resolveShortLink(url: string): Promise<string>;
export async function resolveShortLink(
  url: string,
  options: { includeBody: true }
): Promise<ResolvedShortLink>;
export async function resolveShortLink(
  url: string,
  options?: { includeBody?: boolean }
): Promise<string | ResolvedShortLink> {
  const trimmed = url.trim();
  if (!isShortLink(trimmed)) {
    return options?.includeBody ? { finalUrl: trimmed, html: "" } : trimmed;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RESOLVE_TIMEOUT_MS);
  try {
    const res = await fetch(trimmed, {
      redirect: "follow",
      signal: controller.signal,
      headers: FETCH_HEADERS,
    });
    clearTimeout(timeout);
    const finalUrl = res.url ?? trimmed;
    if (options?.includeBody) {
      const html = res.ok ? await res.text() : "";
      return { finalUrl, html };
    }
    return finalUrl;
  } catch {
    clearTimeout(timeout);
    return options?.includeBody ? { finalUrl: trimmed, html: "" } : trimmed;
  }
}

function isGoogleSearchPage(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return (
      (host === "www.google.com" || host === "google.com") &&
      (u.pathname === "/search" || u.pathname.startsWith("/search/"))
    );
  } catch {
    return false;
  }
}

/** Extract coordinates from @lat,lng anywhere in text (e.g. in scripts or data). */
function extractAtCoordsFromText(text: string): { lat: number; lng: number } | null {
  const match = text.match(/@(-?\d{1,3}\.?\d*),(-?\d{1,3}\.?\d*)/);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  return isValidLatLng(lat, lng) ? { lat, lng } : null;
}

/** Extract URLs that look like Google Maps links from HTML (and raw coords from @lat,lng). */
function extractMapsLinksFromHtml(html: string, baseUrl: string): string[] {
  const out: string[] = [];
  // Absolute Maps URLs - allow more chars so we capture full URL (stop at " ' < > \ or newline)
  const absoluteRe =
    /https:\/\/www\.google\.com\/maps\/[^\s"'<>\\]+|https:\/\/maps\.google\.com\/[^\s"'<>\\]+/gi;
  let m: RegExpExecArray | null;
  while ((m = absoluteRe.exec(html)) !== null) {
    const raw = m[0].replace(/&amp;/g, "&").replace(/\\u0026/g, "&");
    if (!out.includes(raw)) out.push(raw);
  }
  // Relative /maps/... links
  const relativeRe = /(?:href=|"|')(\/maps\/[^\s"'<>\\]+)/gi;
  try {
    const base = new URL(baseUrl);
    while ((m = relativeRe.exec(html)) !== null) {
      const path = m[1].replace(/&amp;/g, "&");
      const full = new URL(path, base.origin).href;
      if (!out.includes(full)) out.push(full);
    }
  } catch {
    // ignore
  }
  // URLs inside JSON or escaped (e.g. \u0026 for &)
  const anyMapsRe = /https?:\\?\/\\?\/[^"']*google\.com\\?\/maps\\?\/[^\s"'<>\\]+/gi;
  while ((m = anyMapsRe.exec(html)) !== null) {
    const raw = m[0].replace(/\\\//g, "/").replace(/\\u0026/g, "&").replace(/&amp;/g, "&");
    if (raw.startsWith("http") && !out.includes(raw)) out.push(raw);
  }
  return out.slice(0, 20);
}

/**
 * Extract coords from search page HTML: first try Maps links, then any @lat,lng in the page.
 */
function tryExtractCoordsFromSearchHtml(html: string, searchPageUrl: string): {
  lat: number;
  lng: number;
} | null {
  const links = extractMapsLinksFromHtml(html, searchPageUrl);
  for (const link of links) {
    const coords = parseGoogleMapsUrl(link);
    if (coords) return coords;
  }
  return extractAtCoordsFromText(html);
}

/**
 * Parse a Google Maps URL and return latitude and longitude if present.
 * Supports common share/search formats so we can use exact coordinates
 * instead of geocoding, fixing wrong map pin placement.
 */
export function parseGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    // 1) query=lat,lng (search URL, comma may be encoded as %2C)
    const searchMatch = trimmed.match(/[?&]query=([^&]+)/i);
    if (searchMatch) {
      const query = decodeURIComponent(searchMatch[1]).replace(/%2C/g, ",");
      const parts = query.split(",").map((s) => s.trim());
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (isValidLatLng(lat, lng)) return { lat, lng };
      }
    }

    // 2) Directions URL: destination in data=...!2m2!1d{lng}!2d{lat} (check before @ so we use destination, not map center)
    const dirMatch = trimmed.match(/!2m2!1d(-?\d+\.?\d*)!2d(-?\d+\.?\d*)/);
    if (dirMatch) {
      const lng = parseFloat(dirMatch[1]);
      const lat = parseFloat(dirMatch[2]);
      if (isValidLatLng(lat, lng)) return { lat, lng };
    }

    // 3) @lat,lng or @lat,lng,zoom (place / share URLs)
    const atMatch = trimmed.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[2]);
      if (isValidLatLng(lat, lng)) return { lat, lng };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parse a Google Maps URL, or resolve short links (e.g. share.google, goo.gl) first and then parse.
 * Use this when the URL might be a redirect that lands on a Maps URL with coordinates.
 */
export async function parseGoogleMapsUrlAsync(
  url: string
): Promise<{ lat: number; lng: number } | null> {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  let coords = parseGoogleMapsUrl(trimmed);
  if (coords) return coords;
  if (!isShortLink(trimmed)) return null;
  try {
    const { finalUrl, html } = await resolveShortLink(trimmed, { includeBody: true });
    let coords = parseGoogleMapsUrl(finalUrl);
    if (coords) return coords;
    if (isGoogleSearchPage(finalUrl) && html) {
      coords = tryExtractCoordsFromSearchHtml(html, finalUrl);
    }
    return coords ?? null;
  } catch {
    return null;
  }
}

function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
