"use client";

import { motion } from "framer-motion";
import { ListIcon, CalendarIcon, GitBranchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewSwitcherProps = {
  activeView: "daily" | "calendar" | "timeline";
  onViewChange: (view: "daily" | "calendar" | "timeline") => void;
};

const views = [
  { id: "daily" as const, label: "Daily", icon: ListIcon },
  { id: "calendar" as const, label: "Calendar", icon: CalendarIcon },
  { id: "timeline" as const, label: "Timeline", icon: GitBranchIcon },
];

export function ViewSwitcher({ activeView, onViewChange }: ViewSwitcherProps) {
  return (
    <div className="inline-flex items-center gap-0.5 sm:gap-1 rounded-lg bg-muted p-0.5 sm:p-1">
      {views.map((view) => {
        const isActive = activeView === view.id;
        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={cn(
              "relative flex items-center gap-1 sm:gap-1.5 rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors",
              isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="view-switcher-active"
                className="absolute inset-0 rounded-md bg-primary"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <view.icon className="relative z-10 size-3.5 sm:size-4" />
            <span className="relative z-10 hidden sm:inline">{view.label}</span>
          </button>
        );
      })}
    </div>
  );
}
