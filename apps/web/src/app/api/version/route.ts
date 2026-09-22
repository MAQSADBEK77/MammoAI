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
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? "local",
    message: process.env.VERCEL_GIT_COMMIT_MESSAGE?.split("\n")[0] ?? null,
    deployedAt: process.env.VERCEL_DEPLOYMENT_ID ? new Date().toISOString() : null,
    env: process.env.VERCEL_ENV ?? "development",
  });
}
