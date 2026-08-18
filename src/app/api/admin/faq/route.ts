import { NextResponse } from "next/server";
import { createFaqItem, getFaqItems, logAdminAction } from "@/server/db";
import { requireAdmin, requireAdminOrModerator } from "@/server/session";
import { ApiError, handleApiError } from "@/server/api-utils";

export async function GET() {
  try {
    await requireAdminOrModerator();
    return NextResponse.json({ items: getFaqItems() });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = (await request.json()) ?? {};
    if (!body.question?.trim() || !body.answer?.trim()) {
      throw new ApiError(400, "Savol va javobni kiriting.");
    }
    const item = createFaqItem({
      order: Number(body.order) || 0,
      question: body.question.trim(),
      answer: body.answer.trim(),
      translations: body.translations,
    });
    logAdminAction(admin.id, `${admin.firstName} ${admin.lastName}`, "faq.create", item.question);
    return NextResponse.json({ item });
  } catch (err) {
    return handleApiError(err);
  }
}
