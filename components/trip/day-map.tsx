import dynamic from "next/dynamic";

export type { DayMapProps } from "./day-map-inner";

export const DayMap = dynamic(
  () => import("./day-map-inner").then((m) => m.DayMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-square sm:aspect-[16/9] rounded-xl bg-muted animate-pulse flex items-center justify-center text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  },
);

export default DayMap;
