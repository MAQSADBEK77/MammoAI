import { NextResponse } from "next/server";
import { deleteUser, getUserById } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { ApiError, handleApiError } from "@/server/api-utils";

// Deleting a user (and, via ON DELETE CASCADE, their quiz attempts) is only
// ever reachable through this admin-only route — there is no user-facing
// "delete my account" endpoint.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const target = getUserById(id);
    if (!target) throw new ApiError(404, "Foydalanuvchi topilmadi.");
    if (target.role === "admin") {
      throw new ApiError(400, "Administrator hisobini o'chirib bo'lmaydi.");
    }

    deleteUser(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
