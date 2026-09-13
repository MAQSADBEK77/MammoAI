import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { listOpenCommunityReports } from "@/server/repo";

/** COMM-001: moderatsiya navbati — faqat hali ko'rib chiqilmagan shikoyatlar. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    return NextResponse.json({ reports: await listOpenCommunityReports() });
  } catch (error) {
    return jsonError(error);
  }
}
