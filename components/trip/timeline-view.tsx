"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { PlaneIcon, MapPinIcon, ClockIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type TimelineViewProps = {
  days: Array<{
    id: string;
    date: string;
    place: string;
    theme: string | null;
    summary: string | null;
    weather_icon: string | null;
    weather_high_c: number | null;
    weather_low_c: number | null;
    places: Array<{
      id: string;
      name: string;
      image_url: string | null;
      category: string | null;
    }>;
  }>;
  onDaySelect: (dayId: string) => void;
};

const categoryColors: Record<string, string> = {
  sight: "border-blue-300 dark:border-blue-700",
  food: "border-orange-300 dark:border-orange-700",
  nightlife: "border-purple-300 dark:border-purple-700",
  transport: "border-gray-300 dark:border-gray-600",
  accommodation: "border-green-300 dark:border-green-700",
  activity: "border-amber-300 dark:border-amber-700",
};

export function TimelineView({ days, onDaySelect }: TimelineViewProps) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4">
      <div className="relative">
        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-primary/20" />

        {days.map((day, i) => {
          const prevDay = days[i - 1];
          const cityChanged = prevDay && prevDay.place !== day.place;

          return (
            <div key={day.id}>
              {cityChanged && (
                <TransitionNode from={prevDay.place} to={day.place} />
              )}
              <DayNode day={day} dayNumber={i + 1} onSelect={onDaySelect} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TransitionNode({ from, to }: { from: string; to: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
      className="relative flex items-center gap-3 py-3 pl-0"
    >
      <div className="z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/40 bg-muted">
        <PlaneIcon className="size-3 text-muted-foreground" />
      </div>
      <span className="text-sm italic text-muted-foreground">
        Travel: {from} → {to}
      </span>
    </motion.div>
  );
}

function DayNode({
  day,
  dayNumber,
  onSelect,
}: {
  day: TimelineViewProps["days"][number];
  dayNumber: number;
  onSelect: (id: string) => void;
}) {
  const dateObj = new Date(day.date + "T00:00:00");
  const label = `Day ${dayNumber} · ${format(dateObj, "EEE, MMM d")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="relative flex items-start gap-3 py-3 pl-0"
    >
      <div className="z-10 mt-4 size-4 shrink-0 rounded-full bg-primary ring-4 ring-background" />

      <button
        type="button"
        onClick={() => onSelect(day.id)}
        className="flex-1 rounded-xl border bg-card p-4 text-left transition-shadow duration-200 hover:shadow-md"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">{label}</span>
          {day.weather_icon != null && day.weather_high_c != null && (
            <span className="shrink-0 text-sm text-muted-foreground">
              {day.weather_icon}{" "}
              {Math.round(day.weather_high_c)}°
              {day.weather_low_c != null && ` / ${Math.round(day.weather_low_c)}°`}
            </span>
          )}
        </div>

        <p className="mt-0.5 text-sm font-medium text-muted-foreground">
          {day.place}
          {day.theme && <span className="ml-1.5 text-xs">· {day.theme}</span>}
        </p>

        {day.summary && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {day.summary}
          </p>
        )}

        {day.places.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {day.places.map((p) => {
              const borderColor = categoryColors[(p.category ?? "").toLowerCase()] ?? "border-border";
              return (
                <div key={p.id} className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "size-10 shrink-0 overflow-hidden rounded-lg bg-muted border-2",
                      borderColor
                    )}
                  >
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <MapPinIcon className="size-3.5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium truncate block">{p.name}</span>
                    {p.category && (
                      <span className="text-[10px] text-muted-foreground capitalize">{p.category}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex items-center gap-1.5 text-xs text-primary font-medium">
          <ClockIcon className="size-3" />
          {day.places.length} {day.places.length === 1 ? "stop" : "stops"} · View details →
        </div>
      </button>
    </motion.div>
  );
}
