import { NextResponse } from "next/server";
import { deleteFeedback, logAdminAction } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { handleApiError } from "@/server/api-utils";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    deleteFeedback(id);
    logAdminAction(admin.id, `${admin.firstName} ${admin.lastName}`, "feedback.delete", id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
