import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createUser, toPublicUser } from "@/server/db";
import { signSession, sessionCookieOptions, SESSION_COOKIE } from "@/server/auth";
import { ApiError, handleApiError } from "@/server/api-utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password, birthDate, passportSeries, phone } = body ?? {};

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
    });

    const token = signSession(user.id);
    const store = await cookies();
    store.set(SESSION_COOKIE, token, sessionCookieOptions);

    return NextResponse.json({ user: toPublicUser(user) });
  } catch (err) {
    return handleApiError(err);
  }
}
