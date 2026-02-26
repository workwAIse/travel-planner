-- Add user_notes column to places for personal notes
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS user_notes text;
