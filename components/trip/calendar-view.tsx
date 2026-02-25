"use client";

import { useMemo } from "react";
import {
  parseISO,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isBefore,
  isAfter,
  isSameMonth,
} from "date-fns";
import { cn } from "@/lib/utils";

type DayData = {
  id: string;
  date: string;
  place: string;
  weather_icon: string | null;
  weather_high_c: number | null;
  weather_low_c: number | null;
  places: Array<{ id: string; name: string; image_url: string | null }>;
};

type CalendarViewProps = {
  days: DayData[];
  onDaySelect: (dayId: string) => void;
};

type CityColor = { bg: string; text: string; accent: string };

const CITY_COLORS: CityColor[] = [
  { bg: "#fef3c7", text: "#92400e", accent: "#f59e0b" },
  { bg: "#ffe4e6", text: "#9f1239", accent: "#f43f5e" },
  { bg: "#ede9fe", text: "#5b21b6", accent: "#8b5cf6" },
  { bg: "#d1fae5", text: "#065f46", accent: "#10b981" },
  { bg: "#e0f2fe", text: "#075985", accent: "#0ea5e9" },
  { bg: "#ffedd5", text: "#9a3412", accent: "#f97316" },
  { bg: "#fce7f3", text: "#9d174d", accent: "#ec4899" },
  { bg: "#ccfbf1", text: "#134e4a", accent: "#14b8a6" },
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarView({ days, onDaySelect }: CalendarViewProps) {
  const { months, cityColorMap, tripDayMap, cityChangeDays } = useMemo(() => {
    if (days.length === 0) {
      return {
        months: [] as Date[],
        cityColorMap: new Map<string, CityColor>(),
        tripDayMap: new Map<string, DayData>(),
        cityChangeDays: new Set<string>(),
      };
    }

    const cityColorMap = new Map<string, CityColor>();
    let colorIdx = 0;
    for (const day of days) {
      if (!cityColorMap.has(day.place)) {
        cityColorMap.set(day.place, CITY_COLORS[colorIdx % CITY_COLORS.length]);
        colorIdx++;
      }
    }

    const tripDayMap = new Map<string, DayData>();
    for (const day of days) {
      tripDayMap.set(day.date, day);
    }

    const cityChangeDays = new Set<string>();
    for (let i = 1; i < days.length; i++) {
      if (days[i].place !== days[i - 1].place) {
        cityChangeDays.add(days[i].date);
      }
    }

    const firstDate = parseISO(days[0].date);
    const lastDate = parseISO(days[days.length - 1].date);
    const months: Date[] = [];
    let cur = startOfMonth(firstDate);
    const lastMonth = startOfMonth(lastDate);
    while (!isAfter(cur, lastMonth)) {
      months.push(cur);
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }

    return { months, cityColorMap, tripDayMap, cityChangeDays };
  }, [days]);

  if (days.length === 0) return null;

  const firstTripDate = parseISO(days[0].date);
  const lastTripDate = parseISO(days[days.length - 1].date);

  return (
    <div className="space-y-8">
      {months.map((monthDate) => (
        <MonthGrid
          key={format(monthDate, "yyyy-MM")}
          monthDate={monthDate}
          tripDayMap={tripDayMap}
          cityColorMap={cityColorMap}
          cityChangeDays={cityChangeDays}
          firstTripDate={firstTripDate}
          lastTripDate={lastTripDate}
          onDaySelect={onDaySelect}
        />
      ))}

      <div className="flex flex-wrap gap-3 pt-2">
        {Array.from(cityColorMap.entries()).map(([city, color]) => (
          <div key={city} className="flex items-center gap-1.5">
            <span
              className="size-3 rounded-full shrink-0"
              style={{ backgroundColor: color.accent }}
            />
            <span className="text-xs font-medium text-muted-foreground">
              {city}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthGrid({
  monthDate,
  tripDayMap,
  cityColorMap,
  cityChangeDays,
  firstTripDate,
  lastTripDate,
  onDaySelect,
}: {
  monthDate: Date;
  tripDayMap: Map<string, DayData>;
  cityColorMap: Map<string, CityColor>;
  cityChangeDays: Set<string>;
  firstTripDate: Date;
  lastTripDate: Date;
  onDaySelect: (dayId: string) => void;
}) {
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [monthDate]);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">
        {format(monthDate, "MMMM yyyy")}
      </h3>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground py-1"
          >
            {wd}
          </div>
        ))}

        {calendarDays.map((date) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const inMonth = isSameMonth(date, monthDate);

          if (!inMonth) {
            return <div key={dateStr} />;
          }

          const tripDay = tripDayMap.get(dateStr);
          const inTripRange =
            !isBefore(date, firstTripDate) && !isAfter(date, lastTripDate);

          if (!tripDay) {
            return (
              <div
                key={dateStr}
                className={cn(
                  "aspect-square rounded-lg flex items-center justify-center text-xs",
                  inTripRange
                    ? "bg-muted/40 text-muted-foreground/50"
                    : "text-muted-foreground/30"
                )}
              >
                {format(date, "d")}
              </div>
            );
          }

          const cityColor = cityColorMap.get(tripDay.place)!;
          const firstImage = tripDay.places.find((p) => p.image_url)
            ?.image_url;
          const isCityChange = cityChangeDays.has(dateStr);
          const stopCount = tripDay.places.length;

          return (
            <button
              key={dateStr}
              onClick={() => onDaySelect(tripDay.id)}
              className="relative aspect-square rounded-lg overflow-hidden border transition-all duration-150 hover:scale-[1.06] hover:shadow-md cursor-pointer text-left group"
              style={{
                backgroundColor: cityColor.bg,
                borderColor: cityColor.accent + "40",
              }}
            >
              {firstImage && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-[0.12] group-hover:opacity-20 transition-opacity"
                  style={{ backgroundImage: `url(${firstImage})` }}
                />
              )}

              <div className="relative z-10 flex flex-col h-full p-1 sm:p-1.5">
                <div className="flex items-center justify-between gap-0.5">
                  <span
                    className="text-[10px] sm:text-xs font-bold leading-none"
                    style={{ color: cityColor.text }}
                  >
                    {format(date, "d")}
                  </span>
                  {tripDay.weather_icon && (
                    <span className="text-[10px] leading-none shrink-0">
                      {tripDay.weather_icon}
                    </span>
                  )}
                </div>

                <div className="mt-auto space-y-0.5 min-w-0">
                  <div className="flex items-center gap-0.5 min-w-0">
                    {isCityChange && (
                      <span className="text-[8px] leading-none shrink-0">
                        ✈️
                      </span>
                    )}
                    <span
                      className="text-[8px] sm:text-[10px] font-semibold truncate leading-tight"
                      style={{ color: cityColor.text }}
                    >
                      {tripDay.place}
                    </span>
                  </div>
                  {stopCount > 0 && (
                    <span
                      className="inline-flex items-center rounded-full px-1 py-px text-[7px] sm:text-[8px] font-bold leading-none text-white"
                      style={{ backgroundColor: cityColor.accent }}
                    >
                      {stopCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
