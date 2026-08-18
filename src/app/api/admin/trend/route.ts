import { NextResponse } from "next/server";
import { getDailyTrend } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { handleApiError } from "@/server/api-utils";

const DAYS = 30;

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ trend: getDailyTrend(DAYS) });
  } catch (err) {
    return handleApiError(err);
  }
}
