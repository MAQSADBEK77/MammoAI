import { NextResponse } from "next/server";
import { createFeedback, isRateLimited, recordAuthAttempt } from "@/server/db";
import { requireUser } from "@/server/session";
import { ApiError, getClientIp, handleApiError } from "@/server/api-utils";

const MAX_PER_HOUR = 10;
const WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const ip = getClientIp(request);
    if (isRateLimited(`feedback-ip:${ip}`, MAX_PER_HOUR, WINDOW_MS)) {
      throw new ApiError(429, "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring.");
    }
    const { message } = (await request.json()) ?? {};
    if (!message?.trim()) {
      throw new ApiError(400, "Xabar matnini kiriting.");
    }
    recordAuthAttempt(`feedback-ip:${ip}`);
    createFeedback(user.id, message.trim().slice(0, 2000), "site");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
