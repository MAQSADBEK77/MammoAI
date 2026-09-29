import { NextResponse, type NextRequest } from "next/server";
import { normalizeKnownPhone, resolvePhoneLink } from "@mammoai/shared";
import { ApiError, getAuthenticatedUser, jsonError } from "@/server/api-utils";
import {
  createUserWithIdentifier,
  deleteMiniAppPending,
  findUserByIdentifier,
  getMiniAppPendingPhone,
  getOnboardingProfile,
  getUserById,
  hasPremiumAccess,
  linkTelegramToUser,
  moveTelegramLink,
  updateUser,
} from "@/server/repo";
import { requireVerifiedTelegramUser } from "@/server/telegram-miniapp-auth";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/server/session";

interface FinishBody {
  initData: string;
}

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
    const phone = normalizeKnownPhone(rawPhone);
    if (!phone) throw new ApiError(400, "Faqat O'zbekiston telefon raqamlari qo'llab-quvvatlanadi");

    const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ").trim() || null;

    // Til Telegram klientining o'zidan (`language_code`) OLINMAYDI — bu avval
    // shunday edi, lekin foydalanuvchi so'roviga ko'ra bekor qilindi: odam
    // Telegram interfeysini istalgan tilda ishlatishi mumkin, bu uning
    // ilova ichidagi tanlovi bilan bir xil bo'lishi shart emas. Standart
    // ("uz") bilan yaratiladi, keyin onboarding'ning "language" qadamida
    // (fromTelegram=1 bo'lsa ham SAQLANADI, boshqa Telegram-orqali
    // qadamlardan farqli — apps/web/src/app/onboarding/page.tsx) o'zi tanlaydi.
    const existing = await findUserByIdentifier(phone);

    // AUTH-04: bu paytda ayol ALLAQACHON anonim hisob bilan ishlayotgan
    // bo'lishi mumkin (va unda sikl yozuvlari bo'lishi mumkin). Shuning
    // uchun "telefon bo'yicha yangi hisob ochish" — noto'g'ri standart:
    // u ayolning ma'lumotini ko'rinmas qilib qo'yardi. Qaror
    // `resolvePhoneLink`da, testlar bilan.
    const current = await getAuthenticatedUser(request);
    const action = resolvePhoneLink({
      currentUserId: current?.id ?? null,
      currentUserHasPhone: !!current?.phone,
      existingUserId: existing?.id ?? null,
    });

    let user;
    let tokenVersion;
    switch (action.kind) {
      case "switch-to-existing":
        if (action.moveTelegramFrom) await moveTelegramLink(action.moveTelegramFrom, action.userId);
        user = existing!;
        tokenVersion = existing!.tokenVersion;
        break;
      case "attach-phone":
        await updateUser(action.userId, { phone });
        user = (await getUserById(action.userId))!;
        tokenVersion = user.tokenVersion;
        break;
      case "already-linked":
        user = current!;
        tokenVersion = current!.tokenVersion;
        break;
      default: {
        const created = await createUserWithIdentifier(phone, "uz");
        user = created.user;
        tokenVersion = created.tokenVersion;
      }
    }

    await linkTelegramToUser(user.id, { telegramUserId, name: fullName, avatarUrl: tgUser.photo_url ?? null });
    await deleteMiniAppPending(telegramUserId);
    const freshUser = (await getUserById(user.id)) ?? user;

    const token = signSession({ sub: user.id, tokenVersion });
    const [onboardingProfile, hasPremium] = await Promise.all([getOnboardingProfile(user.id), hasPremiumAccess(user.id)]);
    const res = NextResponse.json({
      user: freshUser,
      onboardingProfile,
      hasPremium,
      token,
      isNewAccount: action.kind === "create-account",
    });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  } catch (error) {
    return jsonError(error);
  }
}
