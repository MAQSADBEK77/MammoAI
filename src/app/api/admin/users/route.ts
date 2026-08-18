import { NextResponse } from "next/server";
import { getAllUsersWithLatestAttempt } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { handleApiError } from "@/server/api-utils";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ users: getAllUsersWithLatestAttempt() });
  } catch (err) {
    return handleApiError(err);
  }
}
