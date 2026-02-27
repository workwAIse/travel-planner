import type { SavedPlaceSource } from "./saved-places";

export type ExtractImportTextResult = {
  text: string;
  warnings: string[];
};

const GOOGLE_MAPS_URL_REGEX = /https?:\/\/(?:www\.)?(?:google\.[^\s/"']+\/maps|maps\.app\.goo\.gl)[^\s"'<)]+/gi;
const INSTAGRAM_URL_REGEX = /https?:\/\/(?:www\.)?instagram\.com\/[^\s"'<)]+/gi;

export function extractImportTextFromFetchedContent(input: {
  source: SavedPlaceSource;
  contentType: string | null;
  body: string;
  url: string;
}): ExtractImportTextResult {
  const contentType = (input.contentType ?? "").toLowerCase();
  const body = input.body.trim();

  if (!body) {
    return {
      text: "",
      warnings: ["Fetched URL returned empty content."],
    };
  }

  if (contentType.includes("application/json") || looksLikeJson(body)) {
    return { text: body, warnings: [] };
  }

  if (contentType.includes("text/plain") || contentType.includes("text/csv")) {
    return { text: body, warnings: [] };
  }

  const htmlResult = extractFromHtml({
    html: body,
    source: input.source,
    fallbackUrl: input.url,
  });

  if (htmlResult.text) {
    return htmlResult;
  }

  return {
    text: `${input.url}\n${truncate(stripHtml(body), 12000)}`.trim(),
    warnings: [
      "Could not extract rich place data from the page, imported fallback text instead.",
    ],
  };
}

function extractFromHtml(input: {
  html: string;
  source: SavedPlaceSource;
  fallbackUrl: string;
}): ExtractImportTextResult {
  const lines: string[] = [];
  const warnings: string[] = [];
  const html = input.html;

  const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const ogTitle = firstMatch(
    html,
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i
  );
  const ogDescription = firstMatch(
    html,
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i
  );

  pushIfUseful(lines, decodeHtmlEntities(title));
  pushIfUseful(lines, decodeHtmlEntities(ogTitle));
  pushIfUseful(lines, decodeHtmlEntities(ogDescription));

  const links = extractRelevantLinks(html, input.source);
  if (links.length > 0) {
    lines.push(...links);
  } else {
    warnings.push(
      "No share links found in page HTML. If this page requires login, use clipboard or data export for best results."
    );
  }

  const jsonLdNames = extractJsonLdNames(html);
  for (const name of jsonLdNames) {
    pushIfUseful(lines, name);
  }

  const text = dedupeLines(lines).slice(0, 120).join("\n").trim();
  if (!text) {
    return { text: "", warnings };
  }

  return { text, warnings };
}

function extractRelevantLinks(html: string, source: SavedPlaceSource): string[] {
  const matches = [...html.matchAll(/href=["']([^"']+)["']/gi)]
    .map((m) => decodeHtmlEntities(m[1]))
    .filter(Boolean);

  const expanded = matches.map((link) => {
    if (link.startsWith("//")) return `https:${link}`;
    if (link.startsWith("/")) return "";
    return link;
  }).filter(Boolean);

  const sourceRegex = source === "google_maps"
    ? /https?:\/\/(?:www\.)?(?:google\.[^\s/"']+\/maps|maps\.app\.goo\.gl)[^\s"'<)]+/i
    : /https?:\/\/(?:www\.)?instagram\.com\/[^\s"'<)]+/i;
  const fromHref = expanded.filter((link) => sourceRegex.test(link));

  const directMatches = source === "google_maps"
    ? [...html.matchAll(GOOGLE_MAPS_URL_REGEX)].map((m) => m[0])
    : [...html.matchAll(INSTAGRAM_URL_REGEX)].map((m) => m[0]);

  return dedupeLines([...fromHref, ...directMatches]);
}

function extractJsonLdNames(html: string): string[] {
  const blocks = [...html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )].map((m) => m[1]);

  const names: string[] = [];
  for (const block of blocks) {
    const parsed = parseMaybeJson(block);
    if (!parsed) continue;
    walkJson(parsed, (obj) => {
      const maybeName = obj.name;
      if (typeof maybeName === "string") pushIfUseful(names, maybeName);
    });
  }

  return names;
}

function looksLikeJson(value: string): boolean {
  return value.startsWith("{") || value.startsWith("[");
}

function parseMaybeJson(value: string): unknown | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function walkJson(value: unknown, onObject: (obj: Record<string, unknown>) => void, depth = 0): void {
  if (depth > 8) return;
  if (Array.isArray(value)) {
    for (const item of value) walkJson(item, onObject, depth + 1);
    return;
  }
  if (!value || typeof value !== "object") return;
  const obj = value as Record<string, unknown>;
  onObject(obj);
  for (const nested of Object.values(obj)) {
    walkJson(nested, onObject, depth + 1);
  }
}

function pushIfUseful(target: string[], value: string | null): void {
  if (!value) return;
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned.length < 2 || cleaned.length > 240) return;
  target.push(cleaned);
}

function dedupeLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const line of lines) {
    const key = line.toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(line.trim());
  }
  return output;
}

function firstMatch(input: string, regex: RegExp): string | null {
  const match = input.match(regex);
  if (!match?.[1]) return null;
  return match[1];
}

function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

function decodeHtmlEntities(input: string | null): string | null {
  if (!input) return null;
  return input
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/g, "/");
}
