import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { consumeTelegramLoginCode, isRateLimited, recordAuthAttempt, toPublicUser } from "@/server/db";
import { signSession, sessionCookieOptions, SESSION_COOKIE } from "@/server/auth";
import { ApiError, getClientIp, handleApiError } from "@/server/api-utils";

// Password-free login: the user gets a 6-digit code from the Telegram bot
// (only possible once their account is already linked there) and types it
// in here. Same rate-limit shape as the password login route.
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const { code } = (await request.json()) ?? {};
    if (!code?.trim()) {
      throw new ApiError(400, "Kodni kiriting.");
    }

    const ip = getClientIp(request);
    const ipKey = `tg-login-ip:${ip}`;
    if (isRateLimited(ipKey, MAX_ATTEMPTS, WINDOW_MS)) {
      throw new ApiError(429, "Juda ko'p urinish. Iltimos, 15 daqiqadan so'ng qayta urinib ko'ring.");
    }

    const user = consumeTelegramLoginCode(code.trim());
    if (!user) {
      recordAuthAttempt(ipKey);
      throw new ApiError(401, "Kod noto'g'ri yoki muddati o'tgan. Botdan yangi kod oling.");
    }

    const token = signSession(user.id, user.tokenVersion);
    const store = await cookies();
    store.set(SESSION_COOKIE, token, sessionCookieOptions);

    return NextResponse.json({ user: toPublicUser(user) });
  } catch (err) {
    return handleApiError(err);
  }
}
