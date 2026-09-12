import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import {
  adminSessionCookieOptions,
  ADMIN_SESSION_COOKIE,
  signAdminSession,
  signRootAdminSession,
  verifyAdminPassword,
  verifyAdminPasswordHash,
} from "@/server/admin-auth";
import { findAdminUserByEmail, logAdminAction } from "@/server/repo";

/**
 * ADMIN-001: ikkita yo'l bilan kirish mumkin —
 * (1) `{ email, password }` — alohida admin hisobi (admin_users jadvali).
 * (2) `{ password }` — eski umumiy "root" parol (ADMIN_PASSWORD), hisob
 *     unutilgan/yo'q holatda ham kirish imkoniyati yo'qolmasligi uchun
 *     ATAYLAB saqlab qolingan.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const password = body.password ?? "";
    const res = NextResponse.json({ ok: true });

    if (body.email) {
      const admin = await findAdminUserByEmail(body.email);
      if (!admin || !verifyAdminPasswordHash(password, admin.passwordHash)) {
        return NextResponse.json({ error: "Email yoki parol noto'g'ri" }, { status: 401 });
      }
      res.cookies.set(ADMIN_SESSION_COOKIE, signAdminSession({ adminId: admin.id, adminLabel: admin.name }), adminSessionCookieOptions);
      logAdminAction(admin.name, "login").catch(() => {});
      return res;
    }

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: "Parol noto'g'ri" }, { status: 401 });
    }
    res.cookies.set(ADMIN_SESSION_COOKIE, signRootAdminSession(), adminSessionCookieOptions);
    return res;
  } catch (error) {
    return jsonError(error);
  }
}
