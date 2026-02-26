"use client";

import { useRef, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

type DaySelectorProps = {
  days: Array<{
    id: string;
    date: string;
    place: string;
    dayNumber: number;
  }>;
  activeDayId: string;
  onDaySelect: (dayId: string) => void;
};

export function DaySelector({
  days,
  activeDayId,
  onDaySelect,
}: DaySelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeDayId]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1 no-scrollbar"
    >
      {days.map((day) => {
        const isActive = day.id === activeDayId;
        let dateLabel: string;
        try {
          dateLabel = format(parseISO(day.date), "MMM d");
        } catch {
          dateLabel = day.date;
        }

        return (
          <button
            key={day.id}
            ref={isActive ? activeRef : undefined}
            onClick={() => onDaySelect(day.id)}
            className={cn(
              "snap-center shrink-0 flex flex-col items-center justify-center w-[72px] rounded-lg px-2 py-2 transition-colors duration-200",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            )}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide">
              Day {day.dayNumber}
            </span>
            <span className="text-xs font-medium">{dateLabel}</span>
            <span className="mt-0.5 max-w-full truncate text-[11px]">
              {day.place}
            </span>
          </button>
        );
      })}
    </div>
  );
}
