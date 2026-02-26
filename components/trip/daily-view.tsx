"use client";

import { useState, useEffect, useCallback, useOptimistic, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { toast } from "sonner";
import { ClockIcon, MapIcon, XIcon } from "lucide-react";
import { DaySelector } from "./day-selector";
import { SortablePlaceCard } from "./sortable-place-card";
import { AddStopDialog } from "./add-stop-dialog";
import { TripStats } from "./trip-stats";
import { WeatherWidget } from "./weather-widget";
import { DayMap } from "./day-map";
import { Button } from "@/components/ui/button";
import { reorderPlaces } from "@/app/actions";
import type { Day, Place, TripWithDaysAndPlaces } from "@/lib/db-types";

type DailyViewProps = {
  trip: TripWithDaysAndPlaces;
};

export function DailyView({ trip }: DailyViewProps) {
  const days = trip.days;
  const [activeDayId, setActiveDayId] = useState(days[0]?.id ?? "");
  const [activePlace, setActivePlace] = useState<string | null>(null);
  const [showMobileMap, setShowMobileMap] = useState(false);
  const [mapPlaces, setMapPlaces] = useState<Place[] | null>(null);

  useEffect(() => {
    setMapPlaces(null);
  }, [trip]);

  const activeDay = days.find((d) => d.id === activeDayId) ?? days[0];
  if (!activeDay) return null;

  const dayIndex = days.findIndex((d) => d.id === activeDay.id);
  const placesForMap = (mapPlaces ?? activeDay.places).map((p, i) => ({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    episode: p.episode,
    sort_order: i,
  }));

  return (
    <div className="space-y-6">
      <DaySelector
        days={days.map((d, i) => ({
          id: d.id,
          date: d.date,
          place: d.place,
          dayNumber: i + 1,
        }))}
        activeDayId={activeDay.id}
        onDaySelect={(id) => { setActiveDayId(id); setMapPlaces(null); }}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <DayContent
          day={activeDay}
          dayNumber={dayIndex + 1}
          activePlace={activePlace}
          onPlaceSelect={setActivePlace}
          onPlacesReorder={setMapPlaces}
        />

        <div className="hidden lg:block space-y-4">
          <div className="lg:sticky lg:top-20 space-y-4">
            <DayMap places={placesForMap} activePlace={activePlace} onPlaceClick={setActivePlace} />
            <TripStats trip={trip} />
          </div>
        </div>
      </div>

      {/* Mobile map FAB */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <Button
          size="lg"
          className="rounded-full shadow-lg size-14"
          onClick={() => setShowMobileMap(true)}
        >
          <MapIcon className="size-5" />
          <span className="sr-only">Show map</span>
        </Button>
      </div>

      {/* Mobile map overlay */}
      {showMobileMap && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Day {dayIndex + 1} Map</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowMobileMap(false)}>
              <XIcon className="size-5" />
              <span className="sr-only">Close map</span>
            </Button>
          </div>
          <div className="flex-1 p-4">
            <DayMap
              places={placesForMap}
              activePlace={activePlace}
              onPlaceClick={(id) => {
                setActivePlace(id);
                setShowMobileMap(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DayContent({
  day,
  dayNumber,
  activePlace,
  onPlaceSelect,
  onPlacesReorder,
}: {
  day: Day & { places: Place[] };
  dayNumber: number;
  activePlace: string | null;
  onPlaceSelect: (id: string) => void;
  onPlacesReorder?: (places: Place[]) => void;
}) {
  const [optimisticPlaces, setOptimisticPlaces] = useOptimistic(day.places);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const episodeOrder = Array.isArray(day.episode_order)
    ? (day.episode_order as string[])
    : ["Morning", "Afternoon", "Evening"];

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = optimisticPlaces.findIndex((p) => p.id === active.id);
      const newIndex = optimisticPlaces.findIndex((p) => p.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(optimisticPlaces, oldIndex, newIndex);
      const newIds = reordered.map((p) => p.id);

      startTransition(async () => {
        setOptimisticPlaces(reordered);
        onPlacesReorder?.(reordered);
        const result = await reorderPlaces(day.id, newIds);
        if (!result.ok) {
          toast.error(result.error);
        }
      });
    },
    [optimisticPlaces, day.id, setOptimisticPlaces, startTransition]
  );

  const dateStr = new Date(day.date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 min-w-0">
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-xl font-semibold">
            Day {dayNumber} · {dateStr}
          </h2>
          <WeatherWidget
            icon={day.weather_icon}
            condition={day.weather_condition}
            highC={day.weather_high_c}
            lowC={day.weather_low_c}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">{day.place}</span>
          {day.theme && (
            <>
              <span>·</span>
              <span className="italic">{day.theme}</span>
            </>
          )}
        </div>
        {day.summary && (
          <p className="text-sm leading-relaxed max-w-prose">{day.summary}</p>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={optimisticPlaces.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-6">
            {(() => {
              let globalIndex = 0;
              return episodeOrder.map((ep) => {
                const places = optimisticPlaces.filter((p) => p.episode === ep);
                const startIndex = globalIndex;
                if (places.length === 0) {
                  return (
                    <section key={ep} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="size-3.5 text-muted-foreground" />
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          {ep}
                        </h3>
                      </div>
                      <AddStopDialog dayId={day.id} episode={ep} city={day.place} />
                    </section>
                  );
                }
                globalIndex += places.length;
                return (
                  <section key={ep} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="size-3.5 text-muted-foreground" />
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {ep}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {places.map((place, i) => (
                        <SortablePlaceCard
                          key={place.id}
                          place={place}
                          index={startIndex + i}
                          isActive={activePlace === place.id}
                          onSelect={() => onPlaceSelect(place.id)}
                          dayId={day.id}
                        />
                      ))}
                    </div>
                    <AddStopDialog dayId={day.id} episode={ep} city={day.place} />
                  </section>
                );
              });
            })()}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
