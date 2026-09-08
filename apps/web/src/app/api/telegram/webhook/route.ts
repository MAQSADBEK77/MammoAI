import { NextResponse, type NextRequest } from "next/server";
import type { Language } from "@mammoai/shared";
import { confirmMiniAppContact, confirmPhoneViaContact, recordTelegramBotStart, registerTelegramStart } from "@/server/repo";
import { miniAppInlineKeyboard, removeKeyboard, requestContactKeyboard, sendTelegramMessage } from "@/server/telegram-bot";

interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: { id: number };
    contact?: { phone_number: string; user_id?: number };
    from?: { id: number; first_name?: string; username?: string };
  };
}

// Bot xabarlari — App'ning to'liq i18n tizimidan mustaqil (webhook'da foydalanuvchi
// hali sessiyaga ega emas), lekin verification yozib qo'yilgan `language`ga qarab
// asosiy tillarda ko'rsatiladi. uz-cyrl uchun ham lotincha yetarli (raqamlar
// baribir universal).
const MESSAGES: Record<
  "uz" | "ru" | "en",
  {
    askContact: string;
    shareButton: string;
    mismatch: string;
    codeSent: (code: string) => string;
    invalidToken: string;
    welcome: string;
    openAppButton: string;
  }
> = {
  uz: {
    askContact: "Xavfsizlik uchun, ilovaga kiritgan telefon raqamingizni tasdiqlang — pastdagi tugmani bosing.",
    shareButton: "📱 Telefon raqamimni ulashish",
    mismatch: "Bu Telegram hisobi ilovaga kiritilgan raqamga mos kelmadi. Iltimos, o'sha raqamga tegishli Telegram hisobingizdan urinib ko'ring.",
    codeSent: (code) => `Sizning MammoAI tasdiqlash kodingiz: ${code}\n\nBu kodni hech kimga bermang.`,
    invalidToken: "Havola eskirgan yoki noto'g'ri. Ilovada qaytadan urinib ko'ring.",
    welcome:
      "👋 Xush kelibsiz, MammoAI botiga!\n\nBu yerdan ilovaga to'g'ridan-to'g'ri, telefon raqam kiritmasdan kirishingiz mumkin — ism, rasm va raqamingiz avtomatik olinadi.\n\nBoshlash uchun pastdagi tugmani bosing 👇",
    openAppButton: "📲 Ilovani ochish",
  },
  ru: {
    askContact: "Для безопасности подтвердите номер телефона, указанный в приложении — нажмите кнопку ниже.",
    shareButton: "📱 Поделиться номером телефона",
    mismatch: "Этот Telegram-аккаунт не соответствует номеру, указанному в приложении. Попробуйте со своего аккаунта, привязанного к этому номеру.",
    codeSent: (code) => `Ваш код подтверждения MammoAI: ${code}\n\nНикому не сообщайте этот код.`,
    invalidToken: "Ссылка устарела или неверна. Попробуйте ещё раз в приложении.",
    welcome:
      "👋 Добро пожаловать в бот MammoAI!\n\nЗдесь можно войти в приложение напрямую, без ввода номера телефона — имя, фото и номер будут получены автоматически.\n\nНажмите кнопку ниже, чтобы начать 👇",
    openAppButton: "📲 Открыть приложение",
  },
  en: {
    askContact: "For security, confirm the phone number you entered in the app — tap the button below.",
    shareButton: "📱 Share my phone number",
    mismatch: "This Telegram account doesn't match the number entered in the app. Please try from the Telegram account linked to that number.",
    codeSent: (code) => `Your MammoAI verification code: ${code}\n\nDon't share this code with anyone.`,
    invalidToken: "The link is expired or invalid. Please try again in the app.",
    welcome:
      "👋 Welcome to the MammoAI bot!\n\nYou can open the app directly from here, no phone number typing needed — your name, photo, and number are picked up automatically.\n\nTap the button below to get started 👇",
    openAppButton: "📲 Open the app",
  },
};

