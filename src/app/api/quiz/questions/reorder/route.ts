import { NextResponse } from "next/server";
import { reorderQuestions } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { ApiError, handleApiError } from "@/server/api-utils";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { ids } = (await request.json()) ?? {};
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
      throw new ApiError(400, "Noto'g'ri so'rov.");
    }
    reorderQuestions(ids);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
