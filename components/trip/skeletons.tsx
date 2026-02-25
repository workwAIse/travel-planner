"use client";

export function TripHeroSkeleton() {
  return (
    <div className="relative h-64 sm:h-80 animate-pulse bg-muted">
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="mx-auto max-w-6xl space-y-3">
          <div className="h-3 w-40 rounded-full bg-muted-foreground/20" />
          <div className="h-8 w-64 rounded-lg bg-muted-foreground/20" />
          <div className="flex gap-3">
            <div className="h-7 w-28 rounded-full bg-muted-foreground/20" />
            <div className="h-7 w-36 rounded-full bg-muted-foreground/20" />
            <div className="h-7 w-32 rounded-full bg-muted-foreground/20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DaySelectorSkeleton() {
  return (
    <div className="flex gap-2 overflow-hidden pb-1">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="shrink-0 h-16 w-[60px] animate-pulse rounded-lg bg-muted"
        />
      ))}
    </div>
  );
}

export function PlaceCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-xl border bg-card p-3">
      <div className="shrink-0 w-28 aspect-[4/3] animate-pulse rounded-lg bg-muted" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 py-0.5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export function DayViewSkeleton() {
  return (
    <div className="space-y-6">
      <DaySelectorSkeleton />
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-3">
          <PlaceCardSkeleton />
          <PlaceCardSkeleton />
          <PlaceCardSkeleton />
        </div>
        <div className="animate-pulse rounded-xl bg-muted aspect-[16/9] lg:sticky lg:top-20 lg:self-start" />
      </div>
    </div>
  );
}

export function TripCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="aspect-[16/10] animate-pulse bg-muted" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
