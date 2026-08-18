import { NextResponse } from "next/server";
import { getTelegramChatId } from "@/server/db";
import { requireUser } from "@/server/session";
import { getTelegramBotUsername, isTelegramConfigured } from "@/server/telegram";
import { handleApiError } from "@/server/api-utils";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({
      configured: isTelegramConfigured(),
      connected: Boolean(getTelegramChatId(user.id)),
      botUsername: getTelegramBotUsername(),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
