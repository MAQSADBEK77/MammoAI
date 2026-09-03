import { NextResponse, type NextRequest } from "next/server";
import type { PartnerShareSettings } from "@mammoai/shared";
import { jsonError, requireUser } from "@/server/api-utils";
import { updatePartnerSharing, getPartnerStatus } from "@/server/repo";

/** Joriy foydalanuvchining hamkoriga nima ulashishini yangilaydi. */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as PartnerShareSettings;
    await updatePartnerSharing(user.id, {
      pregnancy: !!body.pregnancy,
      checkups: !!body.checkups,
      mood: !!body.mood,
      period: !!body.period,
    });
    return NextResponse.json(await getPartnerStatus(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
