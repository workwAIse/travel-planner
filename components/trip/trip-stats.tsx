import { MapPinIcon, CalendarIcon, NavigationIcon, SunIcon } from "lucide-react";
import type { TripWithDaysAndPlaces } from "@/lib/db-types";

type TripStatsProps = {
  trip: TripWithDaysAndPlaces;
};

export function TripStats({ trip }: TripStatsProps) {
  const totalPlaces = trip.days.reduce((sum, d) => sum + d.places.length, 0);
  const cities = [...new Set(trip.days.map((d) => d.place))];
  const totalDuration = trip.days.reduce(
    (sum, d) =>
      sum + d.places.reduce((ps, p) => ps + (p.duration_minutes ?? 0), 0),
    0
  );
  const hours = Math.floor(totalDuration / 60);
  const minutes = totalDuration % 60;

  const cityBreakdown = cities.map((city) => {
    const count = trip.days.filter((d) => d.place === city).length;
    return { city, count };
  });

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Trip overview
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          icon={<CalendarIcon className="size-4" />}
          label="Days"
          value={String(trip.days.length)}
        />
        <Stat
          icon={<MapPinIcon className="size-4" />}
          label="Stops"
          value={String(totalPlaces)}
        />
        <Stat
          icon={<NavigationIcon className="size-4" />}
          label="Cities"
          value={String(cities.length)}
        />
        <Stat
          icon={<SunIcon className="size-4" />}
          label="Est. time"
          value={hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
        />
      </div>

      <div className="space-y-2 pt-2 border-t">
        <h4 className="text-xs font-medium text-muted-foreground">Route</h4>
        <div className="flex flex-wrap items-center gap-1 text-sm">
          {cityBreakdown.map((item, i) => (
            <span key={item.city} className="flex items-center gap-1">
              {i > 0 && <span className="text-muted-foreground">→</span>}
              <span className="font-medium">{item.city}</span>
              <span className="text-xs text-muted-foreground">({item.count}d)</span>
            </span>
          ))}
        </div>
      </div>
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
    <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 p-2.5">
      <div className="text-primary">{icon}</div>
      <div>
        <p className="text-sm font-semibold">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
