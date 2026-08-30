import { NextResponse, type NextRequest } from "next/server";
import type { CycleSettings } from "@mammoai/shared";
import { jsonError, requireUser } from "@/server/api-utils";
import { updateCycleSettings } from "@/server/repo";
import { buildCycleResponse } from "@/server/views";

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const patch = (await request.json()) as Partial<
      Pick<CycleSettings, "lastPeriodStart" | "averageCycleLength" | "averagePeriodLength">
    >;
    await updateCycleSettings(user.id, patch);
    return NextResponse.json(await buildCycleResponse(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
