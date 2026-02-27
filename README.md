# Travel Planner

An interactive, Airbnb-grade travel planner that turns raw itinerary text into a rich, explorable trip experience with maps, weather, drag-and-drop reordering, calendar view, and timeline view.

## Features

- **Smart parsing** -- Paste raw itinerary text and AI extracts structured days, places, and episodes
- **Saved places import** -- Paste Google Maps lists or Instagram saved-folder exports and auto-load them into trip stop suggestions (with automatic metadata fallback if the new table is not migrated yet)
- **Auto-enrichment** -- Geocoding, Wikipedia images, weather forecasts, AI-generated place descriptions
- **Daily view** -- Day-by-day itinerary with place cards, episode sections, and interactive Leaflet map
- **Calendar view** -- Month-grid overview with city color coding, weather icons, and stop counts
- **Timeline view** -- Scroll-animated vertical timeline with city transitions and place previews
- **Drag-and-drop** -- Reorder stops within a day, persisted to the database
- **Trip intelligence** -- Extend trips by adding days, AI recommendations for alternatives
- **Responsive** -- Mobile-first design with warm Airbnb-inspired palette

## Stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui** (warm palette, 1rem radius, soft shadows)
- **Supabase** (PostgreSQL) for persistence
- **OpenAI** (GPT-4o-mini) for parsing, place descriptions, and recommendations
- **Leaflet** / **react-leaflet** for interactive maps (OpenStreetMap tiles)
- **@dnd-kit** for drag-and-drop reordering
- **framer-motion** for animations
- **Open-Meteo** for weather data (free, no API key)
- **Nominatim** for geocoding (free, no API key)
- **Wikipedia API** for place images (free, no API key)

## Environment variables

Copy `.env.local.example` to `.env.local` and set:

| Variable | Description |
|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (Dashboard → Project Settings → General) |
| Supabase key (one of) | `SUPABASE_SECRET_KEY` (new), `SUPABASE_SERVICE_ROLE_KEY` (legacy), or the publishable/anon key for frontend-only use |
| `OPENAI_API_KEY` | OpenAI API key for parsing and enrichment |

**Where to find Supabase URL and keys:** See **[docs/SUPABASE-SETUP.md](docs/SUPABASE-SETUP.md)** for step-by-step Dashboard navigation and the [new vs legacy API key system](https://github.com/orgs/supabase/discussions/29260).

## Database setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run both migration files in order:
   - `supabase/migrations/20260222000000_create_trips_days_places.sql` (base schema)
   - `supabase/migrations/20260225000000_add_weather_descriptions.sql` (weather, descriptions, categories)
   - `supabase/migrations/20260227000000_add_trip_saved_places.sql` (Google Maps / Instagram saved-place imports)

Or use the Supabase CLI:

```bash
supabase link
supabase db push
```

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Paste an itinerary, name your trip, and click **Create trip**.

## Routes

- **`/`** -- Home: hero section + itinerary input form
- **`/trips`** -- Grid of saved trips with cover images
- **`/trips/[id]`** -- Trip detail with three views:
  - **Daily** -- Day selector, place cards with drag-and-drop, interactive map
  - **Import saved places** -- Trip-level dialog for Google Maps/Instagram saves that feed into **Add a stop**
  - **Calendar** -- Month grid with city colors, weather, stop counts
  - **Timeline** -- Vertical scroll timeline with city transitions

## Testing

**Unit tests**

```bash
npm test
```

Unit tests cover schema validation, weather utilities, action input validation, and saved-place import parsing.

**E2E tests (Playwright)**

For the full flow (create trip from itinerary), the app needs your `.env.local` (OpenAI + Supabase). Run the dev server first, then the E2E tests so they use it:

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:e2e
```

- Smoke tests: home and trips list load.
- Trip detail tests: hero, breadcrumb, Daily/Calendar/Timeline views, Extend trip dialog (require at least one existing trip).
- Full flow: submits the Vietnam itinerary fixture, waits for redirect to trip detail (requires OpenAI + Supabase; **skipped in CI**).

**CI / pre-deploy:** Run unit tests and E2E (full-flow is skipped when `CI=true`):

```bash
npm run test:ci
```

In CI, set `CI=true` so Playwright starts its own server and the long full-flow test is skipped.

## Deploy (e.g. Vercel)

1. Connect the repo to [Vercel](https://vercel.com); the build command is `npm run build`.
2. Add **Environment Variables** in the project settings (same as `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`)
   - `OPENAI_API_KEY`
3. Run migrations on your Supabase project (see Database setup above).
4. Optional: in Vercel, add a build step that runs `npm run test` (unit tests) before deploy; for E2E, run `npm run test:ci` in a separate CI job with the same env vars if you want the full-flow test.

## Project structure

```
app/
  page.tsx                  Home (hero + form)
  layout.tsx                Root layout (header, fonts, footer)
  actions.ts                Server actions (enrich, reorder, extend)
  trips/
    page.tsx                Trips grid
    [id]/
      page.tsx              Trip detail (server component)
      trip-detail-client.tsx View switcher + daily/calendar/timeline

components/
  layout/
    header.tsx              Sticky nav header
    breadcrumb.tsx          Breadcrumb navigation
  trip/
    import-saved-places-dialog.tsx Import Google Maps / Instagram saves into trip suggestions
    daily-view.tsx          Day-by-day itinerary with drag-and-drop
    day-map.tsx             Leaflet map (dynamic import, SSR-safe)
    day-selector.tsx        Horizontal day strip
    place-card.tsx          Place listing card
    sortable-place-card.tsx @dnd-kit sortable wrapper
    calendar-view.tsx       Month grid calendar
    timeline-view.tsx       Vertical timeline with animations
    trip-hero.tsx           Cover image + stats banner
    trip-stats.tsx          Trip overview sidebar
    weather-widget.tsx      Compact weather display
    view-switcher.tsx       Daily/Calendar/Timeline tabs
    extend-trip-dialog.tsx  Add-a-day dialog
    skeletons.tsx           Loading skeleton components

lib/
  schema.ts                Zod schemas + TypeScript types
  db-types.ts              Database type definitions
  supabase.ts              Supabase client
  parse-itinerary.ts       OpenAI itinerary parser
  enrich-places.ts         Geocoding + images + descriptions + weather
  save-trip.ts             Database persistence
  get-trips.ts             Database queries
  weather.ts               Open-Meteo API client
  weather-utils.ts         WMO code decoder
  place-details.ts         AI place description generator
  recommendations.ts       AI stop recommendations
  saved-places.ts          Saved-place parsing, dedupe, and recommendation scoring
  saved-places-fallback.ts Raw-input metadata fallback storage for saved places
  smart-parse-saved-places.ts AI-assisted extraction fallback for external saves
```

## Troubleshooting

- **"ENOTFOUND" or fetch errors** -- Check `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`. Use your real project URL (Dashboard → Project Settings → General). See [docs/SUPABASE-SETUP.md](docs/SUPABASE-SETUP.md).
- **Invalid API key / 401** -- Use a **secret** or **service_role** key for server-side access. New keys: Dashboard → Project Settings → API; use the secret key (`sb_secret_...`) or legacy service_role key.
- **Debug connections** -- Visit `/api/debug-connections` to verify OpenAI, Nominatim, and Supabase connectivity.

## UX Design

See [docs/UX-PLAN-AIRBNB-LIKE.md](docs/UX-PLAN-AIRBNB-LIKE.md) for the design audit and recommendations that informed this implementation.
