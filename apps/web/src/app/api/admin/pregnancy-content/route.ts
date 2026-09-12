import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { listPregnancyWeekContent } from "@/server/repo";

/** CONTENT-001: barcha 42 haftalik yozuv (kiritilmagan haftalar ro'yxatda yo'q). */
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    return NextResponse.json({ weeks: await listPregnancyWeekContent() });
  } catch (error) {
    return jsonError(error);
  }
}
