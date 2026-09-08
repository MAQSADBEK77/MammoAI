import { NextResponse, type NextRequest } from "next/server";
import type { ChecklistResponse } from "@mammoai/shared";
import { jsonError, requireUser } from "@/server/api-utils";
import { getOnboardingProfile, getPartnerChecklistItems, listChecklistItems } from "@/server/repo";
import { syncChecklistForUser } from "@/server/checklist-sync";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const profile = await getOnboardingProfile(user.id);

    // "Hamkorimni kuzataman" — o'zining checklist'i yo'q (checklist-sync.ts
    // ataylab yaratmaydi), o'rniga ulangan hamkorining ro'yxati READ-ONLY
    // ko'rsatiladi.
    if (profile?.primaryGoal === "partner_tracking") {
      const { items, emptyReason, partnerName } = await getPartnerChecklistItems(user.id);
      return NextResponse.json({ items, readOnly: true, emptyReason, partnerName } satisfies ChecklistResponse);
    }

    await syncChecklistForUser(user.id, profile ?? undefined);
    const items = await listChecklistItems(user.id);
    return NextResponse.json({ items, readOnly: false, emptyReason: null, partnerName: null } satisfies ChecklistResponse);
  } catch (error) {
    return jsonError(error);
  }
}
