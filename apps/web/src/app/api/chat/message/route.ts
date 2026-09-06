import { NextResponse, type NextRequest } from "next/server";
import { ApiError, jsonError, requireUser } from "@/server/api-utils";
import { generateAssistantReply } from "@/server/ai-chat";
import { countChatMessagesToday, listChatMessages, saveChatMessage } from "@/server/repo";

const MAX_MESSAGE_LENGTH = 2000;
const DAILY_MESSAGE_LIMIT = 100;
const HISTORY_LIMIT = 20; // Claude'ga yuboriladigan oxirgi xabarlar soni

/** Foydalanuvchi AI Yordamchiga xabar yuboradi: xabar saqlanadi → mavjud
 * sikl/homiladorlik ma'lumotidan kontekst quriladi → Claude chaqiriladi →
 * javob saqlanib qaytariladi. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as { content?: string };
    const content = body.content?.trim();
    if (!content) return NextResponse.json({ error: "Xabar matni bo'sh" }, { status: 400 });
    if (content.length > MAX_MESSAGE_LENGTH) {
      throw new ApiError(400, "Xabar juda uzun");
    }

    const todayCount = await countChatMessagesToday(user.id);
    if (todayCount >= DAILY_MESSAGE_LIMIT) {
      throw new ApiError(429, "Bugungi xabarlar limiti tugadi — ertaga davom eting");
    }

    await saveChatMessage(user.id, "user", content);
    const history = await listChatMessages(user.id, HISTORY_LIMIT);
    const { reply, patterns } = await generateAssistantReply(user, history);
    const message = await saveChatMessage(user.id, "assistant", reply);

    return NextResponse.json({ message, patterns });
  } catch (error) {
    return jsonError(error);
  }
}
