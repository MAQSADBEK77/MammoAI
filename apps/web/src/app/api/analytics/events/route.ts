import { NextResponse, type NextRequest } from "next/server";
import type { AnalyticsEventInput } from "@mammoai/shared";
import { jsonError, getAuthenticatedUser } from "@/server/api-utils";
import { checkAnalyticsIngestRateLimit, recordAnalyticsEvents } from "@/server/repo";

const MAX_EVENTS_PER_BATCH = 100;

// FIX2-24: bu endpoint autentifikatsiyasiz ham ishlagani uchun, IP manzil
// so'rovni kim yuborganini tanib olishning yagona vositasi — Vercel har bir
// so'rovga `x-forwarded-for` header'ini qo'shadi (birinchi qiymat — haqiqiy
// mijoz IP'i).
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Foydalanish hodisalari (sahifa ko'rish/tugma bosish) — mijoz to'plab, davriy
 * yuboradi. Sessiya bo'lmasa ham (masalan onboarding tugamasdan oldingi
 * hodisalar) qabul qilinadi — `requireUser` emas, `getAuthenticatedUser`
 * ishlatiladi, chunki analitika ilova ishlashini bloklamasligi kerak.
 */
export async function POST(request: NextRequest) {
  try {
    // FIX2-24: autentifikatsiyasiz ham ishlaydigan bu endpoint hech qanday
    // rate-limit'siz edi — bitta so'rovda 100 tagacha soxta hodisa cheksiz
    // marta yuborilishi mumkin edi.
    await checkAnalyticsIngestRateLimit(getClientIp(request));
    const user = await getAuthenticatedUser(request);
    const body = (await request.json().catch(() => null)) as { events?: AnalyticsEventInput[] } | null;
    const events = Array.isArray(body?.events) ? body.events.slice(0, MAX_EVENTS_PER_BATCH) : [];
    await recordAnalyticsEvents(user?.id ?? null, events);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
