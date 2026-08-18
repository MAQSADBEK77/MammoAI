import { NextResponse } from "next/server";
import { getSelfExamMonths, markSelfExamDone, unmarkSelfExamDone } from "@/server/db";
import { requireUser } from "@/server/session";
import { ApiError, handleApiError } from "@/server/api-utils";

const MONTH_RE = /^\d{4}-\d{2}$/;

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ months: getSelfExamMonths(user.id) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { month, done } = (await request.json()) ?? {};
    if (typeof month !== "string" || !MONTH_RE.test(month)) {
      throw new ApiError(400, "Oy formati noto'g'ri.");
    }
    if (done === false) unmarkSelfExamDone(user.id, month);
    else markSelfExamDone(user.id, month);
    return NextResponse.json({ ok: true, months: getSelfExamMonths(user.id) });
  } catch (err) {
    return handleApiError(err);
  }
}
