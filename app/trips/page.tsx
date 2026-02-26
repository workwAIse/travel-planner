import Link from "next/link";
import { getTrips } from "@/lib/get-trips";
import { MapPinIcon, CalendarIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const trips = await getTrips();

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl tracking-tight">My Trips</h1>
        </div>

        {trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
              <MapPinIcon className="size-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Your next adventure starts here</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Create a trip from your notes and we'll add places, photos, and maps.
            </p>
            <Button asChild>
              <Link href="/">
                <PlusIcon className="size-4 mr-1" />
                Create your first trip
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => {
              const dateRange = formatDateRange(trip.start_date, trip.end_date);
              return (
                <Link
                  key={trip.id}
                  href={`/trips/${trip.id}`}
                  className="group block overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-muted">
                    {trip.cover_image_url ? (
                      <img
                        src={trip.cover_image_url}
                        alt=""
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <MapPinIcon className="size-10 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                      {trip.name}
                    </h2>
                    {dateRange && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CalendarIcon className="size-3.5" />
                        {dateRange}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start) return null;
  const s = new Date(start + "T00:00:00");
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (!end || start === end) return fmt(s);
  const e = new Date(end + "T00:00:00");
  const sameYear = s.getFullYear() === e.getFullYear();
  const endFmt = sameYear
    ? fmt(e)
    : e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(s)} – ${endFmt}, ${e.getFullYear()}`;
}
