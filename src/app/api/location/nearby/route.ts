import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CENTER } from "@/lib/geo";
import { NearbyResponse } from "@/lib/types";
import { getNearbyRestaurants } from "@/lib/restaurant-service";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = parseFloat(params.get("lat") ?? String(DEFAULT_CENTER.lat));
  const lng = parseFloat(params.get("lng") ?? String(DEFAULT_CENTER.lng));
  const radius = parseFloat(params.get("radius") ?? "10");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: "Invalid lat/lng" }, { status: 400 });
  }

  try {
    const result = await getNearbyRestaurants(lat, lng, radius);
    const body: NearbyResponse = {
      restaurants: result.restaurants,
      center: { lat, lng },
      radiusMiles: radius,
      dataMeta: result.dataMeta,
    };
    return NextResponse.json(body);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load nearby restaurants", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
