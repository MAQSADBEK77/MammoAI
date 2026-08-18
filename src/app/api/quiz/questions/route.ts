import { NextResponse } from "next/server";
import { createQuestion, getQuestions } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { handleApiError } from "@/server/api-utils";
import { validateQuestionBody } from "@/server/validate";

// Public — the test page needs this without being logged in as admin.
export async function GET() {
  return NextResponse.json({ questions: getQuestions() });
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const data = validateQuestionBody(body);
    const question = createQuestion(data);
    return NextResponse.json({ question });
  } catch (err) {
    return handleApiError(err);
  }
}
