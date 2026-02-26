"use client";

import { useState, useCallback, useOptimistic, useTransition } from "react";
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
import { ClockIcon } from "lucide-react";
import { DaySelector } from "./day-selector";
import { SortablePlaceCard } from "./sortable-place-card";
import { WeatherWidget } from "./weather-widget";
import { DayMap } from "./day-map";
import { reorderPlaces } from "@/app/actions";
import type { Day, Place } from "@/lib/db-types";

type DailyViewProps = {
  days: (Day & { places: Place[] })[];
};

export function DailyView({ days }: DailyViewProps) {
  const [activeDayId, setActiveDayId] = useState(days[0]?.id ?? "");
  const [activePlace, setActivePlace] = useState<string | null>(null);

  const activeDay = days.find((d) => d.id === activeDayId) ?? days[0];
  if (!activeDay) return null;

  const dayIndex = days.findIndex((d) => d.id === activeDay.id);

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
        onDaySelect={setActiveDayId}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <DayContent
          day={activeDay}
          dayNumber={dayIndex + 1}
          activePlace={activePlace}
          onPlaceSelect={setActivePlace}
        />

        <div className="lg:sticky lg:top-20 lg:self-start space-y-4">
          <DayMap
            places={activeDay.places.map((p) => ({
              id: p.id,
              name: p.name,
              lat: p.lat,
              lng: p.lng,
              episode: p.episode,
              sort_order: p.sort_order,
            }))}
            activePlace={activePlace}
            onPlaceClick={setActivePlace}
          />
        </div>
      </div>
    </div>
  );
}

function DayContent({
  day,
  dayNumber,
  activePlace,
  onPlaceSelect,
}: {
  day: Day & { places: Place[] };
  dayNumber: number;
  activePlace: string | null;
  onPlaceSelect: (id: string) => void;
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
    <div className="space-y-6">
      <div className="space-y-1">
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
        <p className="text-sm font-medium text-muted-foreground">{day.place}</p>
        {day.theme && (
          <p className="text-sm text-muted-foreground">{day.theme}</p>
        )}
        {day.summary && (
          <p className="text-sm mt-1">{day.summary}</p>
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
                if (places.length === 0) return null;
                const startIndex = globalIndex;
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
                        />
                      ))}
                    </div>
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
