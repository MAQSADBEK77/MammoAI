import { NextResponse, type NextRequest } from "next/server";
import { jsonError, ApiError } from "@/server/api-utils";
import { createUserWithIdentifier, findUserByIdentifier, getOnboardingProfile, verifyPhoneCode } from "@/server/repo";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/server/session";

interface VerifyBody {
  token: string;
  code: string;
}

/**
 * 2-qadam — foydalanuvchi Telegram'dan olgan kodni kiritadi. To'g'ri bo'lsa,
 * telefon raqamga mos akkaunt yaratiladi/topiladi va sessiya ochiladi — xuddi
 * avvalgi (endi olib tashlangan) /api/auth/start bilan bir xil natija,
 * faqat endi telefon raqam Telegram orqali haqiqatan tasdiqlangan bo'ladi.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyBody;
    if (!body.token || !body.code) throw new ApiError(400, "Tasdiqlash kodi kerak");

    const result = await verifyPhoneCode(body.token, body.code.trim());
    if (!result) throw new ApiError(400, "Kod noto'g'ri yoki muddati o'tgan — qaytadan urinib ko'ring");

    const existing = await findUserByIdentifier(result.phone);
    const { user, tokenVersion } = existing
      ? { user: existing, tokenVersion: existing.tokenVersion }
      : await createUserWithIdentifier(result.phone, result.language);

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
