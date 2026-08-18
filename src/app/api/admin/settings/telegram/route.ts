import { NextResponse } from "next/server";
import { requireAdmin, requireAdminOrModerator } from "@/server/session";
import {
  disconnectTelegramBot,
  getTelegramBotUsername,
  isTelegramConfigured,
  verifyAndSaveTelegramBot,
} from "@/server/telegram";
import { logAdminAction } from "@/server/db";
import { ApiError, handleApiError } from "@/server/api-utils";

export async function GET() {
  try {
    await requireAdminOrModerator();
    return NextResponse.json({
      configured: isTelegramConfigured(),
      botUsername: getTelegramBotUsername(),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const { token } = (await request.json()) ?? {};
    if (!token?.trim()) {
      throw new ApiError(400, "Bot tokenini kiriting.");
    }
    let botUsername: string;
    try {
      botUsername = await verifyAndSaveTelegramBot(token.trim());
    } catch (verifyErr) {
      throw new ApiError(400, verifyErr instanceof Error ? verifyErr.message : "Token tekshirilmadi.");
    }
    logAdminAction(admin.id, `${admin.firstName} ${admin.lastName}`, "telegram.connect", `@${botUsername}`);
    return NextResponse.json({ ok: true, botUsername });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE() {
  try {
    const admin = await requireAdmin();
    disconnectTelegramBot();
    logAdminAction(admin.id, `${admin.firstName} ${admin.lastName}`, "telegram.disconnect", "");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
