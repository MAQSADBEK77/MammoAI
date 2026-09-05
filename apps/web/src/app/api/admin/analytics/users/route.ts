import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { listAnalyticsUsersAdmin } from "@/server/repo";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const limit = Number(searchParams.get("limit") ?? 30);
    const offset = Number(searchParams.get("offset") ?? 0);
    return NextResponse.json(await listAnalyticsUsersAdmin({ search, limit, offset }));
  } catch (error) {
    return jsonError(error);
  }
}
