import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserByEmail, toPublicUser } from "@/server/db";
import { signSession, verifyPassword, sessionCookieOptions, SESSION_COOKIE } from "@/server/auth";
import { ApiError, handleApiError } from "@/server/api-utils";

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) ?? {};
    if (!email || !password) {
      throw new ApiError(400, "Email va parolni kiriting.");
    }

    const user = getUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new ApiError(401, "Email yoki parol noto'g'ri.");
    }

    const token = signSession(user.id);
    const store = await cookies();
    store.set(SESSION_COOKIE, token, sessionCookieOptions);

    return NextResponse.json({ user: toPublicUser(user) });
  } catch (err) {
    return handleApiError(err);
  }
}
