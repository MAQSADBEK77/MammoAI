import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { getPremiumInterestSummary } from "@/server/repo";

/** PRICE-SIGNAL-01 — narxni ko'rgan ayollarning javoblari. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    return NextResponse.json(await getPremiumInterestSummary());
  } catch (error) {
    return jsonError(error);
  }
}
