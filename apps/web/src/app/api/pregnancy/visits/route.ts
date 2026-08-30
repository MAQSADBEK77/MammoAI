import { NextResponse, type NextRequest } from "next/server";
import type { PregnancyVisitLog } from "@mammoai/shared";
import { jsonError, requireUser } from "@/server/api-utils";
import { addPregnancyVisit } from "@/server/repo";
import { buildPregnancyResponse } from "@/server/views";

/** Tashrif/eslatma jurnali — spec §3: "keyingi ginekolog tashrifi", sana, klinika. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as Pick<PregnancyVisitLog, "label" | "date" | "clinicName" | "note">;
    if (!body.label || !body.date) {
      return NextResponse.json({ error: "Nom va sana kerak" }, { status: 400 });
    }
    await addPregnancyVisit(user.id, body);
    return NextResponse.json(await buildPregnancyResponse(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
