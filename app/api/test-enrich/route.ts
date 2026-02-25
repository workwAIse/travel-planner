import { NextResponse } from "next/server";
import { enrichAndSaveTrip } from "@/app/actions";
import { getTripById } from "@/lib/get-trips";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SAMPLE = {
  tripName: "Vietnam 2026",
  rawText: `2026-03-13 – Ho Chi Minh City

Theme: Arrival + Architecture Axis

Afternoon: Arrival and check-in
Location: District 1, Ho Chi Minh City, Vietnam
Google Maps: https://www.google.com/maps/search/?api=1&query=District+1+Ho+Chi+Minh+City+Vietnam

Nguyễn Huệ Walking Street
Location: Nguyen Hue Walking Street, Ho Chi Minh City, Vietnam
Google Maps: https://www.google.com/maps/search/?api=1&query=Nguyen+Hue+Walking+Street+Ho+Chi+Minh+City

Café Apartment
Location: 42 Nguyen Hue Apartment Building, Ho Chi Minh City, Vietnam
Google Maps: https://www.google.com/maps/search/?api=1&query=42+Nguyen+Hue+Apartment+Building+Ho+Chi+Minh+City

Đồng Khởi Street
Location: Dong Khoi Street, Ho Chi Minh City, Vietnam
Google Maps: https://www.google.com/maps/search/?api=1&query=Dong+Khoi+Street+Ho+Chi+Minh+City

Evening street food (District 1 or 3)

Optional: Yoko Café (live music)
Location: Yoko Cafe, 22A Nguyen Thi Dieu, District 3, Ho Chi Minh City
Google Maps: https://www.google.com/maps/search/?api=1&query=Yoko+Cafe+22A+Nguyen+Thi+Dieu+District+3+Ho+Chi+Minh+City`,
};

export async function POST() {
  const result = await enrichAndSaveTrip(SAMPLE.rawText, SAMPLE.tripName);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  const trip = await getTripById(result.tripId);
  return NextResponse.json({
    ok: true,
    tripId: result.tripId,
    trip: trip
      ? {
          name: trip.name,
          days: trip.days.map((d) => ({
            date: d.date,
            place: d.place,
            theme: d.theme,
            summary: d.summary,
            placesCount: d.places.length,
            places: d.places.map((p) => ({
              name: p.name,
              episode: p.episode,
              lat: p.lat,
              lng: p.lng,
              hasImage: !!p.image_url,
              google_maps_url: p.google_maps_url ? "(set)" : null,
            })),
          })),
        }
      : null,
  });
}
