"use client";

import { cn } from "@/lib/utils";

type AILoaderProps = {
  /** Text to animate letter-by-letter (e.g. "Generating", "Parsing itinerary") */
  text?: string;
  className?: string;
};

const DEFAULT_TEXT = "Generating";

export function AILoader({ text = DEFAULT_TEXT, className }: AILoaderProps) {
  const letters = text.split("");

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="loader-wrapper">
        {letters.map((letter, i) => (
          <span
            key={i}
            className="loader-letter"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {letter}
          </span>
        ))}
        <div className="loader" aria-hidden />
      </div>
    </div>
  );
}
