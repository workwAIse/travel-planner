"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MapPinIcon,
  ClockIcon,
  ExternalLinkIcon,
  GripVerticalIcon,
  ArrowRightLeftIcon,
  StickyNoteIcon,
  Trash2Icon,
  Loader2Icon,
  PlaneIcon,
  CarIcon,
  TrainIcon,
  LinkIcon,
  CalendarClockIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SwapPlaceDialog } from "./swap-place-dialog";
import { EditLocationDialog } from "./edit-location-dialog";
import { updatePlaceNotes, updatePlaceTravelInfo, deletePlace } from "@/app/actions";

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
  user_notes: string | null;
  time_info: string | null;
  booking_url: string | null;
};

type PlaceCardProps = {
  place: PlaceCardData;
  index: number;
  isActive?: boolean;
  onSelect?: () => void;
  dragHandleProps?: Record<string, unknown>;
  dayId?: string;
};

const categoryColors: Record<string, string> = {
  sight: "bg-[#fdf0d6] text-[#8a5c0a] dark:bg-[#2a1e08] dark:text-[#e8c48a]",
  food: "bg-[#fde8e8] text-[#8b2020] dark:bg-[#2a0808] dark:text-[#f08080]",
  activity: "bg-[#dce8f5] text-[#1e3f6f] dark:bg-[#0a1628] dark:text-[#6b92c4]",
  nightlife: "bg-[#e8d8f5] text-[#4a1a80] dark:bg-[#1a0830] dark:text-[#c090f0]",
  transport: "bg-[#d8e8f5] text-[#1e3a5f] dark:bg-[#081420] dark:text-[#80b0f0]",
  accommodation: "bg-[#d8f0e8] text-[#1a5f3a] dark:bg-[#082018] dark:text-[#80c060]",
};

function descriptionText(place: PlaceCardData): string | null {
  if (place.description_long) return place.description_long;
  if (place.details) return place.details.split("\n")[0];
  return null;
}

function getTransportIcon(name: string): typeof PlaneIcon {
  const lower = name.toLowerCase();
  if (lower.includes("train") || lower.includes("station") || lower.includes("rail")) return TrainIcon;
  if (lower.includes("car") || lower.includes("drive") || lower.includes("bus") || lower.includes("taxi")) return CarIcon;
  return PlaneIcon;
}

