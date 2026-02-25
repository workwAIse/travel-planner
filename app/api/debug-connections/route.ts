import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  const results: Record<string, { ok: boolean; error?: string; detail?: string }> = {};

  // 1) OpenAI
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      results.openai = { ok: false, error: "OPENAI_API_KEY not set" };
    } else {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "Say OK" }],
          max_tokens: 5,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        results.openai = { ok: false, error: `HTTP ${res.status}`, detail: t.slice(0, 200) };
      } else {
        results.openai = { ok: true };
      }
    }
  } catch (err) {
    results.openai = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      detail: err instanceof Error && err.cause != null ? String(err.cause) : undefined,
    };
  }

  // 2) Nominatim
  try {
    const res = await fetch(
      "https://nominatim.openstreetmap.org/search?q=Ho+Chi+Minh+City&format=json&limit=1",
      { headers: { "User-Agent": "TravelPlannerDebug/1.0" } }
    );
    if (!res.ok) {
      results.nominatim = { ok: false, error: `HTTP ${res.status}` };
    } else {
      const data = await res.json();
      results.nominatim = { ok: true, detail: Array.isArray(data) && data.length > 0 ? "got result" : "empty" };
    }
  } catch (err) {
    results.nominatim = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      detail: err instanceof Error && err.cause != null ? String(err.cause) : undefined,
    };
  }

  // 3) Supabase (supports legacy and new API keys, see docs/SUPABASE-SETUP.md)
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SECRET_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      results.supabase = { ok: false, error: "Supabase URL or key not set" };
    } else {
      const res = await fetch(`${url}/rest/v1/trips?select=id&limit=1`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        const t = await res.text();
        results.supabase = { ok: false, error: `HTTP ${res.status}`, detail: t.slice(0, 200) };
      } else {
        results.supabase = { ok: true };
      }
    }
  } catch (err) {
    results.supabase = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      detail: err instanceof Error && err.cause != null ? String(err.cause) : undefined,
    };
  }

  return NextResponse.json(results);
}
