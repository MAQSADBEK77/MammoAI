import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { setTelegramLinkToken } from "@/server/db";
import { requireUser } from "@/server/session";
import { getTelegramBotUsername, isTelegramConfigured } from "@/server/telegram";
import { ApiError, handleApiError } from "@/server/api-utils";

export async function POST() {
  try {
    const user = await requireUser();
    if (!isTelegramConfigured()) {
      throw new ApiError(400, "Telegram bot hali ulanmagan.");
    }
    const token = randomBytes(16).toString("hex");
    setTelegramLinkToken(user.id, token);
    return NextResponse.json({ token, botUsername: getTelegramBotUsername() });
  } catch (err) {
    return handleApiError(err);
  }
}
