import { NextResponse, type NextRequest } from "next/server";
import { extractUzPhoneDigits, type Language } from "@mammoai/shared";
import { ApiError, jsonError } from "@/server/api-utils";
import {
  createUserWithIdentifier,
  deleteMiniAppPending,
  findUserByIdentifier,
  getMiniAppPendingPhone,
  getOnboardingProfile,
  getUserById,
  linkTelegramToUser,
} from "@/server/repo";
import { requireVerifiedTelegramUser } from "@/server/telegram-miniapp-auth";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/server/session";

interface FinishBody {
  initData: string;
}

const SUPPORTED_LANGUAGES: Language[] = ["uz", "uz-cyrl", "ru", "en"];

/**
 * Foydalanuvchi Telegram'da "Telefon raqamimni ulashish" popup'ini
 * tasdiqlagach chaqiriladi (status'da `phoneReady: true` kelgach). `initData`
 * QAYTA tasdiqlanadi (start'dan beri o'zgarmagan bo'lishi shart), pending
 * yozuvdan telefon olinadi — shu telefon bo'yicha mavjud akkaunt topiladi
 * YOKI yangisi yaratiladi (web/mobil bilan BIR XIL identifikatsiya: agar
 * foydalanuvchi avval telefon orqali ro'yxatdan o'tgan bo'lsa, Mini App
 * aynan shu akkauntga kiradi).
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FinishBody;
    const tgUser = await requireVerifiedTelegramUser(body.initData);
    const telegramUserId = String(tgUser.id);

    const rawPhone = await getMiniAppPendingPhone(telegramUserId);
    if (!rawPhone) throw new ApiError(400, "Telefon raqam hali tasdiqlanmagan");
    // Telegram kontaktidan kelgan raqam "+" siz keladi (masalan "998901234567") —
    // saytdagi/mobildagi bilan BIR XIL "+998XXXXXXXXX" formatiga o'giriladi,
    // aks holda bir xil odam ikki xil qatorli akkaunt bilan tugashi mumkin edi.
    const phone = extractUzPhoneDigits(rawPhone);
    if (!phone) throw new ApiError(400, "Faqat O'zbekiston telefon raqamlari qo'llab-quvvatlanadi");

    const language: Language = SUPPORTED_LANGUAGES.includes(tgUser.language_code as Language)
      ? (tgUser.language_code as Language)
      : "uz";
    const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ").trim() || null;

    const existing = await findUserByIdentifier(phone);
    const { user, tokenVersion } = existing
      ? { user: existing, tokenVersion: existing.tokenVersion }
      : await createUserWithIdentifier(phone, language);

    await linkTelegramToUser(user.id, { telegramUserId, name: fullName, avatarUrl: tgUser.photo_url ?? null });
    await deleteMiniAppPending(telegramUserId);
    const freshUser = (await getUserById(user.id)) ?? user;

    const token = signSession({ sub: user.id, tokenVersion });
    const res = NextResponse.json({
      user: freshUser,
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
