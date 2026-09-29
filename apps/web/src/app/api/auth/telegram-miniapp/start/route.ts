import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { createTelegramUser, findUserByTelegramId, getOnboardingProfile } from "@/server/repo";
import { requireVerifiedTelegramUser } from "@/server/telegram-miniapp-auth";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/server/session";

interface StartBody {
  initData: string;
}

/**
 * Mini App ochilganda birinchi chaqiriladigan endpoint — `initData`ni
 * tasdiqlaydi va sessiyani o'rnatadi.
 *
 * AUTH-03: ilgari YANGI foydalanuvchidan avval TELEFON so'ralardi
 * (`needsContact: true` -> Telegram kontakt oynasi). Endi so'ralmaydi.
 *
 * Nega: `initData` bot tokeni bilan imzolangan va biz uni tekshiramiz,
 * ya'ni shaxs allaqachon tasdiqlangan — telefon hech qanday xavfsizlik
 * qo'shmasdi. U faqat ilovaning eng birinchi qadamida, hali hech narsa
 * ko'rsatilmasdan turib, eng maxfiy ma'lumotni so'rardi. O'lchandi:
 * telefon bergan 188 ayolning 40 tasi (21%) shundan keyin onboardingni
 * tashlab ketgan.
 *
 * Telefon endi ixtiyoriy va KEYINROQ so'raladi — hisobni tiklash yoki
 * veb orqali kirish kerak bo'lganda (kontakt oqimi o'z joyida qoldi).
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StartBody;
    const tgUser = await requireVerifiedTelegramUser(body.initData);
    const telegramUserId = String(tgUser.id);

    const existing = await findUserByTelegramId(telegramUserId);
    const account =
      existing ??
      (
        await createTelegramUser(
          telegramUserId,
          tgUser.language_code === "ru" ? "ru" : "uz",
          [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || null,
          tgUser.photo_url ?? null
        )
      ).user;
    const tokenVersion = existing ? existing.tokenVersion : 0;

    const token = signSession({ sub: account.id, tokenVersion });
    const res = NextResponse.json({
      loggedIn: true,
      onboarded: !!(await getOnboardingProfile(account.id)),
    });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  } catch (error) {
    return jsonError(error);
  }
}
