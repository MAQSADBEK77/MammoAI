import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { findUserByTelegramId, getOnboardingProfile, upsertMiniAppPending } from "@/server/repo";
import { requireVerifiedTelegramUser } from "@/server/telegram-miniapp-auth";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/server/session";

interface StartBody {
  initData: string;
}

/**
 * Mini App ochilganda birinchi chaqiriladigan endpoint — `initData`ni
 * tasdiqlaydi. Bu Telegram akkaunt allaqachon akkauntga bog'langan bo'lsa
 * (`users.telegram_user_id`) — sessiya darhol o'rnatiladi, tugadi. Aks holda
 * telefon raqamni Telegram orqali (requestContact) olish kerak bo'ladi.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StartBody;
    const tgUser = await requireVerifiedTelegramUser(body.initData);
    const telegramUserId = String(tgUser.id);

    const existing = await findUserByTelegramId(telegramUserId);
    if (existing) {
      const token = signSession({ sub: existing.id, tokenVersion: existing.tokenVersion });
      const res = NextResponse.json({
        loggedIn: true,
        onboarded: !!(await getOnboardingProfile(existing.id)),
      });
      res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
      return res;
    }

    await upsertMiniAppPending(telegramUserId);
    return NextResponse.json({ loggedIn: false, needsContact: true });
  } catch (error) {
    return jsonError(error);
  }
}