export function PlaceCard({
  place,
  index,
  isActive,
  onSelect,
  dragHandleProps,
  dayId,
}: PlaceCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(place.user_notes ?? "");
  const [showTravelEdit, setShowTravelEdit] = useState(false);
  const [timeInfo, setTimeInfo] = useState(place.time_info ?? "");
  const [bookingUrl, setBookingUrl] = useState(place.booking_url ?? "");
  const [savingNotes, startSaveTransition] = useTransition();
  const [savingTravel, startSaveTravelTransition] = useTransition();
  const [deleting, startDeleteTransition] = useTransition();
  const desc = descriptionText(place);
  const isLong = desc != null && desc.length > 120;
  const catColor =
    categoryColors[(place.category ?? "").toLowerCase()] ??
    categoryColors.sight;
  const isTransport = (place.category ?? "").toLowerCase() === "transport";
  const transportIcon = getTransportIcon(place.name);

  function handleSaveNotes() {
    startSaveTransition(async () => {
      const result = await updatePlaceNotes(place.id, notes.trim() || null);
      if (result.ok) {
        toast.success("Note saved");
        setShowNotes(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    if (!dayId) return;
    startDeleteTransition(async () => {
      const result = await deletePlace(place.id, dayId);
      if (result.ok) {
        toast.success(`Removed ${place.name}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleSaveTravel() {
    startSaveTravelTransition(async () => {
      const result = await updatePlaceTravelInfo(
        place.id,
        timeInfo.trim() || null,
        bookingUrl.trim() || null
      );
      if (result.ok) {
        toast.success("Travel details saved");
        setShowTravelEdit(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

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
        dragHandleProps && "pl-8",
        isActive && "ring-2 ring-primary",
        isTransport && "border-l-4 border-l-primary bg-primary/5 dark:bg-primary/10"
      )}
    >
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          title="Drag to reorder"
          className="absolute top-1/2 left-1 -translate-y-1/2 flex items-center justify-center rounded-md p-1 opacity-30 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        >
          <GripVerticalIcon className="size-4" />
        </div>
      )}

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
        <span className="absolute top-1.5 left-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {index + 1}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {isTransport && (
              <span className="shrink-0 flex items-center justify-center rounded-md bg-primary/15 dark:bg-primary/25 p-1.5 text-primary" aria-hidden>
                {transportIcon === PlaneIcon && <PlaneIcon className="size-4" />}
                {transportIcon === CarIcon && <CarIcon className="size-4" />}
                {transportIcon === TrainIcon && <TrainIcon className="size-4" />}
              </span>
            )}
            <h3 className="text-sm font-semibold leading-tight truncate">
              {place.name}
            </h3>
          </div>
          {place.category && (
            <span
              className={cn(
                "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium tracking-wide",
                catColor
              )}
            >
              {place.category}
            </span>
          )}
        </div>

        {desc && (
          <div>
            <p className={cn("text-xs text-muted-foreground", !expanded && "line-clamp-2")}>{desc}</p>
            {isLong && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="text-xs text-primary hover:underline mt-0.5 font-medium"
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}

        {isTransport && (
          <>
            {(place.time_info || place.booking_url || showTravelEdit) && (
              <div className="rounded-md bg-muted/80 dark:bg-muted/50 border border-border px-2.5 py-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                {!showTravelEdit ? (
                  <>
                    {place.time_info && (
                      <div className="flex items-center gap-1.5 text-xs text-foreground">
                        <CalendarClockIcon className="size-3.5 shrink-0 text-primary" />
                        <span>{place.time_info}</span>
                      </div>
                    )}
                    {place.booking_url && (
                      <a
                        href={place.booking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <LinkIcon className="size-3.5 shrink-0" />
                        View booking
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowTravelEdit(true)}
                      className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                    >
                      Edit time & link
                    </button>
                  </>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Time (e.g. Dep 14:00, Arr 16:30)"
                      value={timeInfo}
                      onChange={(e) => setTimeInfo(e.target.value)}
                      className="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <input
                      type="url"
                      placeholder="Booking or ticket link"
                      value={bookingUrl}
                      onChange={(e) => setBookingUrl(e.target.value)}
                      className="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveTravel}
                        disabled={savingTravel}
                        className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        {savingTravel ? <Loader2Icon className="size-3 animate-spin" /> : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowTravelEdit(false); setTimeInfo(place.time_info ?? ""); setBookingUrl(place.booking_url ?? ""); }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {!place.time_info && !place.booking_url && !showTravelEdit && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowTravelEdit(true); }}
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                <CalendarClockIcon className="size-3" />
                Add time & booking link
              </button>
            )}
          </>
        )}

        {place.user_notes && !showNotes && (
          <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-2.5 py-1.5 text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-start gap-1.5">
              <StickyNoteIcon className="size-3 mt-0.5 shrink-0" />
              <span className="whitespace-pre-wrap">{place.user_notes}</span>
            </div>
          </div>
        )}

        {showNotes && (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a personal note… (e.g. book tickets, opens at 9am)"
              rows={2}
              className="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {savingNotes ? <Loader2Icon className="size-3 animate-spin" /> : "Save"}
              </button>
              <button
                type="button"
                onClick={() => { setShowNotes(false); setNotes(place.user_notes ?? ""); }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
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

          <span className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowNotes(!showNotes); }}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium"
              title={place.user_notes ? "Edit note" : "Add note"}
            >
              <StickyNoteIcon className="size-3" />
              {place.user_notes ? "Edit note" : "Note"}
            </button>
            {dayId && (
              <>
                <SwapPlaceDialog placeId={place.id} dayId={dayId} placeName={place.name}>
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                    title="Suggest AI alternative"
                  >
                    <ArrowRightLeftIcon className="size-3" />
                    Swap
                  </button>
                </SwapPlaceDialog>
                <EditLocationDialog
                  placeId={place.id}
                  dayId={dayId}
                  placeName={place.name}
                >
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground font-medium"
                    title="Set location from Google Maps link"
                  >
                    <MapPinIcon className="size-3" />
                    Fix pin
                  </button>
                </EditLocationDialog>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                  disabled={deleting}
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive font-medium"
                  title="Remove stop"
                >
                  {deleting ? <Loader2Icon className="size-3 animate-spin" /> : <Trash2Icon className="size-3" />}
                </button>
              </>
            )}
            {place.google_maps_url && (
              <a
                href={place.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLinkIcon className="size-3" />
                Map
              </a>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
