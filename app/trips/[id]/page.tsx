import Link from "next/link";
import { notFound } from "next/navigation";
import { getTripById } from "@/lib/get-trips";

export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Day, Place } from "@/lib/db-types";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trip = await getTripById(id);
  if (!trip) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-4 py-3 flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold truncate">{trip.name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/trips">Trips</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">New itinerary</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {trip.days.map((day) => (
            <DayCard key={day.id} day={day} />
          ))}
        </div>
      </main>
    </div>
  );
}

function DayCard({ day }: { day: Day & { places: Place[] } }) {
  const dateStr = new Date(day.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const episodeOrder = Array.isArray(day.episode_order)
    ? (day.episode_order as string[])
    : ["Morning", "Afternoon", "Evening"];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{dateStr} – {day.place}</CardTitle>
        {day.theme && (
          <p className="text-sm text-muted-foreground">Theme: {day.theme}</p>
        )}
        {day.summary && (
          <p className="text-sm mt-1">{day.summary}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {episodeOrder.map((ep) => {
          const places = day.places.filter((p) => p.episode === ep);
          if (places.length === 0) return null;
          return (
            <section key={ep} className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">{ep}</h3>
              <ul className="space-y-4">
                {places.map((p) => (
                  <PlaceRow key={p.id} place={p} />
                ))}
              </ul>
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}

function PlaceRow({ place }: { place: Place }) {
  return (
    <li className="flex gap-4 rounded-lg border p-3">
      {place.image_url ? (
        <a
          href={place.google_maps_url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <img
            src={place.image_url}
            alt=""
            className="size-20 rounded-md object-cover"
          />
        </a>
      ) : (
        <div className="size-20 shrink-0 rounded-md bg-muted" />
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={place.google_maps_url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:underline"
          >
            {place.name}
          </a>
          {(place.lat != null || place.lng != null) && (
            <Badge variant="secondary" className="text-xs">
              {place.lat?.toFixed(4)}, {place.lng?.toFixed(4)}
            </Badge>
          )}
        </div>
        {place.details && (
          <div className="space-y-0.5">
            {place.details.split("\n").map((line, i) => (
              <p
                key={i}
                className={i === 0 ? "text-sm" : "text-sm text-muted-foreground"}
              >
                {line}
              </p>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}
