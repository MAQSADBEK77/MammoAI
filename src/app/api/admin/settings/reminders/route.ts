import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/server/db";
import { requireAdmin, requireAdminOrModerator } from "@/server/session";
import { ApiError, handleApiError } from "@/server/api-utils";

// Defaults match what scripts/telegram-bot.mjs used before these became
// admin-configurable — see RETEST_DAYS / SELF_EXAM_INTERVAL_DAYS there.
const DEFAULT_RETEST_DAYS = 90;
const DEFAULT_SELF_EXAM_DAYS = 30;

export async function GET() {
  try {
    await requireAdminOrModerator();
    return NextResponse.json({
      retestDays: Number(getSetting("retest_days")) || DEFAULT_RETEST_DAYS,
      selfExamDays: Number(getSetting("self_exam_days")) || DEFAULT_SELF_EXAM_DAYS,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { retestDays, selfExamDays } = (await request.json()) ?? {};
    const rd = Number(retestDays);
    const sd = Number(selfExamDays);
    if (!Number.isInteger(rd) || rd < 1 || rd > 3650) {
      throw new ApiError(400, "Qayta test eslatmasi uchun kunlar soni noto'g'ri.");
    }
    if (!Number.isInteger(sd) || sd < 1 || sd > 3650) {
      throw new ApiError(400, "O'z-tekshiruv eslatmasi uchun kunlar soni noto'g'ri.");
    }
    setSetting("retest_days", String(rd));
    setSetting("self_exam_days", String(sd));
    return NextResponse.json({ ok: true, retestDays: rd, selfExamDays: sd });
  } catch (err) {
    return handleApiError(err);
  }
}
