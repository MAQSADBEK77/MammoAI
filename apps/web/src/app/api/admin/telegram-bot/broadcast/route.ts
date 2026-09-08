import { NextResponse, type NextRequest } from "next/server";
import { ApiError, jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { listTelegramBroadcastChatIds } from "@/server/repo";
import { broadcastTelegramMessage } from "@/server/telegram-bot";

// Ko'p qabul qiluvchi bo'lsa (partiyalarda yuborilgani uchun) standart
// serverless vaqt chegarasi yetmasligi mumkin — kengaytiriladi.
export const maxDuration = 60;

/** Joriy manzil soni — admin panelda tugma bosishdan oldin "N kishiga
 * yuboriladi" deb ko'rsatish uchun. */
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    const chatIds = await listTelegramBroadcastChatIds();
    return NextResponse.json({ recipients: chatIds.length });
  } catch (error) {
    return jsonError(error);
  }
}

/** Botga "/start" bosgan HAMMAGA (repo.ts#listTelegramBroadcastChatIds)
 * bitta matnli xabar yuboradi. Qaytarib bo'lmaydigan, tashqi ta'sirli amal —
 * frontend tasdiqlash so'rovi (window.confirm) ko'rsatgandan keyingina chaqiradi. */
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    const { text } = (await request.json()) as { text?: string };
    if (!text?.trim()) throw new ApiError(400, "Xabar matni bo'sh bo'lishi mumkin emas");

    const chatIds = await listTelegramBroadcastChatIds();
    const { sent, failed } = await broadcastTelegramMessage(chatIds, text.trim());
    return NextResponse.json({ total: chatIds.length, sent, failed });
  } catch (error) {
    return jsonError(error);
  }
}
