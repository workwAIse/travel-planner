"use client";

import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2Icon, XIcon } from "lucide-react";
import { enrichAndSaveTrip } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function EnrichForm() {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [tripName, setTripName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();
  const formId = useId();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await enrichAndSaveTrip(rawText, tripName);
      if (result.ok) {
        toast.success("Trip saved.");
        router.push(`/trips/${result.tripId}`);
        return;
      }
      setError(result.error ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate aria-describedby={error ? errorId : undefined}>
      <Card>
        <CardHeader className="space-y-2">
          <Label htmlFor="trip-name">Trip name</Label>
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
          />
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
          <div className="space-y-2">
            <Label htmlFor="itinerary">Raw itinerary text</Label>
            <Textarea
              id="itinerary"
              placeholder="Paste your itinerary here (dates, places, Google Maps links, etc.)..."
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                setError(null);
              }}
              disabled={loading}
              rows={14}
              className="resize-y font-mono text-sm"
              aria-invalid={!!error}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                Parsing & enriching…
              </>
            ) : (
              "Enrich and save"
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
