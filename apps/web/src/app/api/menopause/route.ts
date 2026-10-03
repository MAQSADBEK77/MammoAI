import { NextResponse, type NextRequest } from "next/server";
import { MRS_ITEMS, daysBetween, lastFlowStreakStart, scoreMrs, tashkentDateStr } from "@mammoai/shared";
import { jsonError, requireUser } from "@/server/api-utils";
import { addMenopauseAssessment, getCycleSettings, listCycleLogs, listMenopauseAssessments } from "@/server/repo";

/**
 * MENO-02 — MRS natijalari.
 *
 * Ball SERVERDA qayta hisoblanadi: mijoz yuborgan `total`ga ishonib
 * bo'lmaydi, va bu raqam keyin shifokor hisobotiga tushadi.
 */
/**
 * MENO-02: oxirgi hayzdan beri necha oy o'tgan.
 *
 * Bosqich (perimenopauza / menopauza) aynan shunga bog'liq — yoshga
 * emas. Mijozda bu ma'lumot yo'q, shuning uchun server hisoblaydi:
 * avval haqiqiy qaydlardan, ular bo'lmasa onboarding javobidan.
 */
async function monthsSinceLastPeriod(userId: string): Promise<number | null> {
  const [logs, settings] = await Promise.all([listCycleLogs(userId, 1000), getCycleSettings(userId)]);
  const anchor = lastFlowStreakStart(logs) ?? settings?.lastPeriodStart ?? null;
  if (!anchor) return null;
  return Math.floor(daysBetween(anchor, tashkentDateStr()) / 30.44);
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const [assessments, months] = await Promise.all([
      listMenopauseAssessments(user.id),
      monthsSinceLastPeriod(user.id),
    ]);
    return NextResponse.json({ assessments, monthsSinceLastPeriod: months });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as { scores?: Record<string, unknown> };
    const clean: Record<string, number> = {};
    for (const item of MRS_ITEMS) {
      const raw = body.scores?.[item.id];
      if (typeof raw === "number" && Number.isFinite(raw)) {
        clean[item.id] = Math.max(0, Math.min(4, Math.round(raw)));
      }
    }
    const result = scoreMrs(clean);
    await addMenopauseAssessment(user.id, { scores: clean, total: result.total, severity: result.severity });
    return NextResponse.json({ assessments: await listMenopauseAssessments(user.id), result });
  } catch (error) {
    return jsonError(error);
  }
}
