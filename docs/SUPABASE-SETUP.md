# Supabase setup for Travel Planner

Where to find the project URL and API keys in the Supabase Dashboard, and how the **new** vs **legacy** key system works.

## Where to find everything in the Dashboard

1. **Open your project** at [supabase.com/dashboard](https://supabase.com/dashboard) and select your project.

2. **Project URL**
   - Go to **Project Settings** (gear icon in the left sidebar).
   - Under **General**, find **Project URL** (e.g. `https://abcdefghijk.supabase.co`).
   - Use this as `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`.

3. **API keys**
   - In the same left sidebar, go to **Project Settings** → **API** (or **API Keys** in some layouts).
   - You may see one or both of these sections:

   **Option A — New API keys (recommended from 2025)**

   - **Publishable key** — starts with `sb_publishable_...`. Safe for frontend; use where the app needs low-privilege access.
   - **Secret key** — starts with `sb_secret_...`. Backend only; full access, bypasses RLS. Do not expose in the browser.

   **Option B — Legacy keys**

   - **anon public** — JWT, “Project API key” or “anon key”. Low privilege.
   - **service_role** — JWT, “service_role key”. Full access; backend only.

   If you don’t see “Publishable” or “Secret”, use the legacy **anon** and **service_role** keys. Supabase is rolling out the new keys; both systems work with this app. See [Upcoming changes to Supabase API Keys](https://github.com/orgs/supabase/discussions/29260).

4. **Running the migrations**
   - **SQL Editor**: Project → **SQL Editor** → New query. Paste and run each migration file in order:
     - `supabase/migrations/20260222000000_create_trips_days_places.sql`
     - `supabase/migrations/20260225000000_add_weather_descriptions.sql`
   - **CLI**: From the project root run `supabase link` (once), then `supabase db push`.

## What to put in `.env.local`

Create a file `.env.local` in the project root with:

```bash
# Required: your project URL (Project Settings → General → Project URL)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co

# Required: one of the following (Project Settings → API)
# New keys (preferred if available):
SUPABASE_SECRET_KEY=sb_secret_...
# OR for frontend-only usage (e.g. no server actions): NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Legacy keys (if you don’t have the new ones yet):
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
# OR NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Required for parsing and enriching itineraries
OPENAI_API_KEY=sk-...
```

This app uses the **server** (secret/service_role) key for all Supabase access so that RLS does not block writes. Prefer:

- `SUPABASE_SECRET_KEY` (new) or `SUPABASE_SERVICE_ROLE_KEY` (legacy)

so the key is not exposed to the browser. The app also accepts the publishable/anon key if that’s all you have (e.g. for quick local testing).

## New vs legacy keys (summary)

| Purpose        | New key (2025+)     | Legacy key        |
|----------------|---------------------|-------------------|
| Backend/full   | `SUPABASE_SECRET_KEY` (`sb_secret_...`) | `SUPABASE_SERVICE_ROLE_KEY` |
| Frontend/low   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...`) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

The client library works with both; you only need to set the env vars. For details and timeline, see the [Supabase API keys discussion](https://github.com/orgs/supabase/discussions/29260).

## Verify

After saving `.env.local`, **restart the dev server** (`npm run dev`) so Next.js reloads env, then open:

**http://localhost:3000/api/debug-connections**

You should see:

- `"openai": { "ok": true }` — OPENAI_API_KEY is set and valid.
- `"supabase": { "ok": true }` — NEXT_PUBLIC_SUPABASE_URL and your chosen key work.

If Supabase shows `ok: false` or you get "Invalid Supabase API key" when creating a trip:

- Do **not** set `SUPABASE_SECRET_KEY` to the literal placeholder `sb_secret_...`; use your real Secret key from Dashboard → Project Settings → API, or leave it unset and use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy anon key) if your RLS allows it.
