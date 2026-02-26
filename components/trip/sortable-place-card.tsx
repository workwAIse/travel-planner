"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PlaceCard, type PlaceCardData } from "./place-card";

type SortablePlaceCardProps = {
  place: PlaceCardData;
  index: number;
  isActive?: boolean;
  onSelect?: () => void;
  dayId?: string;
};

export function SortablePlaceCard({
  place,
  index,
  isActive,
  onSelect,
  dayId,
}: SortablePlaceCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: place.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <PlaceCard
        place={place}
        index={index}
        isActive={isActive}
        onSelect={onSelect}
        dragHandleProps={{ ...attributes, ...listeners }}
        dayId={dayId}
      />
    </div>
  );
}
