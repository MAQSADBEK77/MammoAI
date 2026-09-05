import { NextResponse, type NextRequest } from "next/server";
import { attachTelegramChatToVerification } from "@/server/repo";
import { sendTelegramMessage } from "@/server/telegram-bot";

interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: { id: number };
  };
}

/**
 * Telegram bot yangiliklari shu yerga keladi (admin panelda token saqlanganda
 * `setWebhook` orqali avtomatik ro'yxatdan o'tkaziladi — server/telegram-bot.ts).
 * Bizni faqat "/start <token>" xabari qiziqtiradi — foydalanuvchi telefon
 * tasdiqlash havolasini bosib, botni birinchi marta ochganda yuboriladi.
 *
 * MUHIM: Telegram har doim tezkor 200 javobini kutadi, aks holda xabarni
 * qayta-qayta yuborishga urinaveradi — shuning uchun xato bo'lsa ham jim
 * qolib, baribir 200 qaytaramiz.
 */
export async function POST(request: NextRequest) {
  try {
    const update = (await request.json()) as TelegramUpdate;
    const text = update.message?.text;
    const chatId = update.message?.chat?.id;

    if (text?.startsWith("/start") && chatId) {
      const token = text.slice("/start".length).trim();
      if (token) {
        const result = await attachTelegramChatToVerification(token, String(chatId));
        if (result) {
          await sendTelegramMessage(
            String(chatId),
            `Sizning MammoAI tasdiqlash kodingiz: ${result.code}\n\nBu kodni hech kimga bermang — u ilovaga kirish uchun ishlatiladi.`
          );
        } else {
          await sendTelegramMessage(String(chatId), "Havola eskirgan yoki noto'g'ri. Ilovada qaytadan urinib ko'ring.");
        }
      }
    }
  } catch (error) {
    console.error("Telegram webhook error:", error);
  }
  return NextResponse.json({ ok: true });
}
