import { NextResponse } from "next/server";
import { deleteQuestion, getQuestionById, logAdminAction, updateQuestion } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { ApiError, handleApiError } from "@/server/api-utils";
import { validateQuestionBody } from "@/server/validate";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const existing = getQuestionById(id);
    if (!existing) throw new ApiError(404, "Savol topilmadi.");

    const body = await request.json();
    const data = validateQuestionBody({ order: existing.order, ...body });
    const question = updateQuestion(id, data);
    logAdminAction(admin.id, `${admin.firstName} ${admin.lastName}`, "quiz.update", question.text);
    return NextResponse.json({ question });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const existing = getQuestionById(id);
    deleteQuestion(id);
    logAdminAction(admin.id, `${admin.firstName} ${admin.lastName}`, "quiz.delete", existing?.text ?? id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
