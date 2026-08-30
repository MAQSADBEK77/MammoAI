import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";

/** Klient tomonda admin sessiyasi hali kuchdami-yo'qmi tekshirish uchun. */
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
