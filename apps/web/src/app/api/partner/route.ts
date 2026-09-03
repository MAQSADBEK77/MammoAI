import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { getPartnerStatus, disconnectPartner } from "@/server/repo";

/** Joriy foydalanuvchining hamkor holati — ulangan/ulanmaganligi, ulashish
 * sozlamalari va hamkorning ulashgan ma'lumotlari. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    return NextResponse.json(await getPartnerStatus(user.id));
  } catch (error) {
    return jsonError(error);
  }
}

/** Hamkordan uzilish. */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await disconnectPartner(user.id);
    return NextResponse.json(await getPartnerStatus(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
