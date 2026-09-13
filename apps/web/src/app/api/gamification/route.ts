import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { listCycleLogs } from "@/server/repo";
import { computeStreaks, computeEarnedBadges, tashkentDateStr } from "@mammoai/shared";

/** Gamifikatsiya — kunlik yozuv ketma-ketligi ("streak") + yutuq nishonlari.
 * ATAYLAB Premium EMAS — kundalik foydalanishga undash uchun, hamma ko'rishi
 * kerak. Ommaviy reyting yo'q (sog'liq ma'lumoti shaxsiy). */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const logs = await listCycleLogs(user.id, 3650); // butun tarix — streak/nishonlar uchun kesish shart emas
    // FIX2-23: `localDateStr()` JS runtime'ning TZ sozlamasiga tayanadi —
    // Vercel'da TZ o'rnatilmagan (standart UTC), shuning uchun bu Toshkent
    // mahalliy 00:00-04:59 oralig'ida streak-hisoblashni buzardi (kechagi
    // yozuvli ketma-ketlik "hali davom etyapti" deb noto'g'ri hisoblanardi).
    const stats = computeStreaks(
      logs.map((l) => l.date),
      tashkentDateStr()
    );
    const badges = computeEarnedBadges(stats);
    return NextResponse.json({ ...stats, badges });
  } catch (error) {
    return jsonError(error);
  }
}
