"use client";

type WeatherWidgetProps = {
  icon: string | null;
  condition: string | null;
  highC: number | null;
  lowC: number | null;
};

export function WeatherWidget({
  icon,
  condition,
  highC,
  lowC,
}: WeatherWidgetProps) {
  if (highC == null && lowC == null) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
      title={condition ?? undefined}
    >
      {icon && <span>{icon}</span>}
      <span>
        {highC != null && `${Math.round(highC)}°`}
        {highC != null && lowC != null && " / "}
        {lowC != null && `${Math.round(lowC)}°`}
      </span>
    </span>
  );
}
