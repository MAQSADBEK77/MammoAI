import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { getMiniAppPendingPhone } from "@/server/repo";
import { requireVerifiedTelegramUser } from "@/server/telegram-miniapp-auth";

/** Mini App shu endpoint'ni poll qiladi — foydalanuvchi Telegram'ning
 * "Telefon raqamimni ulashish" popup'ini bosgach, webhook orqali raqam
 * saqlangan bo'ladi (server/telegram-bot flow bilan bir xil naqsh).
 *
 * FIX3-11 (MAXFIYLIK): ilgari xom `telegramUserId` query parametrini HECH
 * QANDAY autentifikatsiyasiz qabul qilardi — Telegram ID'ni bilgan ISTALGAN
 * KISHI boshqa odamning hozir login qilayotganini kuzatishi mumkin edi.
 * Endi /start va /finish'dagi kabi `initData` tasdiqlanadi, `telegramUserId`
 * so'rovdan emas, tasdiqlangan initData'dan olinadi.
 */
export async function GET(request: NextRequest) {
  try {
    const initData = new URL(request.url).searchParams.get("initData") ?? undefined;
    const tgUser = await requireVerifiedTelegramUser(initData);
    const phone = await getMiniAppPendingPhone(String(tgUser.id));
    return NextResponse.json({ phoneReady: !!phone });
  } catch (error) {
    return jsonError(error);
  }
}
