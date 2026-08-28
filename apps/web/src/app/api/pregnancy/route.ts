import { NextResponse, type NextRequest } from "next/server";
import { dueDateFromLmp, lmpFromDueDate } from "@mammoai/shared";
import type { PregnancyProfile } from "@mammoai/shared";
import { jsonError, requireUser } from "@/server/api-utils";
import { updatePregnancyProfile } from "@/server/repo";
import { buildPregnancyResponse } from "@/server/views";
import { syncChecklistForUser } from "@/server/checklist-sync";

export async function GET(request: NextRequest) {
  try {
    const user = requireUser(request);
    return NextResponse.json(buildPregnancyResponse(user.id));
  } catch (error) {
    return jsonError(error);
  }
}

/** Tug'ilish sanasi kalkulyatori — oxirgi hayz yoki homiladorlik sanasidan (spec §3). */
export async function PATCH(request: NextRequest) {
  try {
    const user = requireUser(request);
    const body = (await request.json()) as Partial<Pick<PregnancyProfile, "lastMenstrualPeriod" | "dueDate">>;

    const patch: Partial<Pick<PregnancyProfile, "lastMenstrualPeriod" | "dueDate">> = {};
    if (body.lastMenstrualPeriod) {
      patch.lastMenstrualPeriod = body.lastMenstrualPeriod;
      patch.dueDate = dueDateFromLmp(body.lastMenstrualPeriod);
    } else if (body.dueDate) {
      patch.dueDate = body.dueDate;
      patch.lastMenstrualPeriod = lmpFromDueDate(body.dueDate);
    }

    updatePregnancyProfile(user.id, patch);
    syncChecklistForUser(user.id);
    return NextResponse.json(buildPregnancyResponse(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
