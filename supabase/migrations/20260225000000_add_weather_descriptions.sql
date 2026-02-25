-- Add weather columns to days
ALTER TABLE public.days ADD COLUMN IF NOT EXISTS weather_high_c double precision;
ALTER TABLE public.days ADD COLUMN IF NOT EXISTS weather_low_c double precision;
ALTER TABLE public.days ADD COLUMN IF NOT EXISTS weather_condition text;
ALTER TABLE public.days ADD COLUMN IF NOT EXISTS weather_icon text;

-- Add richer place data columns
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS description_long text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS category text CHECK (category IN ('sight', 'food', 'nightlife', 'transport', 'accommodation', 'activity'));
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS duration_minutes int;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS address_short text;

-- Add trip-level date range and cover image
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS cover_image_url text;
