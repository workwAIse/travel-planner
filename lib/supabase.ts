import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

const PLACEHOLDER_URL = "your-project.supabase.co";

/**
 * Resolve Supabase API key: supports both legacy (JWT) and new key names.
 * New keys: SUPABASE_SECRET_KEY (sb_secret_...) or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (sb_publishable_...).
 * Legacy: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * @see https://github.com/orgs/supabase/discussions/29260
 */
function getSupabaseKey(): string | undefined {
  return (
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = getSupabaseKey();
    if (!url || !key) {
      throw new Error(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and one of: SUPABASE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local. See docs/SUPABASE-SETUP.md."
      );
    }
    if (url.includes(PLACEHOLDER_URL)) {
      throw new Error(
        "Replace your-project in NEXT_PUBLIC_SUPABASE_URL with your real Supabase project ref. See docs/SUPABASE-SETUP.md."
      );
    }
    client = createClient(url, key);
  }
  return client;
}
