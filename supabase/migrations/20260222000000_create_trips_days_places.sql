-- Trips: top-level trip (e.g. "Vietnam March 2026")
-- Optional user_id for future multi-user auth
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  raw_input text,
  created_at timestamptz not null default now(),
  user_id uuid
);

-- Days: one per date per trip
create table if not exists public.days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  date date not null,
  place text not null,
  theme text,
  summary text,
  episode_order jsonb default '["Morning","Afternoon","Evening"]'::jsonb,
  created_at timestamptz not null default now(),
  unique(trip_id, date)
);

create index if not exists idx_days_trip_id on public.days(trip_id);

-- Places: one per venue/stop per day
create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.days(id) on delete cascade,
  name text not null,
  episode text not null check (episode in ('Morning', 'Afternoon', 'Evening')),
  details text,
  google_maps_url text,
  lat double precision,
  lng double precision,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_places_day_id on public.places(day_id);
create index if not exists idx_places_day_episode on public.places(day_id, episode);

-- RLS: allow all for now (no auth). Use service role from app.
alter table public.trips enable row level security;
alter table public.days enable row level security;
alter table public.places enable row level security;

create policy "Allow all on trips" on public.trips for all using (true) with check (true);
create policy "Allow all on days" on public.days for all using (true) with check (true);
create policy "Allow all on places" on public.places for all using (true) with check (true);
