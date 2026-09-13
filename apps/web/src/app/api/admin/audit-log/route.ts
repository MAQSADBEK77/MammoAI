import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { listAdminAuditLog } from "@/server/repo";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    return NextResponse.json({ entries: await listAdminAuditLog() });
  } catch (error) {
    return jsonError(error);
  }
}
