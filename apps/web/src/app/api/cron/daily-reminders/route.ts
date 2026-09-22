import { NextResponse, type NextRequest } from "next/server";
import { runDailyReminders } from "@/server/daily-reminders";

/**
 * Vercel Cron kuniga bir marta chaqiradi (vercel.json: har kuni 15:00 UTC
 * = 20:00 Toshkent vaqti) va so'rovga `Authorization: Bearer <CRON_SECRET>`
 * sarlavhasini qo'shadi.
 *
 * SEC-01 (2026-09-22) — ilgari himoya "agar secret sozlangan bo'lsa"
 * shartiga bog'langan edi:
 *
 *     const secret = process.env.CRON_SECRET;
 *     if (secret) { ...tekshirish... }
 *
 * Ya'ni `CRON_SECRET` sozlanmagan bo'lsa, tekshiruv HAM bo'lmasdi va manzil
 * butunlay ochiq qolardi. `CRON_SECRET` esa `.env.example`da umuman
 * yozilmagan edi, ya'ni uni sozlash kerakligi hech qayerda aytilmagan.
 *
 * Oqibati: istalgan odam bu manzilni chaqirib, barcha foydalanuvchilarga
 * (hozir 139 tasida Telegram bog'langan) xabar yuborishi mumkin edi —
 * cheklovsiz, kuniga xohlagancha marta.
 *
 * Endi himoya "fail-closed": secret yo'q bo'lsa, ish BAJARILMAYDI. Ochiq
 * qolgandan ko'ra bir kun eslatma yubormaslik xavfsizroq.
 *
 * TEKSHIRISH (xabar yubormasdan): shu manzilni brauzerda oching —
 *   • 503 + "cron_secret_not_configured" → Vercel'da CRON_SECRET yo'q,
 *     eslatmalar ishlamaydi, uni qo'shish kerak;
 *   • 401 → secret sozlangan va himoya ishlayapti (kutilgan holat).
 * Ikkala holatda ham hech kimga xabar ketmaydi.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      {
        error: "cron_secret_not_configured",
        hint: "Vercel → Settings → Environment Variables → CRON_SECRET qo'shing, keyin qayta deploy qiling.",
      },
      { status: 503 }
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await runDailyReminders();
  const sentCount = results.filter((r) => r.sent).length;
  const errorCount = results.filter((r) => r.error).length;
  return NextResponse.json({ ok: true, total: results.length, sent: sentCount, errors: errorCount, results });
}
