"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2Icon, MapPinIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePlaceLocation } from "@/app/actions";

type EditLocationDialogProps = {
  placeId: string;
  dayId: string;
  placeName: string;
  children: React.ReactNode;
};

export function EditLocationDialog({
  placeId,
  dayId,
  placeName,
  children,
}: EditLocationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [saving, startTransition] = useTransition();

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) setUrl("");
  }

  function handleSave() {
    const trimmed = url.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await updatePlaceLocation(placeId, dayId, trimmed);
      if (result.ok) {
        toast.success(
          result.approximate
            ? "Location set from place name (approximate). For a precise pin, use a direct Google Maps link."
            : "Location updated — map pin should be correct now."
        );
        setOpen(false);
        setUrl("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPinIcon className="size-4 text-primary" />
            Fix map pin for &ldquo;{placeName}&rdquo;
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Paste a Google Maps link to this place. We&apos;ll use its coordinates
          so the pin appears in the right spot.
        </p>
        <Input
          placeholder="https://www.google.com/maps/place/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={saving}
          className="text-sm"
        />
        <Button
          onClick={handleSave}
          disabled={!url.trim() || saving}
          className="w-full"
        >
          {saving ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            "Update location"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
