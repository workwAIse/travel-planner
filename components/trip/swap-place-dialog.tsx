"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  SparklesIcon,
  Loader2Icon,
  CheckIcon,
  ArrowRightLeftIcon,
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
import { suggestAlternatives, replacePlace } from "@/app/actions";
import type { Recommendation } from "@/lib/recommendations";
import { cn } from "@/lib/utils";

type SwapPlaceDialogProps = {
  placeId: string;
  dayId: string;
  placeName: string;
  children: React.ReactNode;
};

const categoryColors: Record<string, string> = {
  sight: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  food: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  nightlife: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  activity: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

export function SwapPlaceDialog({
  placeId,
  dayId,
  placeName,
  children,
}: SwapPlaceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replacing, setReplacing] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen && recommendations.length === 0 && !loading) {
      setLoading(true);
      setError(null);
      const result = await suggestAlternatives(dayId, placeId);
      setLoading(false);
      if (result.ok) {
        setRecommendations(result.recommendations);
      } else {
        setError(result.error);
      }
    }
  }

  async function handleReplace(rec: Recommendation) {
    setReplacing(rec.name);
    startTransition(async () => {
      const result = await replacePlace(placeId, dayId, rec.name, rec.category);
      if (result.ok) {
        toast.success(`Replaced with ${rec.name}`);
        setOpen(false);
        setRecommendations([]);
        setReplacing(null);
        router.refresh();
      } else {
        toast.error(result.error);
        setReplacing(null);
      }
    });
  }

  async function handleRefresh() {
    setLoading(true);
    setError(null);
    setRecommendations([]);
    const result = await suggestAlternatives(dayId, placeId);
    setLoading(false);
    if (result.ok) {
      setRecommendations(result.recommendations);
    } else {
      setError(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeftIcon className="size-4 text-primary" />
            Replace &ldquo;{placeName}&rdquo;
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Saved and AI alternatives based on your itinerary. Pick one to fully
          replace this stop with geocoded location, photo, and description.
        </p>

        <div className="space-y-3 py-2 min-h-[120px]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2Icon className="size-5 animate-spin text-primary" />
              <span className="text-sm">Finding alternatives…</span>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading &&
            recommendations.map((rec) => {
              const isReplacing = replacing === rec.name;
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
                      disabled={replacing !== null}
                      onClick={() => handleReplace(rec)}
                    >
                      {isReplacing ? (
                        <>
                          <Loader2Icon className="size-3 animate-spin" />
                          Replacing…
                        </>
                      ) : (
                        <>
                          <CheckIcon className="size-3" />
                          Use this
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
            onClick={handleRefresh}
            disabled={replacing !== null}
          >
            <SparklesIcon className="size-3.5" />
            Get new suggestions
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
