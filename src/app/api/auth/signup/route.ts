import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createUser, isRateLimited, recordAuthAttempt, toPublicUser } from "@/server/db";
import { signSession, sessionCookieOptions, SESSION_COOKIE } from "@/server/auth";
import { ApiError, getClientIp, handleApiError } from "@/server/api-utils";

const MAX_SIGNUPS = 8;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: Request) {
  try {
    const ipKey = `signup-ip:${getClientIp(request)}`;
    if (isRateLimited(ipKey, MAX_SIGNUPS, WINDOW_MS)) {
      throw new ApiError(429, "Juda ko'p urinish. Iltimos, birozdan so'ng qayta urinib ko'ring.");
    }
    recordAuthAttempt(ipKey);

    const body = await request.json();
    const { firstName, lastName, email, password, birthDate, passportSeries, phone, referralCode } = body ?? {};

    if (!firstName?.trim() || !lastName?.trim()) {
      throw new ApiError(400, "Ism va familiyani kiriting.");
    }
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, "To'g'ri email kiriting.");
    }
    if (!password || password.length < 6) {
      throw new ApiError(400, "Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
    }
    if (!birthDate) {
      throw new ApiError(400, "Tug'ilgan sanangizni kiriting.");
    }
    if (!passportSeries?.trim() || passportSeries.trim().length < 5) {
      throw new ApiError(400, "Passport seriya raqamini to'g'ri kiriting.");
    }

    const user = createUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
      birthDate,
      passportSeries: passportSeries.trim().toUpperCase(),
      phone: phone?.trim() ?? "",
      referredByCode: typeof referralCode === "string" ? referralCode.trim() : undefined,
    });

    const token = signSession(user.id, user.tokenVersion);
    const store = await cookies();
    store.set(SESSION_COOKIE, token, sessionCookieOptions);

    return NextResponse.json({ user: toPublicUser(user) });
  } catch (err) {
    return handleApiError(err);
  }
}
