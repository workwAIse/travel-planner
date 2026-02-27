"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CompassIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_ITEMS = [
  { href: "/trips", label: "Trips" },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <CompassIcon className="size-6 text-primary" strokeWidth={1.75} />
          <span className="font-display text-lg italic tracking-tight">
            roam
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-[10px] px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <ThemeToggle />
          <Button size="sm" asChild className="ml-1 rounded-[14px]">
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
