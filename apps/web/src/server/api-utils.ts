import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./session";
import { getUserById } from "./repo";
import type { GatedFeature, User } from "@mammoai/shared";
import { canUseFeature } from "@mammoai/shared";

export class ApiError extends Error {
  // FIX2-20: `key` — barqaror, tarjima qilinadigan xato kodi (masalan
  // "post_too_short"). `message` xom o'zbekcha matn — server log/debug
  // uchun va `key` berilmagan (hali ko'chirilmagan) joylarda mijoz uchun
  // ORQAGA MOSLIK sifatida qoladi. Mijoz `key` mavjud bo'lsa shundan
  // `dict.apiErrors`ni o'qib tarjima qiladi, aks holda xom matnni ko'rsatadi.
  constructor(
    public status: number,
    message: string,
    public key?: string
  ) {
    super(message);
  }
}

export function jsonError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message, errorKey: error.key ?? null }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: "Serverda kutilmagan xatolik" }, { status: 500 });
}

/** Cookie (veb) yoki "Authorization: Bearer" (mobil) orqali joriy foydalanuvchini oladi. */
export async function getAuthenticatedUser(request: NextRequest): Promise<(User & { tokenVersion: number }) | null> {
  let token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) token = authHeader.slice("Bearer ".length);
  }
  if (!token) return null;

  const payload = verifySession(token);
  if (!payload) return null;

  const user = await getUserById(payload.sub);
  if (!user || user.tokenVersion !== payload.tokenVersion) return null;
  return user;
}

/**
 * AUTH-05 — hisob talab qiladigan funksiyalar uchun qo'riqchi.
 *
 * NEGA SERVERDA: UI'dagi qulf faqat bezak — so'rovni qo'lda yuborish
 * yoki ekranni chetlab o'tish bilan ochiladi. AI yordamchisi esa HAQIQIY
 * pul turadi, jamiyatga yozuv esa javobgarlik talab qiladi. Shuning
 * uchun qaror shu yerda, bitta joyda qabul qilinadi.
 *
 * "Ro'yxatdan o'tgan" = telefon yoki Telegram biriktirilgan, ya'ni
 * hisobni TIKLASH mumkin (`isRegisteredUser`, logic/registration.ts).
 */
export async function requireRegisteredUser(
  request: NextRequest,
  feature: GatedFeature
): Promise<User & { tokenVersion: number }> {
  const user = await requireUser(request);
  if (!canUseFeature(feature, user)) {
    // 403 + barqaror kalit: mijoz shu kalitni ko'rib "ro'yxatdan o'tish"
    // oynasini ochadi, xato matnini ko'rsatib qo'ya qolmaydi.
    throw new ApiError(403, "Bu funksiya uchun hisob kerak", "registration_required");
  }
  return user;
}

export async function requireUser(request: NextRequest): Promise<User & { tokenVersion: number }> {
  const user = await getAuthenticatedUser(request);
  if (!user) throw new ApiError(401, "Sessiya topilmadi — onboarding'dan qayta o'ting");
  // Admin panel orqali bloklangan foydalanuvchi — API'ning hech qaysi qismidan
  // foydalana olmaydi (moderatsiya: qoidabuzarlik uchun kirishni to'sish).
  if (user.isBlocked) throw new ApiError(403, "Hisobingiz bloklangan — savollar bo'lsa, qo'llab-quvvatlash xizmatiga murojaat qiling");
  return user;
}
