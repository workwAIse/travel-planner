import Link from "next/link";
import { getTrips } from "@/lib/get-trips";

export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default async function TripsPage() {
  const trips = await getTrips();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-4 py-3 flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">My trips</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/">New itinerary</Link>
        </Button>
      </header>
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-8">
        {trips.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            No trips yet. Create one from the home page by pasting an itinerary and clicking Enrich.
          </p>
        ) : (
          <ul className="space-y-3">
            {trips.map((t) => (
              <li key={t.id}>
                <Card className="transition-colors hover:bg-muted/50">
                  <Link href={`/trips/${t.id}`}>
                    <CardHeader className="py-4">
                      <h2 className="font-semibold">{t.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString()}
                      </p>
                    </CardHeader>
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
