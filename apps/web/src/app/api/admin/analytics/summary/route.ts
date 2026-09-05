import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { getAnalyticsSummary } from "@/server/repo";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get("days") ?? 14);
    return NextResponse.json(await getAnalyticsSummary(days));
  } catch (error) {
    return jsonError(error);
  }
}
