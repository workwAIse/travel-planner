"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PencilIcon, Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTrip } from "@/app/actions";

type EditTripDialogProps = {
  tripId: string;
  currentName: string;
  currentStartDate: string | null;
  currentEndDate: string | null;
};

export function EditTripDialog({
  tripId,
  currentName,
  currentStartDate,
  currentEndDate,
}: EditTripDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [startDate, setStartDate] = useState(currentStartDate ?? "");
  const [endDate, setEndDate] = useState(currentEndDate ?? "");
  const [isPending, startTransition] = useTransition();

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      setName(currentName);
      setStartDate(currentStartDate ?? "");
      setEndDate(currentEndDate ?? "");
    }
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await updateTrip(
        tripId,
        name,
        startDate || null,
        endDate || null
      );
      if (result.ok) {
        toast.success("Trip updated");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PencilIcon className="size-3.5" />
          <span className="hidden sm:inline ml-1">Edit</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit trip</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Trip name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Trip name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-start">Start date</Label>
              <Input
                id="edit-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end">End date</Label>
              <Input
                id="edit-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
              />
            </div>
          </div>
          {startDate && endDate && startDate !== currentStartDate && (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              Changing the start date will shift all day dates accordingly.
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={isPending}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isPending || !name.trim()}>
            {isPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
