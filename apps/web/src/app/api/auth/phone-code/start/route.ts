import { NextResponse, type NextRequest } from "next/server";
import { extractUzPhoneDigits, type Language } from "@mammoai/shared";
import { jsonError } from "@/server/api-utils";
import { checkPhoneCodeStartRateLimit, createPhoneVerification } from "@/server/repo";
import { getTelegramBotUsername } from "@/server/telegram-bot";

interface StartBody {
  identifier: string;
  language: Language;
}

// FIX3-16: bu endpoint autentifikatsiyasiz ishlaydi — IP manzil so'rovni
// kim yuborganini tanib olishning yagona vositasi (analytics/events'dagi
// bilan bir xil naqsh).
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Telefon raqamni Telegram bot orqali tasdiqlash — 1-qadam. Foydalanuvchi
 * telefon kiritadi, biz vaqtinchalik "token" yaratamiz va Telegram botga olib
 * boradigan chuqur havolani qaytaramiz (t.me/<bot>?start=<token>). Foydalanuvchi
 * botda "Start" bosgach, /api/telegram/webhook orqali unga kod yuboriladi.
 */
export async function POST(request: NextRequest) {
  try {
    await checkPhoneCodeStartRateLimit(getClientIp(request));
    const body = (await request.json()) as StartBody;
    // FIX-05: ilgari faqat trim + bo'sh regex tekshiruvi bo'lardi, hech qanday
    // normalizatsiya yo'q edi — "+998 90 123 45 67" va "998901234567" ikkita
    // BOSHQA-BOSHQA qator sifatida saqlanardi, keyinroq findUserByIdentifier
    // ularni bir xil deb topa olmay, YANGI (bo'sh) akkaunt yaratardi. Endi
    // Telegram Mini App oqimidagi bilan bir xil funksiya — yagona kanonik
    // formatga ("+998XXXXXXXXX") keltiradi (yoki noto'g'ri bo'lsa null).
    const identifier = extractUzPhoneDigits(body.identifier ?? "");
    if (!identifier) {
      return NextResponse.json({ error: "To'g'ri telefon raqam kiriting" }, { status: 400 });
    }

    const username = await getTelegramBotUsername();
    if (!username) {
      return NextResponse.json({ error: "Telegram bot hali sozlanmagan — birozdan keyin urinib ko'ring" }, { status: 500 });
    }

    const { token } = await createPhoneVerification(identifier, body.language ?? "uz");
    return NextResponse.json({ token, deepLink: `https://t.me/${username}?start=${token}` });
  } catch (error) {
    return jsonError(error);
  }
}
