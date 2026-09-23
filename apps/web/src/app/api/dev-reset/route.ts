import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { sql, ensureSchema } from "@/server/db";

/**
 * DEV-RESET — test akkauntni onboardingdan boshlanadigan holatga qaytaradi.
 *
 * Nega kerak: onboarding oqimini sinash uchun har safar profilni qo'lda
 * (SQL orqali) o'chirishga to'g'ri kelardi — bu sekin, takrorlanuvchi va
 * xato qilish oson bo'lgan ish, ustiga u production bazasiga qo'lda
 * yozishni talab qilardi. Endi bitta manzil.
 *
 * XAVFSIZLIK — `dev-login` bilan bir xil uch qatlamli himoya:
 *   1) `NODE_ENV !== "development"` bo'lsa 404 (Vercel build har doim
 *      "production", ya'ni bu yo'l jonli saytda UMUMAN mavjud emas);
 *   2) faqat `is_test_account = TRUE` bo'lgan hisob — shart SQL'ning
 *      O'ZIDA, ya'ni haqiqiy foydalanuvchi hech qachon tegilmaydi;
 *   3) telefon raqami ham aniq belgilangan (dev-login bilan bir xil).
 *
 * O'CHIRILADIGAN ma'lumot: faqat onboarding qayta yaratadigan narsalar.
 * Hisobning O'ZI (users qatori) va sessiya saqlanadi — aks holda qayta
 * kirishga to'g'ri kelardi.
 */
const TEST_PHONE = "+998000000000";

export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== "development") {
      return new NextResponse(null, { status: 404 });
    }
    await ensureSchema();

    const rows = (await sql`
      SELECT id FROM users WHERE phone = ${TEST_PHONE} AND is_test_account = TRUE
    `) as unknown as { id: string }[];
    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: "Test akkaunt topilmadi" }, { status: 404 });
    }

    // Tartib MUHIM emas (hammasi user_id bo'yicha), lekin checklist_items'ga
    // referral_events ishora qilishi mumkin — u endi ON DELETE SET NULL
    // (CHECKLIST-PRUNE-01), shuning uchun to'sqinlik qilmaydi.
    const deleted = {
      cycleLogs: (await sql`DELETE FROM cycle_logs WHERE user_id = ${user.id} RETURNING id`).length,
      checklist: (await sql`DELETE FROM checklist_items WHERE user_id = ${user.id} RETURNING id`).length,
      cycleSettings: (await sql`DELETE FROM cycle_settings WHERE user_id = ${user.id} RETURNING user_id`).length,
      pregnancy: (await sql`DELETE FROM pregnancy_profiles WHERE user_id = ${user.id} RETURNING user_id`).length,
      onboarding: (await sql`DELETE FROM onboarding_profiles WHERE user_id = ${user.id} RETURNING user_id`).length,
    };

    // `?next=` berilsa o'sha yerga, bo'lmasa onboardingga.
    const requestedNext = request.nextUrl.searchParams.get("next");
    const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/onboarding";
    if (request.nextUrl.searchParams.get("json") === "1") {
      return NextResponse.json({ ok: true, userId: user.id, deleted });
    }
    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    return jsonError(error);
  }
}
