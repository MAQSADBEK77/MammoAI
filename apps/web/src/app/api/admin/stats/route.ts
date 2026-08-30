import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { getAdminStats } from "@/server/repo";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    return NextResponse.json(await getAdminStats());
  } catch (error) {
    return jsonError(error);
  }
}