function messagesFor(language: Language) {
  return MESSAGES[language === "ru" ? "ru" : language === "en" ? "en" : "uz"];
}

/**
 * Telegram bot yangiliklari shu yerga keladi (admin panelda token saqlanganda
 * `setWebhook` orqali avtomatik ro'yxatdan o'tkaziladi — server/telegram-bot.ts).
 *
 * Token'siz "/start" (kimdir botni o'zi topib oddiy Start bosgan) — Mini
 * App'ni ochishga taklif qiluvchi salomlashuv (pastda, alohida shart).
 *
 * Ikki bosqichli oqim (sayt orqali telefon tasdiqlash):
 * 1. "/start <token>" — chat_id yozuvga bog'lanadi, "telefon raqamni ulashish"
 *    tugmasi bilan xabar yuboriladi (hali kod YO'Q).
 * 2. Foydalanuvchi tugmani bosgach kelgan `contact` — ulashilgan raqam saytga
 *    kiritilgan raqam bilan solishtiriladi; mos kelsagina kod yuboriladi.
 *    Bu — ISTALGAN Telegram hisobidan "Start" bosib, o'zganing raqamiga kod
 *    olishning oldini oladi (haqiqiy egalikni Telegram o'zi tasdiqlaydi).
 *
 * Uchinchi (mustaqil) oqim — Telegram Mini App: `contact` kelganda avval
 * `confirmMiniAppContact` orqali tekshiriladi (Mini App'ning o'z
 * `requestContact()`i faqat o'z kontaktini so'raydi, solishtirish shart emas) —
 * mos kelsa shu yerda to'xtaydi, aks holda yuqoridagi 2-qadamga tushadi.
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
      // Token bilan yoki tokensiz — HAR bir "/start" shu yerda yoziladi
      // (admin panelning "hammaga xabar yuborish" ro'yxati uchun, hatto
      // hech qachon akkaunt yaratmagan bo'lsa ham).
      await recordTelegramBotStart(String(chatId), {
        telegramUserId: message.from?.id != null ? String(message.from.id) : null,
        firstName: message.from?.first_name ?? null,
        username: message.from?.username ?? null,
      });
      const token = message.text.slice("/start".length).trim();
      if (!token) {
        // Odatiy holat — kimdir botni o'zi topib (qidiruv, ulashish va h.k.)
        // oddiy "Start" bosgan, sayt orqali kelgan havola emas. Bunday holda
        // "havola noto'g'ri" xabari noqulay bo'lardi — o'rniga Mini App'ni
        // ochishga taklif qiluvchi iliq salomlashuv ko'rsatiladi.
        const m = messagesFor("uz");
        const publicBaseUrl = new URL(request.url).origin;
        await sendTelegramMessage(String(chatId), m.welcome, miniAppInlineKeyboard(m.openAppButton, `${publicBaseUrl}/tg`));
        return NextResponse.json({ ok: true });
      }
      const result = await registerTelegramStart(token, String(chatId));
      if (result) {
        const m = messagesFor(result.language);
        await sendTelegramMessage(String(chatId), m.askContact, requestContactKeyboard(m.shareButton));
      } else {
        await sendTelegramMessage(String(chatId), messagesFor("uz").invalidToken);
      }
    } else if (message?.contact?.phone_number) {
      // Avval Mini App orqali kutilayotgan kirish bormi tekshiriladi (1:1 shaxsiy
      // chatda chat_id === user_id) — Mini App'ning o'z `requestContact()`i faqat
      // foydalanuvchining O'Z kontaktini so'raydi, shuning uchun bu yerda raqamni
      // solishtirish shart emas (eski oqimdan farqli o'laroq).
      const miniAppMatched = await confirmMiniAppContact(String(chatId), message.contact.phone_number);
      if (miniAppMatched) {
        await sendTelegramMessage(String(chatId), "✅ Raqamingiz tasdiqlandi — ilovaga qayting.", removeKeyboard());
        return NextResponse.json({ ok: true });
      }

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
