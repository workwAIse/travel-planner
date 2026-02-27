"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MapPinIcon,
  CalendarIcon,
  NavigationIcon,
  SunIcon,
  MapPinOffIcon,
  Loader2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { regeocodeTrip } from "@/app/actions";
import type { TripWithDaysAndPlaces } from "@/lib/db-types";

type TripStatsProps = {
  trip: TripWithDaysAndPlaces;
};

export function TripStats({ trip }: TripStatsProps) {
  const router = useRouter();
  const totalPlaces = trip.days.reduce((sum, d) => sum + d.places.length, 0);
  const cities = [...new Set(trip.days.map((d) => d.place))];
  const totalDuration = trip.days.reduce(
    (sum, d) =>
      sum + d.places.reduce((ps, p) => ps + (p.duration_minutes ?? 0), 0),
    0
  );
  const hours = Math.floor(totalDuration / 60);
  const minutes = totalDuration % 60;

  const missingCoords = trip.days.reduce(
    (sum, d) => sum + d.places.filter((p) => p.lat == null || p.lng == null).length,
    0
  );

  const cityBreakdown = cities.map((city) => {
    const count = trip.days.filter((d) => d.place === city).length;
    return { city, count };
  });

  const [isPending, startTransition] = useTransition();

  function handleRegeocode() {
    startTransition(async () => {
      const result = await regeocodeTrip(trip.id);
      if (result.ok) {
        if (result.fixed > 0) {
          toast.success(`Fixed ${result.fixed} of ${result.total} missing locations`);
          router.refresh();
        } else if (result.total === 0) {
          toast.info("All stops already have map locations");
        } else {
          toast.warning(`Could not geocode ${result.total} stops — try editing their names`);
        }
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Trip overview
      </h3>

      <div className="grid grid-cols-2 gap-2">
        <Stat
          icon={<CalendarIcon className="size-3.5" />}
          label="Days"
          value={String(trip.days.length)}
        />
        <Stat
          icon={<MapPinIcon className="size-3.5" />}
          label="Stops"
          value={String(totalPlaces)}
        />
        <Stat
          icon={<NavigationIcon className="size-3.5" />}
          label="Cities"
          value={String(cities.length)}
        />
        <Stat
          icon={<SunIcon className="size-3.5" />}
          label="Est. time"
          value={hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
        />
      </div>

      {missingCoords > 0 && (
        <div className="pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={handleRegeocode}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2Icon className="size-3.5 animate-spin" />
                Fixing locations…
              </>
            ) : (
              <>
                <MapPinOffIcon className="size-3.5" />
                Fix {missingCoords} missing map {missingCoords === 1 ? "pin" : "pins"}
              </>
            )}
          </Button>
        </div>
      )}

      {cityBreakdown.length > 1 && (
        <div className="space-y-1.5 pt-2 border-t">
          <h4 className="text-xs font-medium text-muted-foreground">Route</h4>
          <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs">
            {cityBreakdown.map((item, i) => (
              <span key={item.city} className="flex items-center gap-0.5">
                {i > 0 && <span className="text-muted-foreground">→</span>}
                <span className="font-medium">{item.city}</span>
                <span className="text-muted-foreground">({item.count}d)</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
      <div className="text-primary">{icon}</div>
      <div>
        <p className="text-sm font-semibold leading-tight">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
