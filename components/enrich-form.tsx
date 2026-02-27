"use client";

import { useState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2Icon, XIcon, SparklesIcon, CheckIcon } from "lucide-react";
import { enrichAndSaveTrip } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const SAMPLE_ITINERARY = `Day 1 - Tokyo Arrival
Morning: Arrive at Narita Airport, take express to Shinjuku
Afternoon: Check into Park Hyatt, explore Shinjuku Gyoen garden
Evening: Dinner at Omoide Yokocho, walk through Kabukicho

Day 2 - Tokyo Exploration
Morning: Visit Meiji Shrine and Harajuku
Afternoon: Explore Shibuya crossing, shopping in Omotesando
Evening: Dinner in Roppongi, Tokyo Tower night view

Day 3 - Day trip to Kamakura
Morning: Train to Kamakura, visit Great Buddha
Afternoon: Hasedera temple, walk to Komachi-dori street
Evening: Return to Tokyo, dinner in Ginza`;

const PROGRESS_STEPS = [
  { label: "Parsing itinerary…", duration: 4000 },
  { label: "Geocoding places…", duration: 6000 },
  { label: "Fetching photos…", duration: 8000 },
  { label: "Getting weather data…", duration: 5000 },
  { label: "Saving your trip…", duration: 3000 },
];

export function EnrichForm() {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [tripName, setTripName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState(0);
  const errorId = useId();
  const formId = useId();

  useEffect(() => {
    if (!loading) {
      setProgressStep(0);
      return;
    }
    let step = 0;
    let timeout: ReturnType<typeof setTimeout>;
    const advance = () => {
      if (step < PROGRESS_STEPS.length - 1) {
        step++;
        setProgressStep(step);
        timeout = setTimeout(advance, PROGRESS_STEPS[step].duration);
      }
    };
    timeout = setTimeout(advance, PROGRESS_STEPS[0].duration);
    return () => clearTimeout(timeout);
  }, [loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await enrichAndSaveTrip(rawText, tripName);
      if (result.ok) {
        toast.success("Trip saved — let's explore!");
        router.push(`/trips/${result.tripId}`);
        return;
      }
      setError(result.error ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleTryExample() {
    setTripName("Tokyo & Kamakura Adventure");
    setRawText(SAMPLE_ITINERARY);
    setError(null);
  }

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate aria-describedby={error ? errorId : undefined}>
      <Card className="shadow-md border-0">
        <CardHeader className="space-y-3 pb-4">
          <div className="space-y-1.5">
            <Label htmlFor="trip-name" className="text-sm font-medium">
              Where to?
            </Label>
            <Input
              id="trip-name"
              placeholder="e.g. Vietnam March 2026"
              value={tripName}
              onChange={(e) => {
                setTripName(e.target.value);
                setError(null);
              }}
              disabled={loading}
              aria-invalid={!!error}
              className="text-base"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert id={errorId} variant="destructive" role="alert" className="flex items-start gap-3">
              <AlertTitle className="sr-only">Error</AlertTitle>
              <AlertDescription className="flex-1 min-w-0">
                {error}
              </AlertDescription>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Dismiss error"
                className="shrink-0 -my-1 -mr-1"
                onClick={() => setError(null)}
              >
                <XIcon className="size-4" />
              </Button>
            </Alert>
          )}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="itinerary" className="text-sm font-medium">
                Your itinerary
              </Label>
              {!loading && !rawText && (
                <button
                  type="button"
                  onClick={handleTryExample}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  See a sample trip →
                </button>
              )}
            </div>
            <Textarea
              id="itinerary"
              placeholder="Paste your plan — dates, places, links — we'll add the rest..."
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                setError(null);
              }}
              disabled={loading}
              rows={8}
              className="resize-y text-sm"
              aria-invalid={!!error}
            />
          </div>

          {loading && (
            <div className="rounded-lg bg-muted/60 p-4 space-y-2.5">
              {PROGRESS_STEPS.map((step, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-2.5 text-sm transition-all duration-300",
                    i < progressStep && "text-muted-foreground",
                    i === progressStep && "text-foreground font-medium",
                    i > progressStep && "text-muted-foreground/40"
                  )}
                >
                  {i < progressStep ? (
                    <CheckIcon className="size-4 text-green-600 dark:text-green-400 shrink-0" />
                  ) : i === progressStep ? (
                    <Loader2Icon className="size-4 animate-spin text-primary shrink-0" />
                  ) : (
                    <div className="size-4 shrink-0" />
                  )}
                  {step.label}
                </div>
              ))}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full sm:w-auto" size="lg">
            {loading ? (
              <>
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                Creating your trip…
              </>
            ) : (
              <>
                <SparklesIcon className="size-4" aria-hidden />
                Create trip
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
