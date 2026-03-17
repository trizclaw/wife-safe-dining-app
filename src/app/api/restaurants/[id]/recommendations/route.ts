import { NextRequest, NextResponse } from "next/server";
import { RecommendationsResponse } from "@/lib/types";
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
  const body: RecommendationsResponse = {
    restaurantId: restaurant.id,
    safeOptions: restaurant.safeOptions,
    requiredModifications: restaurant.requiredModifications,
    riskNotes: restaurant.riskNotes,
  };
  return NextResponse.json({ ...body, menuDataMeta: restaurant.menuDataMeta });
}
