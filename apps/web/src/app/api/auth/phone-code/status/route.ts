import { NextResponse, type NextRequest } from "next/server";
import { jsonError, ApiError } from "@/server/api-utils";
import { getPhoneVerificationByToken } from "@/server/repo";

/** Mijoz kod yuborilganini bilish uchun so'raydi (foydalanuvchi Telegram'da
 * "Start" bosdimi) — shundan keyingina kod kiritish maydonini ko'rsatadi. */
export async function GET(request: NextRequest) {
  try {
    const token = new URL(request.url).searchParams.get("token");
    if (!token) throw new ApiError(400, "token kerak");
    const row = await getPhoneVerificationByToken(token);
    if (!row) throw new ApiError(404, "Havola topilmadi yoki eskirgan");
    return NextResponse.json({ sent: !!row.code });
  } catch (error) {
    return jsonError(error);
  }
}
