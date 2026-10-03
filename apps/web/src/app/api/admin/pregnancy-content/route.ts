import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { listPregnancyWeekContentAllLanguages } from "@/server/repo";

/** CONTENT-001: barcha 42 haftalik yozuv (kiritilmagan haftalar ro'yxatda yo'q). */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    // PREG-I18N: admin uchta tilni ham ko'radi va tahrirlaydi.
    return NextResponse.json({ weeks: await listPregnancyWeekContentAllLanguages() });
  } catch (error) {
    return jsonError(error);
  }
}
