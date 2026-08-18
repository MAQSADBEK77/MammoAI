import { NextResponse } from "next/server";
import { findUserForReset, isRateLimited, recordAuthAttempt, updateUserPasswordHash } from "@/server/db";
import { hashPassword } from "@/server/auth";
import { ApiError, getClientIp, handleApiError } from "@/server/api-utils";

const MAX_ATTEMPTS = 6;
const WINDOW_MS = 30 * 60 * 1000; // 30 minutes

// No outbound email is configured for this app, so "forgot password" verifies
// identity with the passport series + birth date collected at signup instead
// of an emailed link — see findUserForReset in server/db.ts.
export async function POST(request: Request) {
  try {
    const { email, passportSeries, birthDate, newPassword } = (await request.json()) ?? {};
    if (!email || !passportSeries || !birthDate || !newPassword) {
      throw new ApiError(400, "Barcha maydonlarni to'ldiring.");
    }
    if (newPassword.length < 6) {
      throw new ApiError(400, "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak.");
    }

    const ip = getClientIp(request);
    const ipKey = `reset-ip:${ip}`;
    const emailKey = `reset-email:${email.toLowerCase()}`;
    if (isRateLimited(ipKey, MAX_ATTEMPTS, WINDOW_MS) || isRateLimited(emailKey, MAX_ATTEMPTS, WINDOW_MS)) {
      throw new ApiError(429, "Juda ko'p urinish. Iltimos, birozdan so'ng qayta urinib ko'ring.");
    }

    const user = findUserForReset(email, passportSeries, birthDate);
    if (!user) {
      recordAuthAttempt(ipKey);
      recordAuthAttempt(emailKey);
      // Deliberately generic — don't reveal which field didn't match.
      throw new ApiError(400, "Ma'lumotlar mos kelmadi. Email, passport seriya va tug'ilgan sanani tekshiring.");
    }

    updateUserPasswordHash(user.id, hashPassword(newPassword));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
