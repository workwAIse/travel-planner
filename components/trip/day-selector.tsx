"use client";

import { useRef, useEffect, useState, useCallback } from "react";
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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
    setTimeout(checkScroll, 350);
  }, [activeDayId, checkScroll]);

  return (
    <div className="relative">
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      )}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      )}
      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1 no-scrollbar"
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
                "snap-center shrink-0 flex flex-col items-center justify-center w-16 sm:w-[72px] rounded-lg px-1.5 py-1.5 sm:py-2 transition-colors duration-200",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide leading-tight">
                Day {day.dayNumber}
              </span>
              <span className="text-[11px] sm:text-xs font-medium leading-tight">{dateLabel}</span>
              <span className="mt-0.5 max-w-full truncate text-[10px] sm:text-[11px] leading-tight">
                {day.place}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
