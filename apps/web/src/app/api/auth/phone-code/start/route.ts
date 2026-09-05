import { NextResponse, type NextRequest } from "next/server";
import type { Language } from "@mammoai/shared";
import { jsonError } from "@/server/api-utils";
import { createPhoneVerification } from "@/server/repo";
import { getTelegramBotUsername } from "@/server/telegram-bot";

interface StartBody {
  identifier: string;
  language: Language;
}

const PHONE_RE = /^\+?[0-9][0-9\s-]{6,14}$/;

/**
 * Telefon raqamni Telegram bot orqali tasdiqlash — 1-qadam. Foydalanuvchi
 * telefon kiritadi, biz vaqtinchalik "token" yaratamiz va Telegram botga olib
 * boradigan chuqur havolani qaytaramiz (t.me/<bot>?start=<token>). Foydalanuvchi
 * botda "Start" bosgach, /api/telegram/webhook orqali unga kod yuboriladi.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StartBody;
    const identifier = body.identifier?.trim();
    if (!identifier || !PHONE_RE.test(identifier)) {
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
