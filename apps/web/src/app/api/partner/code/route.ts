import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireRegisteredUser } from "@/server/api-utils";
import { createPartnerInviteCode, getPartnerStatus } from "@/server/repo";

/** Hamkorga ulashish uchun kod yaratadi (mavjud, muddati o'tmagan kodi
 * bo'lsa o'shani qaytaradi). */
export async function POST(request: NextRequest) {
  try {
    // AUTH-05: hamkor ulanishi hisobga bog'lanadi — tiklab bo'lmaydigan
    // anonim hisobga ulansa, hisob yo'qolganda aloqa ham yo'qoladi.
    const user = await requireRegisteredUser(request, "partner");
    await createPartnerInviteCode(user.id);
    return NextResponse.json(await getPartnerStatus(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
