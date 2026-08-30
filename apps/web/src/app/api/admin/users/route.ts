import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { listUsersAdmin } from "@/server/repo";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const limit = Number(searchParams.get("limit") ?? 50);
    const offset = Number(searchParams.get("offset") ?? 0);
    return NextResponse.json(await listUsersAdmin({ search, limit, offset }));
  } catch (error) {
    return jsonError(error);
  }
}
