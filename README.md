# Itinerary Enricher

Paste raw travel itinerary text and get structured, enriched data: dates, day episodes (Morning/Afternoon/Evening), summaries, per-place details, Google Maps links (from your paste), coordinates (lat/lng), and one image per place. Data is saved to Supabase for later use in a travel trip UI (e.g. map and walking route).

## Stack

- **Next.js** (App Router), **Vercel**, **Supabase** (DB), **shadcn/ui**, **Tailwind**
- **OpenAI** for parsing raw text into structured JSON
- **OpenStreetMap Nominatim** for geocoding (free, no API key)
- **Wikipedia API** for place images (free, no API key)

## Environment variables

Copy `.env.local.example` to `.env.local` and set:

| Variable | Description |
|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase key (either works with current RLS) |
| `OPENAI_API_KEY` | OpenAI API key for itinerary parsing |

Geocoding and place images use **Nominatim** (OpenStreetMap) and **Wikipedia**; no API keys are required. Nominatim allows 1 request per second, so enrichment may take a bit longer for many places.

## Database setup

Run the Supabase migration so the app has `trips`, `days`, and `places` tables:

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the contents of `supabase/migrations/20260222000000_create_trips_days_places.sql`.

Or use the Supabase CLI from the project root:

```bash
supabase link
supabase db push
```

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Paste an itinerary, enter a trip name, and click **Enrich and save**.

## Troubleshooting

- **"TypeError: fetch failed" or "ENOTFOUND"** – Usually means `NEXT_PUBLIC_SUPABASE_URL` is wrong or still the placeholder. Set it to your real project URL from [Supabase Dashboard](https://supabase.com/dashboard) → your project → Settings → API (e.g. `https://abcdefghij.supabase.co`). Restart the dev server after changing `.env.local`.
- **Check all connections** – Open [http://localhost:3000/api/debug-connections](http://localhost:3000/api/debug-connections) to see whether OpenAI, Nominatim, and Supabase respond. Fix any that report `ok: false`.

## Deploy on Vercel

1. Push the repo to GitHub and import the project in [Vercel](https://vercel.com).
2. Add the same environment variables in the Vercel project (Settings → Environment Variables).
3. Deploy. The app uses serverless functions and needs no extra config.

## Routes

- **`/`** – Paste raw itinerary, trip name, and **Enrich and save** (parse → geocode + photos → save).
- **`/trips`** – List saved trips.
- **`/trips/[id]`** – Trip detail: days, episodes, places with image, link, and coordinates (ready for a future map view).

## UX

- **[UX Plan: Airbnb-like look & feel](docs/UX-PLAN-AIRBNB-LIKE.md)** – Senior UX audit and concrete recommendations for visual identity, home/trips/detail pages, navigation, and copy.
