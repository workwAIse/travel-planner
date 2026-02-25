import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

const PLACEHOLDER_URL = "your-project.supabase.co";

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and a Supabase key in .env.local");
    if (url.includes(PLACEHOLDER_URL)) {
      throw new Error(
        "Replace your-project in NEXT_PUBLIC_SUPABASE_URL with your real Supabase project ref (from Dashboard → Project Settings → URL)."
      );
    }
    client = createClient(url, key);
  }
  return client;
}
