import { CalendarIcon, MapPinIcon } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";

type TripHeroProps = {
  name: string;
  coverImageUrl: string | null;
  dateRange: string | null;
  totalDays: number;
  totalStops: number;
  cities: string[];
  breadcrumbItems: { label: string; href?: string }[];
};

export function TripHero({
  name,
  coverImageUrl,
  dateRange,
  totalDays,
  totalStops,
  cities,
  breadcrumbItems,
}: TripHeroProps) {
  return (
    <div className="relative h-64 sm:h-80 overflow-hidden bg-muted">
      {coverImageUrl ? (
        <img
          src={coverImageUrl}
          alt=""
          className="size-full object-cover"
        />
      ) : (
        <div className="size-full bg-gradient-to-br from-primary/20 to-accent/10" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="[&_a]:text-white/70 [&_a:hover]:text-white [&_span]:text-white/70 [&_svg]:text-white/50">
            <Breadcrumb items={breadcrumbItems} />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-white mt-2 tracking-tight">
            {name}
          </h1>
          <div className="mt-3 flex flex-wrap gap-3">
            {dateRange && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-sm text-white">
                <CalendarIcon className="size-3.5" />
                {dateRange}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-sm text-white">
              <MapPinIcon className="size-3.5" />
              {totalDays} days · {totalStops} stops
            </span>
            {cities.length > 1 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-sm text-white">
                {cities.join(" → ")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
