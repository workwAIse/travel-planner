"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  SparklesIcon,
  Loader2Icon,
  CheckIcon,
  PlusCircleIcon,
  MapPinIcon,
  PlaneIcon,
  CalendarClockIcon,
  LinkIcon,
  StickyNoteIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { suggestNewStops, addStop } from "@/app/actions";
import type { Recommendation } from "@/lib/recommendations";
import { cn } from "@/lib/utils";

type AddStopDialogProps = {
  dayId: string;
  episode: string;
  city: string;
};

type AddMode = "stop" | "transport";

const categoryColors: Record<string, string> = {
  sight: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  food: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  nightlife: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  activity: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

export function AddStopDialog({ dayId, episode, city }: AddStopDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AddMode>("stop");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [googleMapsLink, setGoogleMapsLink] = useState("");
  const [transportName, setTransportName] = useState("");
  const [timeInfo, setTimeInfo] = useState("");
  const [bookingUrl, setBookingUrl] = useState("");
  const [transportNotes, setTransportNotes] = useState("");
  const [, startTransition] = useTransition();

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setMode("stop");
      setTransportName("");
      setTimeInfo("");
      setBookingUrl("");
      setTransportNotes("");
    }
  }

  useEffect(() => {
    if (open && mode === "stop" && recommendations.length === 0 && !loading) {
      fetchSuggestions();
    }
  }, [open, mode]);

  async function fetchSuggestions() {
    setLoading(true);
    setError(null);
    const result = await suggestNewStops(dayId, episode);
    setLoading(false);
    if (result.ok) {
      setRecommendations(result.recommendations);
    } else {
      setError(result.error);
    }
  }

  async function handleAdd(name: string, category: string, mapsUrl?: string | null) {
    setAdding(name);
    startTransition(async () => {
      const result = await addStop(dayId, episode, name, category, {
        googleMapsUrl: mapsUrl?.trim() || undefined,
      });
      if (result.ok) {
        toast.success(`Added ${name}`);
        setOpen(false);
        setRecommendations([]);
        setAdding(null);
        setCustomName("");
        setGoogleMapsLink("");
        router.refresh();
      } else {
        toast.error(result.error);
        setAdding(null);
      }
    });
  }

  async function handleAddCustom() {
    const name = customName.trim();
    if (!name) return;
    await handleAdd(name, "sight", googleMapsLink || undefined);
  }

  async function handleAddTransport() {
    const name = transportName.trim();
    if (!name) return;
    setAdding(name);
    startTransition(async () => {
      const result = await addStop(dayId, episode, name, "transport", {
        timeInfo: timeInfo.trim() || null,
        bookingUrl: bookingUrl.trim() || null,
        userNotes: transportNotes.trim() || null,
      });
      if (result.ok) {
        toast.success(`Added ${name}`);
        setOpen(false);
        setAdding(null);
        setTransportName("");
        setTimeInfo("");
        setBookingUrl("");
        setTransportNotes("");
        router.refresh();
      } else {
        toast.error(result.error);
        setAdding(null);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <div className="flex items-center gap-1">
        <DialogTrigger asChild>
          <button
            type="button"
            onClick={() => setMode("stop")}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium py-1"
          >
            <PlusCircleIcon className="size-3.5" />
            Add a stop
          </button>
        </DialogTrigger>
        <span className="text-muted-foreground/60">·</span>
        <DialogTrigger asChild>
          <button
            type="button"
            onClick={() => setMode("transport")}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium py-1"
          >
            <PlaneIcon className="size-3.5" />
            Add transport
          </button>
        </DialogTrigger>
      </div>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "transport" ? (
              <>
                <PlaneIcon className="size-4 text-primary" />
                Add transport — {episode.toLowerCase()} in {city}
              </>
            ) : (
              <>
                <PlusCircleIcon className="size-4 text-primary" />
                Add a {episode.toLowerCase()} stop in {city}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex rounded-lg border p-0.5 bg-muted/30">
          <button
            type="button"
            onClick={() => { setMode("stop"); setError(null); if (recommendations.length === 0 && !loading) fetchSuggestions(); }}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              mode === "stop" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Add a stop
          </button>
          <button
            type="button"
            onClick={() => { setMode("transport"); setError(null); }}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              mode === "transport" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Add transport
          </button>
        </div>

        {mode === "transport" ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="transport-name">Name (e.g. Flight to Da Nang, Train to Hue)</Label>
              <Input
                id="transport-name"
                placeholder="Flight SGN → DAD"
                value={transportName}
                onChange={(e) => setTransportName(e.target.value)}
                disabled={adding !== null}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="transport-time" className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarClockIcon className="size-3.5" />
                Time (optional)
              </Label>
              <Input
                id="transport-time"
                placeholder="Dep 14:00, Arr 16:30"
                value={timeInfo}
                onChange={(e) => setTimeInfo(e.target.value)}
                disabled={adding !== null}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="transport-link" className="flex items-center gap-1.5 text-muted-foreground">
                <LinkIcon className="size-3.5" />
                Booking or ticket link (optional)
              </Label>
              <Input
                id="transport-link"
                type="url"
                placeholder="https://..."
                value={bookingUrl}
                onChange={(e) => setBookingUrl(e.target.value)}
                disabled={adding !== null}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="transport-notes" className="flex items-center gap-1.5 text-muted-foreground">
                <StickyNoteIcon className="size-3.5" />
                Notes (optional)
              </Label>
              <textarea
                id="transport-notes"
                placeholder="Confirmation code, terminal, seat number…"
                value={transportNotes}
                onChange={(e) => setTransportNotes(e.target.value)}
                disabled={adding !== null}
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button
              onClick={handleAddTransport}
              disabled={!transportName.trim() || adding !== null}
              className="w-full"
            >
              {adding ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Adding…
                </>
              ) : (
                <>
                  <PlaneIcon className="size-4" />
                  Add transport
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
        <div className="flex gap-2">
          <Input
            placeholder="Or type a place name…"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAddCustom(); }}
            disabled={adding !== null}
            className="text-sm"
          />
          <Button
            size="sm"
            onClick={handleAddCustom}
            disabled={!customName.trim() || adding !== null}
          >
            {adding === customName.trim() ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              "Add"
            )}
          </Button>
        </div>

        <Input
          placeholder="Paste Google Maps link (optional — for accurate map pin)"
          value={googleMapsLink}
          onChange={(e) => setGoogleMapsLink(e.target.value)}
          disabled={adding !== null}
          className="text-sm"
        />

        <div className="relative">
          <div className="absolute inset-x-0 top-1/2 border-t" />
          <p className="relative bg-background px-2 text-xs text-muted-foreground text-center w-fit mx-auto">
            or pick an AI suggestion
          </p>
        </div>

        <div className="space-y-3 min-h-[100px]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
              <Loader2Icon className="size-5 animate-spin text-primary" />
              <span className="text-sm">Finding great stops…</span>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading &&
            recommendations.map((rec) => {
              const isAdding = adding === rec.name;
              const catColor =
                categoryColors[rec.category.toLowerCase()] ??
                categoryColors.sight;

              return (
                <div
                  key={rec.name}
                  className="flex items-start gap-3 rounded-xl border bg-card p-3 transition-all hover:shadow-sm"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <MapPinIcon className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">
                        {rec.name}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                          catColor
                        )}
                      >
                        {rec.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{rec.reason}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1 h-7 text-xs"
                      disabled={adding !== null}
                      onClick={() => handleAdd(rec.name, rec.category)}
                    >
                      {isAdding ? (
                        <>
                          <Loader2Icon className="size-3 animate-spin" />
                          Adding…
                        </>
                      ) : (
                        <>
                          <CheckIcon className="size-3" />
                          Add this
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>

        {!loading && recommendations.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => { setRecommendations([]); fetchSuggestions(); }}
            disabled={adding !== null}
          >
            <SparklesIcon className="size-3.5" />
            Get new suggestions
          </Button>
        )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
