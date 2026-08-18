import { NextResponse } from "next/server";
import { getAllAttempts } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { handleApiError } from "@/server/api-utils";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ attempts: getAllAttempts() });
  } catch (err) {
    return handleApiError(err);
  }
}
