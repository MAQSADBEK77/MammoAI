import { NextResponse, type NextRequest } from "next/server";
import type { Language } from "@mammoai/shared";
import { confirmPhoneViaContact, registerTelegramStart } from "@/server/repo";
import { removeKeyboard, requestContactKeyboard, sendTelegramMessage } from "@/server/telegram-bot";

interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: { id: number };
    contact?: { phone_number: string; user_id?: number };
    from?: { id: number };
  };
}

// Bot xabarlari — App'ning to'liq i18n tizimidan mustaqil (webhook'da foydalanuvchi
// hali sessiyaga ega emas), lekin verification yozib qo'yilgan `language`ga qarab
// asosiy tillarda ko'rsatiladi. uz-cyrl uchun ham lotincha yetarli (raqamlar
// baribir universal).
const MESSAGES: Record<"uz" | "ru" | "en", { askContact: string; shareButton: string; mismatch: string; codeSent: (code: string) => string; invalidToken: string }> = {
  uz: {
    askContact: "Xavfsizlik uchun, ilovaga kiritgan telefon raqamingizni tasdiqlang — pastdagi tugmani bosing.",
    shareButton: "📱 Telefon raqamimni ulashish",
    mismatch: "Bu Telegram hisobi ilovaga kiritilgan raqamga mos kelmadi. Iltimos, o'sha raqamga tegishli Telegram hisobingizdan urinib ko'ring.",
    codeSent: (code) => `Sizning MammoAI tasdiqlash kodingiz: ${code}\n\nBu kodni hech kimga bermang.`,
    invalidToken: "Havola eskirgan yoki noto'g'ri. Ilovada qaytadan urinib ko'ring.",
  },
  ru: {
    askContact: "Для безопасности подтвердите номер телефона, указанный в приложении — нажмите кнопку ниже.",
    shareButton: "📱 Поделиться номером телефона",
    mismatch: "Этот Telegram-аккаунт не соответствует номеру, указанному в приложении. Попробуйте со своего аккаунта, привязанного к этому номеру.",
    codeSent: (code) => `Ваш код подтверждения MammoAI: ${code}\n\nНикому не сообщайте этот код.`,
    invalidToken: "Ссылка устарела или неверна. Попробуйте ещё раз в приложении.",
  },
  en: {
    askContact: "For security, confirm the phone number you entered in the app — tap the button below.",
    shareButton: "📱 Share my phone number",
    mismatch: "This Telegram account doesn't match the number entered in the app. Please try from the Telegram account linked to that number.",
    codeSent: (code) => `Your MammoAI verification code: ${code}\n\nDon't share this code with anyone.`,
    invalidToken: "The link is expired or invalid. Please try again in the app.",
  },
};

function messagesFor(language: Language) {
  return MESSAGES[language === "ru" ? "ru" : language === "en" ? "en" : "uz"];
}

/**
 * Telegram bot yangiliklari shu yerga keladi (admin panelda token saqlanganda
 * `setWebhook` orqali avtomatik ro'yxatdan o'tkaziladi — server/telegram-bot.ts).
 *
 * Ikki bosqichli oqim:
 * 1. "/start <token>" — chat_id yozuvga bog'lanadi, "telefon raqamni ulashish"
 *    tugmasi bilan xabar yuboriladi (hali kod YO'Q).
 * 2. Foydalanuvchi tugmani bosgach kelgan `contact` — ulashilgan raqam saytga
 *    kiritilgan raqam bilan solishtiriladi; mos kelsagina kod yuboriladi.
 *    Bu — ISTALGAN Telegram hisobidan "Start" bosib, o'zganing raqamiga kod
 *    olishning oldini oladi (haqiqiy egalikni Telegram o'zi tasdiqlaydi).
 *
 * MUHIM: Telegram har doim tezkor 200 javobini kutadi, aks holda xabarni
 * qayta-qayta yuborishga urinaveradi — shuning uchun xato bo'lsa ham jim
 * qolib, baribir 200 qaytaramiz.
 */
export async function POST(request: NextRequest) {
  try {
    const update = (await request.json()) as TelegramUpdate;
    const message = update.message;
    const chatId = message?.chat?.id;
    if (!chatId) return NextResponse.json({ ok: true });

    if (message?.text?.startsWith("/start")) {
      const token = message.text.slice("/start".length).trim();
      const result = token ? await registerTelegramStart(token, String(chatId)) : null;
      if (result) {
        const m = messagesFor(result.language);
        await sendTelegramMessage(String(chatId), m.askContact, requestContactKeyboard(m.shareButton));
      } else {
        await sendTelegramMessage(String(chatId), messagesFor("uz").invalidToken);
      }
    } else if (message?.contact?.phone_number) {
      const result = await confirmPhoneViaContact(String(chatId), message.contact.phone_number);
      if (result?.matched) {
        const m = messagesFor(result.language);
        await sendTelegramMessage(String(chatId), m.codeSent(result.code), removeKeyboard());
      } else if (result && !result.matched) {
        await sendTelegramMessage(String(chatId), messagesFor("uz").mismatch, removeKeyboard());
      }
      // `result === null` — bu chat uchun kutilayotgan tasdiqlash topilmadi (masalan
      // /start bosilmasdan to'g'ridan-to'g'ri kontakt yuborilgan) — jim qolamiz.
    }
  } catch (error) {
    console.error("Telegram webhook error:", error);
  }
  return NextResponse.json({ ok: true });
}
