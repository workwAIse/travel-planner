-- Travel stops (flight/car/train): optional time and booking link
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS time_info text;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS booking_url text;
