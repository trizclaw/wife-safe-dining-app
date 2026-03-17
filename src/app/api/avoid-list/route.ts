import { NextResponse } from "next/server";
import { AVOID_LIST, AVOID_LIST_LAST_UPDATED } from "@/lib/avoid-list";
import { AvoidListResponse } from "@/lib/types";

export async function GET() {
  const body: AvoidListResponse = {
    items: AVOID_LIST,
    lastUpdated: AVOID_LIST_LAST_UPDATED,
  };
  return NextResponse.json(body);
}
