"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DownloadIcon, Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { importSavedPlacesForTrip } from "@/app/actions";
import type { SavedPlaceSource } from "@/lib/saved-places";

const SOURCE_OPTIONS: Array<{ value: SavedPlaceSource; label: string }> = [
  { value: "google_maps", label: "Google Maps lists" },
  { value: "instagram", label: "Instagram saved folders" },
];

export function ImportSavedPlacesDialog({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<SavedPlaceSource>("google_maps");
  const [collectionName, setCollectionName] = useState("");
  const [rawInput, setRawInput] = useState("");
  const [lastSummary, setLastSummary] = useState<{
    imported: number;
    parsed: number;
    duplicates: number;
    aiItems: number;
    warnings: string[];
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const placeholder = useMemo(() => {
    if (source === "google_maps") {
      return [
        "Paste one of:",
        "- Google Maps Takeout JSON",
        "- Lines from a shared list",
        "- Google Maps URLs",
        "",
        "Example:",
        "Buvette - Paris",
        "https://www.google.com/maps/place/Louvre+Museum",
      ].join("\n");
    }
    return [
      "Paste one of:",
      "- Instagram data-download JSON",
      "- Saved folder lines or captions",
      "- Instagram location links",
      "",
      "Example:",
      "Dinner at Bavel",
      "https://www.instagram.com/explore/locations/2132456/louvre-museum/",
    ].join("\n");
  }, [source]);

  function handleImport() {
    if (!rawInput.trim()) {
      toast.error("Paste your saved data first.");
      return;
    }

    startTransition(async () => {
      const result = await importSavedPlacesForTrip(
        tripId,
        source,
        collectionName.trim(),
        rawInput
      );

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setLastSummary({
        imported: result.imported,
        parsed: result.parsed,
        duplicates: result.duplicates,
        aiItems: result.aiItems,
        warnings: result.warnings,
      });
      setRawInput("");
      router.refresh();

      if (result.imported > 0) {
        toast.success(
          `Imported ${result.imported} place${result.imported === 1 ? "" : "s"}. They now appear in "Add a stop".`
        );
      } else {
        toast.message("All detected places were already imported for this trip.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setLastSummary(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <DownloadIcon />
          Import saved places
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Google Maps or Instagram saves</DialogTitle>
          <DialogDescription>
            Paste your exported or copied saved places. We auto-parse, dedupe, and feed them into the existing
            &quot;Add a stop&quot; suggestions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="saved-source">Source</Label>
              <Select
                value={source}
                onValueChange={(value) => setSource(value as SavedPlaceSource)}
              >
                <SelectTrigger id="saved-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="collection-name">Collection name (optional)</Label>
              <Input
                id="collection-name"
                value={collectionName}
                onChange={(event) => setCollectionName(event.target.value)}
                placeholder="e.g. Rome food, Summer shortlist"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="saved-raw-input">Export data / list text / links</Label>
            <Textarea
              id="saved-raw-input"
              value={rawInput}
              onChange={(event) => setRawInput(event.target.value)}
              placeholder={placeholder}
              className="min-h-56 font-mono text-xs"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Tip: you can paste raw JSON, copied list rows, or mixed text and links.
            </p>
          </div>

          {lastSummary && (
            <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
              <p>
                Parsed <span className="font-medium">{lastSummary.parsed}</span>, imported{" "}
                <span className="font-medium">{lastSummary.imported}</span>, skipped{" "}
                <span className="font-medium">{lastSummary.duplicates}</span> duplicates.
              </p>
              {lastSummary.aiItems > 0 && (
                <p className="text-xs text-muted-foreground">
                  AI parsing boost contributed {lastSummary.aiItems} extra candidate place
                  {lastSummary.aiItems === 1 ? "" : "s"}.
                </p>
              )}
              {lastSummary.warnings.length > 0 && (
                <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5">
                  {lastSummary.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={isPending}>Close</Button>
          </DialogClose>
          <Button onClick={handleImport} disabled={isPending || !rawInput.trim()}>
            {isPending ? (
              <>
                <Loader2Icon className="animate-spin" />
                Importing...
              </>
            ) : (
              "Analyze and import"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
