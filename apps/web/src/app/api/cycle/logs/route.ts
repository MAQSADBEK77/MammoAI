import { NextResponse, type NextRequest } from "next/server";
import type { CycleLog } from "@mammoai/shared";
import { ApiError, jsonError, requireUser } from "@/server/api-utils";
import { upsertCycleLog } from "@/server/repo";
import { buildCycleResponse } from "@/server/views";
import { syncChecklistForUser } from "@/server/checklist-sync";

// CYCLE-ALGO-15: haqiqiy inson BBT'si (Selsiyda) hech qachon bu oraliqdan
// tashqarida bo'lmaydi — buzuq/xato kiritilgan qiymat (masalan Farengeyt
// bilan adashtirilgan "98.6") algoritmga tushib, noto'g'ri "ovulyatsiya
// sakrashi" aniqlashiga sabab bo'lmasin.
const MIN_BBT_C = 34;
const MAX_BBT_C = 42;

/** Bir bosishda kunlik belgilash (spec §2: oqim, kayfiyat, ~8 ikonka-simptom). */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as Pick<CycleLog, "date" | "flow" | "mood" | "symptoms"> & Partial<Pick<CycleLog, "basalBodyTemp">>;
    if (!body.date) return NextResponse.json({ error: "Sana kerak" }, { status: 400 });
    if (body.basalBodyTemp != null) {
      const t = body.basalBodyTemp;
      if (typeof t !== "number" || Number.isNaN(t) || t < MIN_BBT_C || t > MAX_BBT_C) {
        throw new ApiError(400, `Harorat ${MIN_BBT_C}-${MAX_BBT_C}°C oralig'ida bo'lishi kerak`);
      }
    }

    await upsertCycleLog(user.id, body);
    await syncChecklistForUser(user.id); // tartibsizlik aniqlansa checklist'ga ko'prik yaratiladi
    return NextResponse.json(await buildCycleResponse(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
