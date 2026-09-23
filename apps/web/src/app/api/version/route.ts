import { NextResponse } from "next/server";

/**
 * DEPLOY-01 — jonli versiyani tekshirish.
 *
 * Muammo (2026-09-22, bir necha marta takrorlangan): "o'zgarishlar mini app'da
 * ko'rinmayapti" degan holatda sabab nima ekanini aniqlash imkoni yo'q edi —
 * deploy yiqildimi, `main`ga chiqmadimi, yoki shunchaki brauzer keshimi?
 * Har safar taxmin qilishga to'g'ri kelardi.
 *
 * Endi shu manzil JONLI serverdagi commit'ni aytadi. Telefonda ochib,
 * `commit` qiymatini `git log` bilan solishtirish kifoya:
 *   • mos kelsa  → deploy o'tgan, muammo KESHDA (ilovani butunlay yopib oching);
 *   • mos kelmasa → deploy o'tmagan yoki hali ketyapti.
 *
 * Maxfiy ma'lumot yo'q: commit SHA'si va vaqt allaqachon ochiq repoda.
 *
 * SESSION-SECRET-01: `config` bloki muhim muhit o'zgaruvchilari QO'YILGANMI
 * yoki yo'qligini aytadi — QIYMATLARNI emas, faqat bor/yo'qligini.
 *
 * Nega kerak: `SESSION_SECRET` qo'yilmasa, kod har bir "cold start"da
 * TASODIFIY sir yaratadi (server/session.ts). Oqibati — foydalanuvchilar
 * o'z-o'zidan tizimdan chiqib ketadi: har deployda albatta, va hatto
 * deploysiz ham, chunki turli server nusxalarida sir turlicha bo'ladi va
 * bittasi imzolagan cookie'ni boshqasi rad etadi.
 *
 * Bu holat tashqaridan KO'RINMASDI — faqat foydalanuvchining "nega meni
 * chiqarib yubordi?" degan shikoyati orqali bilinardi. Endi bir so'rov
 * bilan aniqlanadi.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? "local",
    message: process.env.VERCEL_GIT_COMMIT_MESSAGE?.split("\n")[0] ?? null,
    deployedAt: process.env.VERCEL_DEPLOYMENT_ID ? new Date().toISOString() : null,
    env: process.env.VERCEL_ENV ?? "development",
    config: {
      // `true` = qo'yilgan. Qiymatning O'ZI hech qachon qaytarilmaydi.
      sessionSecret: !!process.env.SESSION_SECRET,
      adminSessionSecret: !!process.env.ADMIN_SESSION_SECRET,
      cronSecret: !!process.env.CRON_SECRET,
      databaseUrl: !!process.env.DATABASE_URL,
    },
  });
}
