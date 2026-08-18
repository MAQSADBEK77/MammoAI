import { NextResponse } from "next/server";
import { getDailyTrend } from "@/server/db";
import { requireAdminOrModerator } from "@/server/session";
import { handleApiError } from "@/server/api-utils";

const DAYS = 30;

export async function GET() {
  try {
    await requireAdminOrModerator();
    return NextResponse.json({ trend: getDailyTrend(DAYS) });
  } catch (err) {
    return handleApiError(err);
  }
}
