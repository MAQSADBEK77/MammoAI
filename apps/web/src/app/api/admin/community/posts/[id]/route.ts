import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { deleteCommunityPostAdmin, updateCommunityPostAdmin } from "@/server/repo";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(request);
    const { id } = await context.params;
    const { body } = (await request.json()) as { body: string };
    if (!body || !body.trim()) {
      return NextResponse.json({ error: "Matn bo'sh bo'lishi mumkin emas" }, { status: 400 });
    }
    await updateCommunityPostAdmin(id, body.trim());
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(request);
    const { id } = await context.params;
    await deleteCommunityPostAdmin(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
