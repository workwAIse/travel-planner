import { EnrichForm } from "@/components/enrich-form";

export default function Home() {
  return (
    <main className="flex-1">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/10 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight">
            Turn your notes into a trip you can see
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Paste your itinerary and we add places, photos, maps, and weather — so you can explore your trip at a glance.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 -mt-8 relative z-10 pb-16">
        <EnrichForm />
      </section>
    </main>
  );
}
