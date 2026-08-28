import { NextResponse, type NextRequest } from "next/server";
import type { ReferralAction } from "@mammoai/shared";
import { jsonError, requireUser } from "@/server/api-utils";
import { logReferralEvent } from "@/server/repo";

/**
 * Referral kuzatuvi — spec §5: "bu funksiyaning asosiy maqsadi". Har "ko'rish",
 * "qo'ng'iroq qilish", "yo'l ko'rsatish" bosishi shu yerda qayd etiladi.
 */
export async function POST(request: NextRequest) {
  try {
    const user = requireUser(request);
    const body = (await request.json()) as {
      clinicId: string;
      checklistItemId?: string | null;
      action: ReferralAction;
    };
    if (!body.clinicId || !body.action) {
      return NextResponse.json({ error: "clinicId va action kerak" }, { status: 400 });
    }
    logReferralEvent(user.id, {
      clinicId: body.clinicId,
      checklistItemId: body.checklistItemId ?? null,
      action: body.action,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
