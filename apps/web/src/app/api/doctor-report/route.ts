import { NextResponse, type NextRequest } from "next/server";
import { ApiError, jsonError, requireRegisteredUser } from "@/server/api-utils";
import { buildDoctorReport, tashkentDateStr } from "@mammoai/shared";
import { getOnboardingProfile, hasPremiumAccess, listChecklistItems, listCycleLogs } from "@/server/repo";

/** REPORT-01 — shifokor qabuliga olib boriladigan xulosa.
 *
 * Premium: bu Flo'da ham pullik va bizning tahlilimizga ko'ra eng yuqori
 * qiymat beradigan funksiya (docs/raqobatchilar-va-premium.md). Asosiy
 * halqa — tekshiruvni belgilash — bepul qoladi (PAYWALL-01). */
const HISTORY_DAYS = 365;

export async function GET(request: NextRequest) {
  try {
    // AUTH-05: avval hisob, keyin Premium — "Premium kerak" degan xabar
    // hisobsiz odamga tushunarsiz bo'lardi (nimaga to'layman, qayerga?).
    const user = await requireRegisteredUser(request, "doctor-report");
    if (!(await hasPremiumAccess(user.id))) {
      throw new ApiError(402, "Shifokor uchun hisobot Premium funksiya", "premium_required");
    }
    const [profile, logs, checklist] = await Promise.all([
      getOnboardingProfile(user.id),
      listCycleLogs(user.id, HISTORY_DAYS),
      listChecklistItems(user.id),
    ]);
    const report = buildDoctorReport({
      today: tashkentDateStr(),
      profile,
      logs,
      checklist,
      summary: null,
    });
    return NextResponse.json({ report, name: user.name });
  } catch (error) {
    return jsonError(error);
  }
}
