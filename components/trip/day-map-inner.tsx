"use client";

import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type DayMapProps = {
  places: Array<{
    id: string;
    name: string;
    lat: number | null;
    lng: number | null;
    episode: string;
    sort_order: number;
  }>;
  activePlace?: string | null;
  onPlaceClick?: (id: string) => void;
};

const EPISODE_COLORS: Record<string, string> = {
  Morning: "#1F5F61",
  Afternoon: "#C65D3B",
  Evening: "#7c3aed",
};

function getColor(episode: string): string {
  return EPISODE_COLORS[episode] ?? "#6b7280";
}

function createNumberedIcon(
  num: number,
  color: string,
  active: boolean,
): L.DivIcon {
  const size = active ? 36 : 28;
  const fontSize = active ? 14 : 12;
  const border = active ? "3px solid #fff" : "2px solid #fff";
  const shadow = active
    ? "0 0 0 2px rgba(0,0,0,.25), 0 2px 8px rgba(0,0,0,.3)"
    : "0 1px 4px rgba(0,0,0,.3)";

  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:50%;
      border:${border};
      box-shadow:${shadow};
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-weight:700;font-size:${fontSize}px;
      line-height:1;
      cursor:pointer;
    ">${num}</div>`,
  });
}

function AutoFitBounds({
  positions,
  placeIds,
}: {
  positions: L.LatLngExpression[];
  placeIds: string;
}) {
  const map = useMap();
  const prevIds = useRef("");

  useEffect(() => {
    if (positions.length === 0) return;
    if (placeIds === prevIds.current) return;
    prevIds.current = placeIds;

    requestAnimationFrame(() => {
      if (positions.length === 1) {
        const [lat, lng] = positions[0] as [number, number];
        map.setView([lat, lng], 14, { animate: true });
      } else {
        map.fitBounds(L.latLngBounds(positions), {
          padding: [40, 40],
          animate: true,
          maxZoom: 16,
        });
      }
    });
  }, [map, positions, placeIds]);

  return null;
}

export function DayMapInner({
  places,
  activePlace,
  onPlaceClick,
}: DayMapProps) {
  const validPlaces = useMemo(
    () =>
      places
        .filter(
          (p): p is typeof p & { lat: number; lng: number } =>
            p.lat != null && p.lng != null,
        )
        .sort((a, b) => a.sort_order - b.sort_order),
    [places],
  );

  const positions = useMemo<[number, number][]>(
    () => validPlaces.map((p) => [p.lat, p.lng]),
    [validPlaces],
  );

  const placeIds = useMemo(
    () => validPlaces.map((p) => p.id).join(","),
    [validPlaces],
  );

  if (validPlaces.length === 0) {
    return (
      <div className="aspect-square sm:aspect-[16/9] rounded-xl bg-muted flex items-center justify-center text-sm text-muted-foreground">
        No locations to show on the map
      </div>
    );
  }

  return (
    <div className="aspect-square sm:aspect-[16/9] rounded-xl overflow-hidden">
      <MapContainer
        center={positions[0]}
        zoom={13}
        scrollWheelZoom
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <AutoFitBounds positions={positions} placeIds={placeIds} />

        {validPlaces.map((place, idx) => (
          <Marker
            key={`${place.id}-${idx}`}
            position={[place.lat, place.lng]}
            icon={createNumberedIcon(
              idx + 1,
              getColor(place.episode),
              place.id === activePlace,
            )}
            eventHandlers={{
              click: () => onPlaceClick?.(place.id),
            }}
          >
            <Popup>
              <span className="font-medium text-sm">{place.name}</span>
            </Popup>
          </Marker>
        ))}

        <Polyline
          key={placeIds}
          positions={positions}
          pathOptions={{
            color: "#94a3b8",
            weight: 2,
            dashArray: "6 4",
            opacity: 0.7,
          }}
        />
      </MapContainer>
    </div>
  );
}

export default DayMapInner;
