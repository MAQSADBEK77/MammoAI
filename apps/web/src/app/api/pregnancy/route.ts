import { NextResponse, type NextRequest } from "next/server";
import { dueDateFromLmp, lmpFromDueDate, tashkentDateStr } from "@mammoai/shared";
import type { PregnancyProfile } from "@mammoai/shared";
import { ApiError, jsonError, requireUser } from "@/server/api-utils";
import { updatePregnancyProfile } from "@/server/repo";
import { buildPregnancyResponse } from "@/server/views";
import { syncChecklistForUser } from "@/server/checklist-sync";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    return NextResponse.json(await buildPregnancyResponse(user.id));
  } catch (error) {
    return jsonError(error);
  }
}

/** Tug'ilish sanasi kalkulyatori — oxirgi hayz yoki homiladorlik sanasidan (spec §3). */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as Partial<Pick<PregnancyProfile, "lastMenstrualPeriod" | "dueDate" | "outcome" | "endedOn">>;

    const patch: Partial<Pick<PregnancyProfile, "lastMenstrualPeriod" | "dueDate" | "outcome" | "endedOn">> = {};
    if (body.lastMenstrualPeriod) {
      patch.lastMenstrualPeriod = body.lastMenstrualPeriod;
      patch.dueDate = dueDateFromLmp(body.lastMenstrualPeriod);
    } else if (body.dueDate) {
      patch.dueDate = body.dueDate;
      patch.lastMenstrualPeriod = lmpFromDueDate(body.dueDate);
    }

    // PREG-END-01: homiladorlik natijasi. Faqat ikkita qiymat qabul
    // qilinadi — noma'lum satr bazaga tushib, keyin holatni chalkashtirib
    // yuborishi mumkin edi.
    if (body.outcome !== undefined) {
      if (body.outcome !== null && body.outcome !== "birth" && body.outcome !== "loss") {
        throw new ApiError(400, "Homiladorlik natijasi noto'g'ri");
      }
      patch.outcome = body.outcome;
      patch.endedOn = body.outcome ? (body.endedOn ?? tashkentDateStr()) : null;
    }

    await updatePregnancyProfile(user.id, patch);
    await syncChecklistForUser(user.id);
    return NextResponse.json(await buildPregnancyResponse(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
