import { z } from "zod";

const episodeKeys = ["Morning", "Afternoon", "Evening"] as const;
export type EpisodeKey = (typeof episodeKeys)[number];

export const parsedPlaceSchema = z.object({
  name: z.string(),
  addressOrDescription: z.string(),
  description: z.string().optional(),
  googleMapsUrl: z.union([z.string().url(), z.literal("")]).optional(),
});

export const parsedEpisodesSchema = z.object({
  Morning: z.array(parsedPlaceSchema).optional(),
  Afternoon: z.array(parsedPlaceSchema).optional(),
  Evening: z.array(parsedPlaceSchema).optional(),
});

export const parsedDaySchema = z.object({
  date: z.string(), // YYYY-MM-DD
  place: z.string(),
  theme: z.string().optional(),
  summary: z.string(),
  episodes: parsedEpisodesSchema,
});

export const parsedItinerarySchema = z.object({
  days: z.array(parsedDaySchema),
});

export type ParsedPlace = z.infer<typeof parsedPlaceSchema>;
export type ParsedEpisodes = z.infer<typeof parsedEpisodesSchema>;
export type ParsedDay = z.infer<typeof parsedDaySchema>;
export type ParsedItinerary = z.infer<typeof parsedItinerarySchema>;

// Enriched place (after geocode + photo) - still in-memory before save
export const enrichedPlaceSchema = parsedPlaceSchema.extend({
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  imageUrl: z.string().nullable(),
  episode: z.enum(episodeKeys),
  sortOrder: z.number(),
});
export type EnrichedPlace = z.infer<typeof enrichedPlaceSchema>;

export const enrichedDaySchema = parsedDaySchema.extend({
  places: z.array(enrichedPlaceSchema),
});
export type EnrichedDay = z.infer<typeof enrichedDaySchema>;

export const enrichedItinerarySchema = z.object({
  days: z.array(enrichedDaySchema),
});
export type EnrichedItinerary = z.infer<typeof enrichedItinerarySchema>;
