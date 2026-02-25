"use client";

import {
  MapPinIcon,
  ClockIcon,
  ExternalLinkIcon,
  GripVerticalIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type PlaceCardData = {
  id: string;
  name: string;
  episode: string;
  details: string | null;
  google_maps_url: string | null;
  lat: number | null;
  lng: number | null;
  image_url: string | null;
  sort_order: number;
  description_long: string | null;
  category: string | null;
  duration_minutes: number | null;
  address_short: string | null;
};

type PlaceCardProps = {
  place: PlaceCardData;
  index: number;
  isActive?: boolean;
  onSelect?: () => void;
  dragHandleProps?: Record<string, unknown>;
};

const categoryColors: Record<string, string> = {
  sight: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  food: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  nightlife:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  transport:
    "bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300",
  accommodation:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  activity:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

function descriptionText(place: PlaceCardData): string | null {
  if (place.description_long) return place.description_long;
  if (place.details) return place.details.split("\n")[0];
  return null;
}

export function PlaceCard({
  place,
  index,
  isActive,
  onSelect,
  dragHandleProps,
}: PlaceCardProps) {
  const desc = descriptionText(place);
  const catColor =
    categoryColors[(place.category ?? "").toLowerCase()] ??
    categoryColors.sight;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect?.();
      }}
      className={cn(
        "group relative flex gap-3 rounded-xl border bg-card p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
        isActive && "ring-2 ring-primary"
      )}
    >
      <div
        {...dragHandleProps}
        className="absolute top-1/2 -left-1 -translate-y-1/2 flex items-center justify-center rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
      >
        <GripVerticalIcon className="size-4" />
      </div>

      <div className="relative shrink-0 w-28 aspect-[4/3] rounded-lg overflow-hidden bg-muted">
        {place.image_url ? (
          <img
            src={place.image_url}
            alt={place.name}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <MapPinIcon className="size-6" />
          </div>
        )}
        <span className="absolute top-1.5 left-1.5 flex size-5 items-center justify-center rounded-full bg-foreground/70 text-[10px] font-bold text-background">
          {index + 1}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-tight truncate">
            {place.name}
          </h3>
          {place.category && (
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                catColor
              )}
            >
              {place.category}
            </span>
          )}
        </div>

        {desc && (
          <p className="text-xs text-muted-foreground line-clamp-2">{desc}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted-foreground">
          {place.duration_minutes != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
              <ClockIcon className="size-3" />
              {place.duration_minutes} min
            </span>
          )}

          {place.address_short && (
            <span className="truncate">{place.address_short}</span>
          )}

          {place.google_maps_url && (
            <a
              href={place.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-primary hover:underline ml-auto"
            >
              <ExternalLinkIcon className="size-3" />
              Map
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
