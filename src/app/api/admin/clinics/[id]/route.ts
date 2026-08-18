import { NextResponse } from "next/server";
import { deleteClinic, logAdminAction, updateClinic } from "@/server/db";
import { requireAdmin } from "@/server/session";
import { ApiError, handleApiError } from "@/server/api-utils";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = (await request.json()) ?? {};
    if (!body.name?.trim()) {
      throw new ApiError(400, "Nomini kiriting.");
    }
    const clinic = updateClinic(id, {
      order: Number(body.order) || 0,
      name: body.name.trim(),
      address: body.address?.trim() ?? "",
      phone: body.phone?.trim() ?? "",
      note: body.note?.trim() ?? "",
    });
    logAdminAction(admin.id, `${admin.firstName} ${admin.lastName}`, "clinic.update", clinic.name);
    return NextResponse.json({ clinic });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    deleteClinic(id);
    logAdminAction(admin.id, `${admin.firstName} ${admin.lastName}`, "clinic.delete", id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
