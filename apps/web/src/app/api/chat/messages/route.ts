import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { getChatAccess } from "@/server/chat-access";
import { listChatMessages } from "@/server/repo";

/** AI Yordamchi suhbat tarixini va kirish huquqini yuklaydi.
 *
 * MONETIZE-01: kirish huquqi ham shu yerda qaytariladi — mijoz Premium
 * bormi-yo'qmi va nechta bepul xabar qolganini BITTA so'rovda biladi,
 * ekran ochilishida qo'shimcha kechikish bo'lmaydi. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const [messages, access] = await Promise.all([listChatMessages(user.id), getChatAccess(user.id)]);
    return NextResponse.json({ messages, hasPremium: access.hasPremium, freeMessagesLeft: access.freeMessagesLeft, freeAllowance: access.freeAllowance });
  } catch (error) {
    return jsonError(error);
  }
}
