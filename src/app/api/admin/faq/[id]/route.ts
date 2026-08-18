import { NextResponse } from "next/server";
import { deleteFaqItem, logAdminAction, updateFaqItem } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { ApiError, handleApiError } from "@/server/api-utils";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = (await request.json()) ?? {};
    if (!body.question?.trim() || !body.answer?.trim()) {
      throw new ApiError(400, "Savol va javobni kiriting.");
    }
    const item = updateFaqItem(id, {
      order: Number(body.order) || 0,
      question: body.question.trim(),
      answer: body.answer.trim(),
      translations: body.translations,
    });
    logAdminAction(admin.id, `${admin.firstName} ${admin.lastName}`, "faq.update", item.question);
    return NextResponse.json({ item });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    deleteFaqItem(id);
    logAdminAction(admin.id, `${admin.firstName} ${admin.lastName}`, "faq.delete", id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
