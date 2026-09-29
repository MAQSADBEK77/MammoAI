import { NextResponse, type NextRequest } from "next/server";
import type { Language } from "@mammoai/shared";
import { jsonError } from "@/server/api-utils";
import { checkAnonymousSignupRateLimit, createAnonymousUser } from "@/server/repo";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/server/session";

interface Body {
  language?: Language;
}

/** Autentifikatsiyasiz endpoint — IP so'rovni kim yuborganini tanishning
 *  yagona vositasi (phone-code/start bilan bir xil naqsh). */
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * AUTH-04 — ilovaga ANONIM kirish.
 *
 * Nega kerak: ro'yxatdan o'tish ilovaning eshigida turardi. Ayol hali
 * bironta ekranni ko'rmasdan turib o'zini tanishtirishi kerak edi —
 * sog'liq ilovasida bu eng katta to'siq. Endi u avval kiradi, siklini
 * belgilaydi, ko'rib chiqadi; ro'yxatdan o'tish esa faqat ayrim
 * funksiyalar uchun so'raladi.
 *
 * Hisob haqiqiy qatorga ega (ma'lumot serverda saqlanadi), lekin unda
 * na telefon, na Telegram bor — `isRegisteredUser` shuni tekshiradi.
 *
 * MUHIM: bu endpointni kim bo'lsa ham chaqira oladi, shuning uchun IP
 * bo'yicha cheklov bor (soatiga 10 ta) — aks holda bazani bo'sh
 * hisoblar bilan to'ldirib yuborish mumkin edi.
 */
export async function POST(request: NextRequest) {
  try {
    await checkAnonymousSignupRateLimit(getClientIp(request));
    const body = (await request.json().catch(() => ({}))) as Body;
    const language: Language = body.language ?? "uz";

    const { user, tokenVersion } = await createAnonymousUser(language);
    const token = signSession({ sub: user.id, tokenVersion });
    const res = NextResponse.json({ user, onboardingProfile: null, hasPremium: false, token });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  } catch (error) {
    return jsonError(error);
  }
}
