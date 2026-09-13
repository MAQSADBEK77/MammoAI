import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./session";
import { getUserById } from "./repo";
import type { User } from "@mammoai/shared";

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

export async function requireUser(request: NextRequest): Promise<User & { tokenVersion: number }> {
  const user = await getAuthenticatedUser(request);
  if (!user) throw new ApiError(401, "Sessiya topilmadi — onboarding'dan qayta o'ting");
  // Admin panel orqali bloklangan foydalanuvchi — API'ning hech qaysi qismidan
  // foydalana olmaydi (moderatsiya: qoidabuzarlik uchun kirishni to'sish).
  if (user.isBlocked) throw new ApiError(403, "Hisobingiz bloklangan — savollar bo'lsa, qo'llab-quvvatlash xizmatiga murojaat qiling");
  return user;
}
