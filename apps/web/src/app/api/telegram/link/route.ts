import { NextResponse } from "next/server";
import { jsonError } from "@/server/api-utils";
import { getTelegramBotUsername } from "@/server/telegram-bot";

/**
 * Ochiq (autentifikatsiyasiz) — botning ochiq t.me havolasini qaytaradi.
 * Bot username token'dan emas (getMe orqali) aniqlanadi va app_settings'da
 * keshlanadi — shu username'ning o'zi maxfiy emas (auth/phone-code/start
 * ham buni allaqachon autentifikatsiyasiz foydalanuvchilarga qaytaradi).
 * Bot hali admin panelda sozlanmagan bo'lsa `url: null` — chaqiruvchi tomon
 * (LandingPage/page.tsx) veb onboarding'ga qaytishi kerak.
 */
export async function GET() {
  try {
    const username = await getTelegramBotUsername();
    return NextResponse.json({ url: username ? `https://t.me/${username}` : null });
  } catch (error) {
    return jsonError(error);
  }
}
