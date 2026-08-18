import { NextResponse } from "next/server";
import { updateUserPasswordHash } from "@/server/db";
import { requireUser } from "@/server/session";
import { hashPassword, verifyPassword } from "@/server/auth";
import { ApiError, handleApiError } from "@/server/api-utils";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { currentPassword, newPassword } = (await request.json()) ?? {};

    if (!currentPassword || !newPassword) {
      throw new ApiError(400, "Joriy va yangi parolni kiriting.");
    }
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      throw new ApiError(401, "Joriy parol noto'g'ri.");
    }
    if (newPassword.length < 6) {
      throw new ApiError(400, "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak.");
    }

    updateUserPasswordHash(user.id, hashPassword(newPassword));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
