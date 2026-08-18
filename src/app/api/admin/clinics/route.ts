import { NextResponse } from "next/server";
import { createClinic, getClinics, logAdminAction } from "@/server/db";
import { requireAdmin, requireAdminOrModerator } from "@/server/session";
import { ApiError, handleApiError } from "@/server/api-utils";

export async function GET() {
  try {
    await requireAdminOrModerator();
    return NextResponse.json({ clinics: getClinics() });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = (await request.json()) ?? {};
    if (!body.name?.trim()) {
      throw new ApiError(400, "Nomini kiriting.");
    }
    const clinic = createClinic({
      order: Number(body.order) || 0,
      name: body.name.trim(),
      address: body.address?.trim() ?? "",
      phone: body.phone?.trim() ?? "",
      note: body.note?.trim() ?? "",
    });
    logAdminAction(admin.id, `${admin.firstName} ${admin.lastName}`, "clinic.create", clinic.name);
    return NextResponse.json({ clinic });
  } catch (err) {
    return handleApiError(err);
  }
}
