import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { deleteCycleLog } from "@/server/repo";
import { buildCycleResponse } from "@/server/views";
import { syncChecklistForUser } from "@/server/checklist-sync";

/** CYCLE-002: xato qayd etilgan kunlik yozuvni butunlay o'chirish. */
export async function DELETE(request: NextRequest, context: { params: Promise<{ date: string }> }) {
  try {
    const user = await requireUser(request);
    const { date } = await context.params;
    await deleteCycleLog(user.id, date);
    await syncChecklistForUser(user.id);
    return NextResponse.json(await buildCycleResponse(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
