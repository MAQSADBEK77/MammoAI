import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { deleteUserAdmin, updateUser, logAdminAction } from "@/server/repo";
import type { User } from "@mammoai/shared";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const identity = requireAdmin(request);
    const { id } = await context.params;
    const patch = (await request.json()) as Partial<
      Pick<User, "name" | "phone" | "language" | "fontScale" | "theme" | "notificationsEnabled" | "isBlocked">
    >;
    const updated = await updateUser(id, patch);
    // ADMIN-001: faqat moderatsiyaga tegishli maydon (bloklash) audit-jurnalga
    // yoziladi — profil ma'lumotini o'zgartirish (til, shrift) kundalik
    // texnik-yordam ishi, jurnalni chalg'itmaslik uchun yozilmaydi.
    if (typeof patch.isBlocked === "boolean") {
      await logAdminAction(identity.adminLabel, patch.isBlocked ? "user_blocked" : "user_unblocked", `user=${id}`);
    }
    return NextResponse.json(updated);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const identity = requireAdmin(request);
    const { id } = await context.params;
    await deleteUserAdmin(id);
    await logAdminAction(identity.adminLabel, "user_deleted", `user=${id}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
