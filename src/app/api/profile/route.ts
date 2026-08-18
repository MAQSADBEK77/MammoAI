import { NextResponse } from "next/server";
import { updateUserProfile, toPublicUser } from "@/server/db";
import { requireUser } from "@/server/session";
import { handleApiError, ApiError } from "@/server/api-utils";

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) ?? {};

    const patch: Record<string, string> = {};
    for (const key of ["firstName", "lastName", "birthDate", "passportSeries", "phone"] as const) {
      if (typeof body[key] === "string") patch[key] = body[key];
    }
    if (patch.passportSeries) patch.passportSeries = patch.passportSeries.toUpperCase();

    if (!patch.firstName?.trim() || !patch.lastName?.trim()) {
      throw new ApiError(400, "Ism va familiyani kiriting.");
    }

    const updated = updateUserProfile(user.id, patch);
    if (!updated) throw new ApiError(404, "Foydalanuvchi topilmadi.");

    return NextResponse.json({ user: toPublicUser(updated) });
  } catch (err) {
    return handleApiError(err);
  }
}
