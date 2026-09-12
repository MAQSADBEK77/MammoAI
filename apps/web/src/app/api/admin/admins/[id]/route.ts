import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { deleteAdminUser, logAdminAction } from "@/server/repo";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const identity = requireAdmin(request);
    const { id } = await context.params;
    await deleteAdminUser(id);
    await logAdminAction(identity.adminLabel, "admin_deleted", id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
