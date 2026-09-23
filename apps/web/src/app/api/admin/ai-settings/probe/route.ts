import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { probeAiProviders } from "@/server/ai-chat";

/** AI-RELIABILITY-01: har bir provayderni jonli sinab ko'radi va natijani
 * qaytaradi. Sabab: ilgari provayder ishlayaptimi-yo'qmi bilishning yagona
 * yo'li — foydalanuvchining shikoyati edi. Endi admin o'zi ko'radi.
 *
 * POST (GET emas) — chunki har chaqiruv haqiqiy API so'rovi yuboradi va
 * token sarflaydi; tasodifan qayta yuklanishdan himoya. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const results = await probeAiProviders();
    return NextResponse.json({ results });
  } catch (error) {
    return jsonError(error);
  }
}
