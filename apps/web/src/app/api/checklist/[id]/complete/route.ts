import { NextResponse, type NextRequest } from "next/server";
import type { ChecklistResponse } from "@mammoai/shared";
import { jsonError, requireUser } from "@/server/api-utils";
import { completeChecklistItem, listChecklistItems } from "@/server/repo";

/** "Bajardim" tugmasi — spec §4: bajarilganlik belgisi natija (outcome) ma'lumoti.
 * Faqat o'zining checklist'i uchun — "Hamkorimni kuzataman" foydalanuvchisi
 * hamkorining ro'yxatini READ-ONLY ko'radi, bu tugma u yerda ko'rsatilmaydi. */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    await completeChecklistItem(user.id, id);
    const items = await listChecklistItems(user.id);
    return NextResponse.json({ items, readOnly: false, emptyReason: null, partnerName: null } satisfies ChecklistResponse);
  } catch (error) {
    return jsonError(error);
  }
}
