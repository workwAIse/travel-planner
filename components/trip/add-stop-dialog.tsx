"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  SparklesIcon,
  Loader2Icon,
  CheckIcon,
  PlusCircleIcon,
  MapPinIcon,
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
import { suggestNewStops, addStop } from "@/app/actions";
import type { Recommendation } from "@/lib/recommendations";
import { cn } from "@/lib/utils";

type AddStopDialogProps = {
  dayId: string;
  episode: string;
  city: string;
};

const categoryColors: Record<string, string> = {
  sight: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  food: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  nightlife: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  activity: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

export function AddStopDialog({ dayId, episode, city }: AddStopDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [, startTransition] = useTransition();

  async function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen && recommendations.length === 0 && !loading) {
      fetchSuggestions();
    }
  }

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

  async function handleAdd(name: string, category: string) {
    setAdding(name);
    startTransition(async () => {
      const result = await addStop(dayId, episode, name, category);
      if (result.ok) {
        toast.success(`Added ${name}`);
        setOpen(false);
        setRecommendations([]);
        setAdding(null);
        setCustomName("");
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
    await handleAdd(name, "sight");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium py-1"
        >
          <PlusCircleIcon className="size-3.5" />
          Add a stop
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircleIcon className="size-4 text-primary" />
            Add a {episode.toLowerCase()} stop in {city}
          </DialogTitle>
        </DialogHeader>

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

        <div className="relative">
          <div className="absolute inset-x-0 top-1/2 border-t" />
          <p className="relative bg-background px-2 text-xs text-muted-foreground text-center w-fit mx-auto">
            or pick a saved or AI suggestion
          </p>
        </div>

        <div className="space-y-3 min-h-[100px]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
              <Loader2Icon className="size-5 animate-spin text-primary" />
              <span className="text-sm">Loading saved and AI picks…</span>
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
              const sourceTag = rec.sourceLabel
                ? rec.sourceCollection
                  ? `${rec.sourceLabel} · ${rec.sourceCollection}`
                  : rec.sourceLabel
                : null;

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
                      {sourceTag && (
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                          {sourceTag}
                        </span>
                      )}
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
      </DialogContent>
    </Dialog>
  );
}
