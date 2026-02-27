"use client";

import { useMemo, useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ClipboardIcon,
  DownloadIcon,
  LinkIcon,
  Loader2Icon,
  UploadIcon,
} from "lucide-react";
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
import { fetchImportSourceFromUrl, importSavedPlacesForTrip } from "@/app/actions";
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
  const [sourceUrl, setSourceUrl] = useState("");
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [isPastingClipboard, setIsPastingClipboard] = useState(false);
  const [lastSummary, setLastSummary] = useState<{
    imported: number;
    parsed: number;
    duplicates: number;
    aiItems: number;
    warnings: string[];
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  async function handleImportFromUrl() {
    const trimmed = sourceUrl.trim();
    if (!trimmed) {
      toast.error("Paste a URL first.");
      return;
    }

    setIsFetchingUrl(true);
    const result = await fetchImportSourceFromUrl(source, trimmed);
    setIsFetchingUrl(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setRawInput((current) => mergeImportText(current, result.extractedText));
    setSourceUrl("");
    toast.success("Imported data from URL. Review and click Analyze and import.");
    result.warnings.forEach((warning) => toast.message(warning));
  }

  async function handleImportFromClipboard() {
    if (!navigator.clipboard?.readText) {
      toast.error("Clipboard access is not supported in this browser.");
      return;
    }

    setIsPastingClipboard(true);
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast.error("Clipboard is empty.");
        return;
      }
      setRawInput((current) => mergeImportText(current, text));
      toast.success("Clipboard content added.");
    } catch {
      toast.error("Clipboard read failed. Allow clipboard permission and try again.");
    } finally {
      setIsPastingClipboard(false);
    }
  }

  async function handleImportFromFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (file.size > 3 * 1024 * 1024) {
        toast.error("File is too large. Use files under 3MB.");
        return;
      }
      const text = await file.text();
      if (!text.trim()) {
        toast.error("File is empty.");
        return;
      }
      setRawInput((current) => mergeImportText(current, text));
      toast.success(`Loaded ${file.name}.`);
    } catch {
      toast.error("Failed to read file.");
    } finally {
      event.target.value = "";
    }
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

          <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Quick import helpers
            </p>

            <div className="flex gap-2">
              <Input
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="Paste public list/share URL and fetch"
                disabled={isPending || isFetchingUrl || isPastingClipboard}
              />
              <Button
                variant="outline"
                onClick={handleImportFromUrl}
                disabled={isPending || isFetchingUrl || !sourceUrl.trim()}
              >
                {isFetchingUrl ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <LinkIcon />
                    Fetch URL
                  </>
                )}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleImportFromClipboard}
                disabled={isPending || isFetchingUrl || isPastingClipboard}
              >
                {isPastingClipboard ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Reading...
                  </>
                ) : (
                  <>
                    <ClipboardIcon />
                    Use clipboard
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending || isFetchingUrl || isPastingClipboard}
              >
                <UploadIcon />
                Upload file
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt,.csv,.html,.htm"
              className="hidden"
              onChange={handleImportFromFile}
            />
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

function mergeImportText(current: string, incoming: string): string {
  const left = current.trim();
  const right = incoming.trim();
  if (!left) return right;
  if (!right) return left;
  return `${left}\n\n${right}`;
}
