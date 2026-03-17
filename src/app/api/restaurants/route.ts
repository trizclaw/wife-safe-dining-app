import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CENTER } from "@/lib/geo";
import { getNearbyRestaurants } from "@/lib/restaurant-service";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = parseFloat(params.get("lat") ?? String(DEFAULT_CENTER.lat));
  const lng = parseFloat(params.get("lng") ?? String(DEFAULT_CENTER.lng));
  const radius = parseFloat(params.get("radius") ?? "15");

  const result = await getNearbyRestaurants(lat, lng, radius);
  return NextResponse.json({ restaurants: result.restaurants, dataMeta: result.dataMeta });
}
