import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/session";
import { broadcastTelegramMessage, isTelegramConfigured } from "@/server/telegram";
import { ApiError, handleApiError } from "@/server/api-utils";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    if (!isTelegramConfigured()) {
      throw new ApiError(400, "Avval Telegram botni ulang.");
    }
    const { message } = (await request.json()) ?? {};
    if (!message?.trim()) {
      throw new ApiError(400, "Xabar matnini kiriting.");
    }
    const result = await broadcastTelegramMessage(message.trim());
    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}
