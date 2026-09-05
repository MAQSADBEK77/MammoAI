import { NextResponse, type NextRequest } from "next/server";
import type { Language } from "@mammoai/shared";
import { jsonError } from "@/server/api-utils";
import { createUserWithTelegram, findUserByTelegramId, getOnboardingProfile } from "@/server/repo";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/server/session";
import { verifyTelegramInitData } from "@/server/telegram-auth";

interface AuthTelegramBody {
  initData: string;
}

const SUPPORTED_LANGUAGES: Language[] = ["uz", "uz-cyrl", "ru", "en"];

/**
 * Telegram Mini App ichida ochilganda — `initData` server tomonda bot tokeni
 * bilan tasdiqlanadi, so'ng shu Telegram ID bo'yicha akkaunt topiladi yoki
 * yaratiladi (telefon raqam/SMS shart emas, App.pdf'dagi "SMS kelishi shart
 * emas" tamoyilining Telegram versiyasi — bu yerda esa Telegram o'zi tasdiqlaydi).
 */
export async function POST(request: NextRequest) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: "Telegram integratsiyasi sozlanmagan — TELEGRAM_BOT_TOKEN muhit o'zgaruvchisi yo'q" },
        { status: 500 }
      );
    }

    const body = (await request.json()) as AuthTelegramBody;
    if (!body.initData) {
      return NextResponse.json({ error: "initData yo'q" }, { status: 400 });
    }

    const tgUser = verifyTelegramInitData(body.initData, botToken);
    if (!tgUser) {
      return NextResponse.json({ error: "Telegram ma'lumoti tasdiqlanmadi" }, { status: 401 });
    }

    const telegramId = String(tgUser.id);
    const language: Language = SUPPORTED_LANGUAGES.includes(tgUser.language_code as Language)
      ? (tgUser.language_code as Language)
      : "uz";
    const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ").trim() || null;

    const existing = await findUserByTelegramId(telegramId);
    const { user, tokenVersion } = existing
      ? { user: existing, tokenVersion: existing.tokenVersion }
      : await createUserWithTelegram(telegramId, language, fullName);

    const token = signSession({ sub: user.id, tokenVersion });
    const res = NextResponse.json({
      user,
      onboardingProfile: await getOnboardingProfile(user.id),
      token,
      isNewAccount: !existing,
    });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  } catch (error) {
    return jsonError(error);
  }
}
