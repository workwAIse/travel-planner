import { notFound } from "next/navigation";
import { getTripById } from "@/lib/get-trips";
import { TripHero } from "@/components/trip/trip-hero";
import { TripDetailClient } from "./trip-detail-client";

export const dynamic = "force-dynamic";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trip = await getTripById(id);
  if (!trip) notFound();

  const totalPlaces = trip.days.reduce((sum, d) => sum + d.places.length, 0);
  const cities = [...new Set(trip.days.map((d) => d.place))];
  const startDate = trip.days[0]?.date;
  const endDate = trip.days[trip.days.length - 1]?.date;
  const dateRange = formatDateRange(startDate, endDate);

  return (
    <main className="flex-1">
      <TripHero
        name={trip.name}
        coverImageUrl={trip.cover_image_url}
        dateRange={dateRange}
        totalDays={trip.days.length}
        totalStops={totalPlaces}
        cities={cities}
        breadcrumbItems={[
          { label: "Trips", href: "/trips" },
          { label: trip.name },
        ]}
      />

      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6">
        <TripDetailClient trip={trip} />
      </div>
    </main>
  );
}

function formatDateRange(start?: string, end?: string): string | null {
  if (!start) return null;
  const s = new Date(start + "T00:00:00");
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (!end || start === end) return fmt(s);
  const e = new Date(end + "T00:00:00");
  return `${fmt(s)} – ${fmt(e)}, ${e.getFullYear()}`;
}
