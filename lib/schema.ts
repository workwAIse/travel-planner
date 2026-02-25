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
  date: z.string(),
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

const categoryEnum = z.enum(["sight", "food", "nightlife", "transport", "accommodation", "activity"]);
export type PlaceCategory = z.infer<typeof categoryEnum>;

export const enrichedPlaceSchema = parsedPlaceSchema.extend({
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  imageUrl: z.string().nullable(),
  episode: z.enum(episodeKeys),
  sortOrder: z.number(),
  descriptionLong: z.string().nullable().optional(),
  category: categoryEnum.nullable().optional(),
  durationMinutes: z.number().nullable().optional(),
  addressShort: z.string().nullable().optional(),
});
export type EnrichedPlace = z.infer<typeof enrichedPlaceSchema>;

export const enrichedDaySchema = parsedDaySchema.extend({
  places: z.array(enrichedPlaceSchema),
  weatherHighC: z.number().nullable().optional(),
  weatherLowC: z.number().nullable().optional(),
  weatherCondition: z.string().nullable().optional(),
  weatherIcon: z.string().nullable().optional(),
});
export type EnrichedDay = z.infer<typeof enrichedDaySchema>;

export const enrichedItinerarySchema = z.object({
  days: z.array(enrichedDaySchema),
});
export type EnrichedItinerary = z.infer<typeof enrichedItinerarySchema>;
