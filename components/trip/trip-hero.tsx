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

const MAX_ROUTE_CITIES = 4;

export function TripHero({
  name,
  coverImageUrl,
  dateRange,
  totalDays,
  totalStops,
  cities,
  breadcrumbItems,
}: TripHeroProps) {
  const routeLabel = cities.length <= MAX_ROUTE_CITIES
    ? cities.join(" → ")
    : `${cities.slice(0, MAX_ROUTE_CITIES).join(" → ")} + ${cities.length - MAX_ROUTE_CITIES} more`;

  return (
    <div className="relative h-56 sm:h-72 lg:h-80 overflow-hidden bg-muted">
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
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
        <div className="mx-auto max-w-[1200px] px-2">
          <div className="[&_a]:text-white/70 [&_a:hover]:text-white [&_span]:text-white/70 [&_svg]:text-white/50">
            <Breadcrumb items={breadcrumbItems} />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl text-white mt-1.5 sm:mt-2 tracking-tight">
            {name}
          </h1>
          <div className="mt-2 sm:mt-3 flex flex-wrap gap-2 sm:gap-3">
            {dateRange && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm text-white">
                <CalendarIcon className="size-3 sm:size-3.5" />
                {dateRange}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm text-white">
              <MapPinIcon className="size-3 sm:size-3.5" />
              {totalDays} days · {totalStops} stops
            </span>
            {cities.length > 1 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm text-white">
                {routeLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
