import { NextRequest, NextResponse } from "next/server";
import { getRestaurantDetail } from "@/lib/restaurant-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const restaurant = await getRestaurantDetail(id);
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }
  return NextResponse.json(restaurant);
}
