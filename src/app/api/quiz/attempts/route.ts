import { NextResponse } from "next/server";
import { getAttemptsForUser, submitAttempt } from "@/server/db";
import { requireUser } from "@/server/session";
import { ApiError, handleApiError } from "@/server/api-utils";

// The current user's own attempt history.
export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ attempts: getAttemptsForUser(user.id) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { answers } = (await request.json()) ?? {};
    if (!Array.isArray(answers) || answers.length === 0) {
      throw new ApiError(400, "Javoblar topilmadi.");
    }
    const attempt = submitAttempt(user.id, answers);
    return NextResponse.json({ attempt });
  } catch (err) {
    return handleApiError(err);
  }
}
