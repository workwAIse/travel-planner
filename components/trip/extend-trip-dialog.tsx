"use client";

import { useState, useTransition, useMemo } from "react";
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
import { extendTrip } from "@/app/actions";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { format, addDays } from "date-fns";

type ExtendTripDialogProps = {
  tripId: string;
  days: Array<{
    id: string;
    date: string;
    place: string;
  }>;
};

export function ExtendTripDialog({ tripId, days }: ExtendTripDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(days[days.length - 1]?.date ?? "");
  const [city, setCity] = useState(days[days.length - 1]?.place ?? "");
  const [isPending, startTransition] = useTransition();

  const selectedIndex = days.findIndex((d) => d.date === selectedDate);

  const subsequentCount = useMemo(() => {
    if (selectedIndex === -1) return 0;
    return days.length - selectedIndex - 1;
  }, [days.length, selectedIndex]);

  const newDate = useMemo(() => {
    if (!selectedDate) return null;
    return addDays(new Date(selectedDate + "T00:00:00"), 1);
  }, [selectedDate]);

  function handleSelectChange(value: string) {
    setSelectedDate(value);
    const day = days.find((d) => d.date === value);
    if (day) setCity(day.place);
  }

  function handleSubmit() {
    if (!selectedDate || !city.trim()) return;

    startTransition(async () => {
      const result = await extendTrip(tripId, selectedDate, city.trim());
      if (result.ok) {
        toast.success("Day added to your trip");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon />
          Add a day
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a day to your trip</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="insert-after">Insert after</Label>
            <select
              id="insert-after"
              value={selectedDate}
              onChange={(e) => handleSelectChange(e.target.value)}
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              {days.map((day, i) => {
                const dateObj = new Date(day.date + "T00:00:00");
                return (
                  <option key={day.id} value={day.date}>
                    After Day {i + 1}: {day.place},{" "}
                    {format(dateObj, "MMM d")}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city-name">City</Label>
            <Input
              id="city-name"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City name"
            />
          </div>

          {newDate && city.trim() && (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              This will add a free day on{" "}
              <span className="font-medium text-foreground">
                {format(newDate, "EEE, MMM d")}
              </span>{" "}
              in{" "}
              <span className="font-medium text-foreground">{city.trim()}</span>
              {subsequentCount > 0 && (
                <>
                  {" "}and shift{" "}
                  <span className="font-medium text-foreground">
                    {subsequentCount}
                  </span>{" "}
                  subsequent {subsequentCount === 1 ? "day" : "days"} forward
                </>
              )}
              .
            </p>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isPending || !city.trim()}>
            {isPending ? "Adding…" : "Add day"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
