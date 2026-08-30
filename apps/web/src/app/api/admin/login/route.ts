import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { adminSessionCookieOptions, ADMIN_SESSION_COOKIE, signAdminSession, verifyAdminPassword } from "@/server/admin-auth";

/** Admin panelga kirish — bitta umumiy parol (ADMIN_PASSWORD muhit o'zgaruvchisi). */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { password?: string };
    if (!verifyAdminPassword(body.password ?? "")) {
      return NextResponse.json({ error: "Parol noto'g'ri" }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_SESSION_COOKIE, signAdminSession(), adminSessionCookieOptions);
    return res;
  } catch (error) {
    return jsonError(error);
  }
}
