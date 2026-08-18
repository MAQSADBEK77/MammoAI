import { NextResponse } from "next/server";
import { getAuditLog } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { handleApiError } from "@/server/api-utils";

// Full-admin only — a moderator seeing exactly what other admins/moderators
// have been doing is more visibility than "view-only" should grant.
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ entries: getAuditLog() });
  } catch (err) {
    return handleApiError(err);
  }
}
