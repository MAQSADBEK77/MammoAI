import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { getLiveActivity } from "@/server/repo";

/** LIVE-01: jonli faollik oqimi. Faqat o'qish, hech narsa o'zgartirmaydi. */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 80);
    return NextResponse.json(await getLiveActivity(Math.min(Math.max(limit, 10), 200)));
  } catch (error) {
    return jsonError(error);
  }
}
