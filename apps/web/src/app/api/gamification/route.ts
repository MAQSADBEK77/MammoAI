import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { listCycleLogs } from "@/server/repo";
import { computeStreaks, computeEarnedBadges, localDateStr } from "@mammoai/shared";

/** Gamifikatsiya — kunlik yozuv ketma-ketligi ("streak") + yutuq nishonlari.
 * ATAYLAB Premium EMAS — kundalik foydalanishga undash uchun, hamma ko'rishi
 * kerak. Ommaviy reyting yo'q (sog'liq ma'lumoti shaxsiy). */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const logs = await listCycleLogs(user.id, 3650); // butun tarix — streak/nishonlar uchun kesish shart emas
    const stats = computeStreaks(
      logs.map((l) => l.date),
      localDateStr()
    );
    const badges = computeEarnedBadges(stats);
    return NextResponse.json({ ...stats, badges });
  } catch (error) {
    return jsonError(error);
  }
}
