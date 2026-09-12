import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { listBlockedUsers } from "@/server/repo";

/** "Bloklangan foydalanuvchilar" ro'yxati — profil/jamiyat sozlamalarida
 * bekor qilish (unblock) imkonini berish uchun. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    return NextResponse.json({ blocked: await listBlockedUsers(user.id) });
  } catch (error) {
    return jsonError(error);
  }
}
