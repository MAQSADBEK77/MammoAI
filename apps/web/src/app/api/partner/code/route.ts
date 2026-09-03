import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { createPartnerInviteCode, getPartnerStatus } from "@/server/repo";

/** Hamkorga ulashish uchun kod yaratadi (mavjud, muddati o'tmagan kodi
 * bo'lsa o'shani qaytaradi). */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await createPartnerInviteCode(user.id);
    return NextResponse.json(await getPartnerStatus(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
