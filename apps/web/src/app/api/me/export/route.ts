import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { exportUserData } from "@/server/repo";

/**
 * PRIV-02 — foydalanuvchining O'Z ma'lumotini yuklab olish huquqi.
 *
 * Sog'liq ma'lumotini saqlaydigan ilova foydalanuvchiga uning ma'lumotini
 * mashina o'qiy oladigan formatda berishi kerak (GDPR 20-modda "ma'lumotni
 * ko'chirish huquqi" va O'zbekiston "Personal ma'lumotlar to'g'risida"gi
 * qonunining shunga o'xshash talabi).
 *
 * XAVFSIZLIK:
 *  • faqat `requireUser()` — foydalanuvchi FAQAT o'zining ma'lumotini oladi
 *    (hech qanday `userId` parametri qabul qilinmaydi, ya'ni boshqa
 *    odamning ma'lumotini so'rash mumkin emas);
 *  • javob `Content-Disposition: attachment` bilan — brauzerda ochilmaydi,
 *    faylga tushadi;
 *  • `Cache-Control: no-store` — sog'liq ma'lumoti keshda qolmasligi kerak.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const data = await exportUserData(user.id);
    const stamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="mammoai-malumotlarim-${stamp}.json"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
