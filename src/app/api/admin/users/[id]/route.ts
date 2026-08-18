import { NextResponse } from "next/server";
import { deleteUser, getUserById, logAdminAction, setUserRole, toPublicUser } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { ApiError, handleApiError } from "@/server/api-utils";

// Deleting a user (and, via ON DELETE CASCADE, their quiz attempts) is only
// ever reachable through this admin-only route — there is no user-facing
// "delete my account" endpoint.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    const target = getUserById(id);
    if (!target) throw new ApiError(404, "Foydalanuvchi topilmadi.");
    if (target.role === "admin") {
      throw new ApiError(400, "Administrator hisobini o'chirib bo'lmaydi.");
    }

    deleteUser(id);
    logAdminAction(admin.id, `${admin.firstName} ${admin.lastName}`, "user.delete", `${target.email}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

// Promote a regular user to moderator, or demote a moderator back to a
// regular user. Full admin only — a moderator can't grant itself more
// access, and nobody can touch the "admin" role through this route.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { role } = (await request.json()) ?? {};
    if (role !== "user" && role !== "moderator") {
      throw new ApiError(400, "Noto'g'ri rol.");
    }
    const target = getUserById(id);
    if (!target) throw new ApiError(404, "Foydalanuvchi topilmadi.");
    if (target.role === "admin") {
      throw new ApiError(400, "Administrator rolini o'zgartirib bo'lmaydi.");
    }
    const updated = setUserRole(id, role);
    logAdminAction(admin.id, `${admin.firstName} ${admin.lastName}`, `user.role.${role}`, target.email);
    return NextResponse.json({ user: toPublicUser(updated) });
  } catch (err) {
    return handleApiError(err);
  }
}
