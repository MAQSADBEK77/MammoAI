import { NextResponse } from "next/server";
import { getAllAttempts } from "@/server/db";
import { requireAdminOrModerator } from "@/server/session";
import { handleApiError } from "@/server/api-utils";

export async function GET() {
  try {
    await requireAdminOrModerator();
    return NextResponse.json({ attempts: getAllAttempts() });
  } catch (err) {
    return handleApiError(err);
  }
}
