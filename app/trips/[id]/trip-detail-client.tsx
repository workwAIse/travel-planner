"use client";

import { useState, useCallback } from "react";
import { ViewSwitcher } from "@/components/trip/view-switcher";
import { DailyView } from "@/components/trip/daily-view";
import { CalendarView } from "@/components/trip/calendar-view";
import { TimelineView } from "@/components/trip/timeline-view";
import { ExtendTripDialog } from "@/components/trip/extend-trip-dialog";
import { DeleteTripButton } from "@/components/trip/delete-trip-button";
import type { TripWithDaysAndPlaces } from "@/lib/db-types";

type Props = {
  trip: TripWithDaysAndPlaces;
};

export function TripDetailClient({ trip }: Props) {
  const [activeView, setActiveView] = useState<"daily" | "calendar" | "timeline">("daily");

  const handleDaySelect = useCallback((dayId: string) => {
    setActiveView("daily");
    setTimeout(() => {
      const el = document.querySelector(`[data-day-id="${dayId}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <ViewSwitcher activeView={activeView} onViewChange={setActiveView} />
        <div className="flex items-center gap-2">
          <DeleteTripButton tripId={trip.id} tripName={trip.name} />
          <ExtendTripDialog
            tripId={trip.id}
            days={trip.days.map((d) => ({
              id: d.id,
              date: d.date,
              place: d.place,
            }))}
          />
        </div>
      </div>

      {activeView === "daily" && <DailyView trip={trip} />}

      {activeView === "calendar" && (
        <CalendarView
          days={trip.days.map((d) => ({
            id: d.id,
            date: d.date,
            place: d.place,
            weather_icon: d.weather_icon,
            weather_high_c: d.weather_high_c,
            weather_low_c: d.weather_low_c,
            places: d.places.map((p) => ({
              id: p.id,
              name: p.name,
              image_url: p.image_url,
            })),
          }))}
          onDaySelect={handleDaySelect}
        />
      )}

      {activeView === "timeline" && (
        <TimelineView
          days={trip.days.map((d) => ({
            id: d.id,
            date: d.date,
            place: d.place,
            theme: d.theme,
            summary: d.summary,
            weather_icon: d.weather_icon,
            weather_high_c: d.weather_high_c,
            weather_low_c: d.weather_low_c,
            places: d.places.map((p) => ({
              id: p.id,
              name: p.name,
              image_url: p.image_url,
              category: p.category,
            })),
          }))}
          onDaySelect={handleDaySelect}
        />
      )}
    </div>
  );
}
