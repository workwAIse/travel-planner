"use server";

import { decodeWmo } from "./weather-utils";

export type DayWeather = {
  highC: number;
  lowC: number;
  condition: string;
  icon: string;
};

export async function fetchWeather(
  lat: number,
  lng: number,
  date: string
): Promise<DayWeather | null> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lng));
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,weather_code");
    url.searchParams.set("start_date", date);
    url.searchParams.set("end_date", date);
    url.searchParams.set("timezone", "auto");

    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = (await res.json()) as {
      daily?: {
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        weather_code?: number[];
      };
    };

    const daily = data.daily;
    if (!daily) return null;

    const highC = daily.temperature_2m_max?.[0] ?? null;
    const lowC = daily.temperature_2m_min?.[0] ?? null;
    const weatherCode = daily.weather_code?.[0] ?? 0;

    if (highC === null || lowC === null) return null;

    const { condition, icon } = decodeWmo(weatherCode);
    return { highC, lowC, condition, icon };
  } catch {
    return null;
  }
}

export async function fetchWeatherBatch(
  locations: { lat: number; lng: number; date: string }[]
): Promise<(DayWeather | null)[]> {
  const results: (DayWeather | null)[] = [];
  for (const loc of locations) {
    const weather = await fetchWeather(loc.lat, loc.lng, loc.date);
    results.push(weather);
  }
  return results;
}
