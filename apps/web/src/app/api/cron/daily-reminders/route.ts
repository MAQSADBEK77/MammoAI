import { NextResponse, type NextRequest } from "next/server";
import { runDailyReminders } from "@/server/daily-reminders";

/**
 * Vercel Cron kuniga bir marta chaqiradi (vercel.json: har kuni soat 15:00 UTC
 * = 20:00 Toshkent vaqti). Vercel bu so'rovga avtomatik
 * `Authorization: Bearer <CRON_SECRET>` sarlavhasini qo'shadi (`CRON_SECRET`
 * muhit o'zgaruvchisi sozlangan bo'lsa) — shu orqali tashqi chaqiruvlardan
 * himoyalanadi.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const results = await runDailyReminders();
  const sentCount = results.filter((r) => r.sent).length;
  const errorCount = results.filter((r) => r.error).length;
  return NextResponse.json({ ok: true, total: results.length, sent: sentCount, errors: errorCount, results });
}
