import Link from "next/link";
import { EnrichForm } from "@/components/enrich-form";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-4 py-3 flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">Itinerary Enricher</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/trips">My trips</Link>
        </Button>
      </header>
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">New itinerary</h2>
            <p className="text-muted-foreground mt-1">
              Paste your raw itinerary text below. We’ll parse it, add coordinates and photos, then save it to your trips.
            </p>
          </div>
          <EnrichForm />
        </div>
      </main>
    </div>
  );
}
