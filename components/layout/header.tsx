"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPinIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/trips", label: "Trips" },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MapPinIcon className="size-4" />
          </div>
          <span className="font-display text-lg font-normal tracking-tight">
            Travel Planner
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <Button size="sm" asChild className="ml-2">
            <Link href="/">
              <PlusIcon className="size-4 mr-1" />
              New Trip
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
