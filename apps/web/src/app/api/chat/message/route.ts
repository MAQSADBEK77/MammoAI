import { NextResponse, type NextRequest } from "next/server";
import { ApiError, jsonError, requireUser } from "@/server/api-utils";
import { generateAssistantReply } from "@/server/ai-chat";
import { getChatAccess } from "@/server/chat-access";
import { incrementDailyChatUsage, decrementDailyChatUsage, listChatMessages, saveChatMessage } from "@/server/repo";

const MAX_MESSAGE_LENGTH = 2000;
const DAILY_MESSAGE_LIMIT = 100;
const HISTORY_LIMIT = 20; // Claude'ga yuboriladigan oxirgi xabarlar soni

/** Foydalanuvchi AI Yordamchiga xabar yuboradi: xabar saqlanadi → mavjud
 * sikl/homiladorlik ma'lumotidan kontekst quriladi → Claude chaqiriladi →
 * javob saqlanib qaytariladi. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    // MONETIZE-01: Premium YOKI qolgan bepul xabar. Bepul xabarlar tugagach
    // 402 Payment Required — mijoz shu statusni ko'rib alohida paywall
    // ko'rsatadi (oddiy xato emas).
    const access = await getChatAccess(user.id);
    if (!access.canSend) {
      throw new ApiError(402, "Bepul xabarlaringiz tugadi — davom etish uchun Premium kerak", "premium_required");
    }
    const body = (await request.json()) as { content?: string };
    const content = body.content?.trim();
    if (!content) return NextResponse.json({ error: "Xabar matni bo'sh" }, { status: 400 });
    if (content.length > MAX_MESSAGE_LENGTH) {
      throw new ApiError(400, "Xabar juda uzun", "message_too_long");
    }

    // FIX3-15: limit tekshiruvi endi bitta atomik DB operatsiyasi — parallel
    // so'rovlar (bir necha tab) limitdan oshib Claude API'ga murojaat
    // qilolmaydi.
    const usageCount = await incrementDailyChatUsage(user.id);
    if (usageCount > DAILY_MESSAGE_LIMIT) {
      throw new ApiError(429, "Bugungi xabarlar limiti tugadi — ertaga davom eting", "daily_chat_limit_reached");
    }

    try {
      await saveChatMessage(user.id, "user", content);
      const history = await listChatMessages(user.id, HISTORY_LIMIT);
      const { reply, patterns } = await generateAssistantReply(user, history);
      const message = await saveChatMessage(user.id, "assistant", reply);
      // Mijoz har javobdan keyin qolgan bepul xabarlarni yangilab turadi —
      // ayol paywallga TO'SATDAN urilmasligi uchun ogohlantirish ko'rsatiladi.
      const freeMessagesLeft = access.hasPremium ? access.freeAllowance : Math.max(access.freeMessagesLeft - 1, 0);
      return NextResponse.json({ message, patterns, hasPremium: access.hasPremium, freeMessagesLeft });
    } catch (error) {
      // DATA-ACCURACY-02: yuqoridagi hisoblagich (kunlik limit uchun) allaqachon
      // oshirilgan edi, lekin foydalanuvchi HECH QANDAY javob olmadi (AI
      // xatosi/tarmoq nosozligi) — kunlik limitni bunday muvaffaqiyatsiz
      // urinish uchun sarflamaslik kerak.
      await decrementDailyChatUsage(user.id);
      throw error;
    }
  } catch (error) {
    return jsonError(error);
  }
}
