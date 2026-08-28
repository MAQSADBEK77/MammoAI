import { NextResponse, type NextRequest } from "next/server";
import type { CycleLog } from "@mammoai/shared";
import { jsonError, requireUser } from "@/server/api-utils";
import { upsertCycleLog } from "@/server/repo";
import { buildCycleResponse } from "@/server/views";
import { syncChecklistForUser } from "@/server/checklist-sync";

/** Bir bosishda kunlik belgilash (spec §2: oqim, kayfiyat, ~8 ikonka-simptom). */
export async function POST(request: NextRequest) {
  try {
    const user = requireUser(request);
    const body = (await request.json()) as Pick<CycleLog, "date" | "flow" | "mood" | "symptoms">;
    if (!body.date) return NextResponse.json({ error: "Sana kerak" }, { status: 400 });

    upsertCycleLog(user.id, body);
    syncChecklistForUser(user.id); // tartibsizlik aniqlansa checklist'ga ko'prik yaratiladi
    return NextResponse.json(buildCycleResponse(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
