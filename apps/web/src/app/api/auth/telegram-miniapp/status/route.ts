import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { getMiniAppPendingPhone } from "@/server/repo";

/** Mini App shu endpoint'ni poll qiladi — foydalanuvchi Telegram'ning
 * "Telefon raqamimni ulashish" popup'ini bosgach, webhook orqali raqam
 * saqlangan bo'ladi (server/telegram-bot flow bilan bir xil naqsh). */
export async function GET(request: NextRequest) {
  try {
    const telegramUserId = new URL(request.url).searchParams.get("telegramUserId");
    if (!telegramUserId) return NextResponse.json({ error: "telegramUserId yo'q" }, { status: 400 });
    const phone = await getMiniAppPendingPhone(telegramUserId);
    return NextResponse.json({ phoneReady: !!phone });
  } catch (error) {
    return jsonError(error);
  }
}
