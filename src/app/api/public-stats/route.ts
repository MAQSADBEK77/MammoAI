import { NextResponse } from "next/server";
import { getPublicCommunityStats } from "@/server/db";

// Public, aggregate-only counts for the landing page's "community" section —
// no per-user data, just totals.
export async function GET() {
  return NextResponse.json(getPublicCommunityStats());
}
