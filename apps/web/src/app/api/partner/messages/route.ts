import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { listPartnerChatMessages, sendPartnerChatMessage } from "@/server/repo";

/** Hamkor bilan suhbat tarixi — Telegram uslubidagi chat (avvalgi bir martalik
 * "Xabar" o'rnini bosadi). Real vaqt uchun websocket yo'q — mijoz tomon polling
 * qiladi (bir necha soniyada bir marta), shuning uchun bu route yengil bo'lishi kerak. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const messages = await listPartnerChatMessages(user.id);
    return NextResponse.json({ messages });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as { body?: string };
    const text = body.body?.trim();
    if (!text) return NextResponse.json({ error: "Xabar matni bo'sh" }, { status: 400 });
    const message = await sendPartnerChatMessage(user.id, text);
    return NextResponse.json({ message });
  } catch (error) {
    return jsonError(error);
  }
}
