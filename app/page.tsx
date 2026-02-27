import Link from "next/link";
import { EnrichForm } from "@/components/enrich-form";
import { getTrips } from "@/lib/get-trips";
import { CalendarIcon, ArrowRightIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  let recentTrips: Awaited<ReturnType<typeof getTrips>> = [];
  try {
    const all = await getTrips();
    recentTrips = all.slice(0, 3);
  } catch {
    // Supabase may not be configured; show page without recent trips
  }

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/10 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight italic">
            Turn your notes into a trip you can see
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Paste your itinerary and we add places, photos, maps, and weather — so you can explore your trip at a glance.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[640px] px-4 sm:px-6 -mt-8 relative z-10 pb-16">
        <EnrichForm />

        {recentTrips.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent trips</h2>
              <Link
                href="/trips"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                View all <ArrowRightIcon className="size-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {recentTrips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/trips/${trip.id}`}
                  className="group block overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-muted">
                    {trip.cover_image_url ? (
                      <img
                        src={trip.cover_image_url}
                        alt={trip.name}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                        <CalendarIcon className="size-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                      {trip.name}
                    </h3>
                    {trip.start_date && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateRange(trip.start_date, trip.end_date)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
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
  return `${fmt(s)} – ${fmt(e)}, ${e.getFullYear()}`;
}
