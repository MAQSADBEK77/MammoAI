import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  clearAuthAttempts,
  getUserByEmail,
  isRateLimited,
  recordAuthAttempt,
  toPublicUser,
} from "@/server/db";
import { signSession, verifyPassword, sessionCookieOptions, SESSION_COOKIE } from "@/server/auth";
import { ApiError, getClientIp, handleApiError } from "@/server/api-utils";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) ?? {};
    if (!email || !password) {
      throw new ApiError(400, "Email va parolni kiriting.");
    }

    const ip = getClientIp(request);
    const ipKey = `login-ip:${ip}`;
    const emailKey = `login-email:${email.toLowerCase()}`;
    if (isRateLimited(ipKey, MAX_ATTEMPTS, WINDOW_MS) || isRateLimited(emailKey, MAX_ATTEMPTS, WINDOW_MS)) {
      throw new ApiError(429, "Juda ko'p urinish. Iltimos, 15 daqiqadan so'ng qayta urinib ko'ring.");
    }

    const user = getUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      recordAuthAttempt(ipKey);
      recordAuthAttempt(emailKey);
      throw new ApiError(401, "Email yoki parol noto'g'ri.");
    }

    clearAuthAttempts(ipKey);
    clearAuthAttempts(emailKey);

    const token = signSession(user.id, user.tokenVersion);
    const store = await cookies();
    store.set(SESSION_COOKIE, token, sessionCookieOptions);

    return NextResponse.json({ user: toPublicUser(user) });
  } catch (err) {
    return handleApiError(err);
  }
}
