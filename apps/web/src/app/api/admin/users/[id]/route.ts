import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { deleteUserAdmin, updateUser } from "@/server/repo";
import type { User } from "@mammoai/shared";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(request);
    const { id } = await context.params;
    const patch = (await request.json()) as Partial<
      Pick<User, "name" | "phone" | "language" | "fontScale" | "highContrast" | "notificationsEnabled">
    >;
    const updated = await updateUser(id, patch);
    return NextResponse.json(updated);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(request);
    const { id } = await context.params;
    await deleteUserAdmin(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
