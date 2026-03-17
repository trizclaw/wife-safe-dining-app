import { NextRequest, NextResponse } from "next/server";
import { ingestRestaurantMenu } from "@/lib/restaurant-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let menuUrl: string | undefined;

  try {
    const body = await request.json();
    menuUrl = body?.menuUrl;
  } catch {
    // no-op body optional
  }

  try {
    const result = await ingestRestaurantMenu(id, menuUrl);
    if (!result) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Menu ingestion failed", detail: error instanceof Error ? error.message : String(error) },
      { status: 400 }
    );
  }
}
