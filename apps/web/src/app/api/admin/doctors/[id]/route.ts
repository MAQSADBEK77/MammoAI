import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { setDoctorActive, updateDoctor, type DoctorInput } from "@/server/repo";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    const body = (await request.json()) as DoctorInput;
    if (!body.fullName?.trim() || !body.specialty?.trim()) {
      return NextResponse.json({ error: "Ism va mutaxassislik kerak" }, { status: 400 });
    }
    await updateDoctor(id, { ...body, fullName: body.fullName.trim() });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * DELETE — bu yerda O'CHIRISH EMAS, faolsizlantirish.
 *
 * Haqiqiy o'chirish `doctor_ratings`ni CASCADE bilan olib ketardi, ya'ni
 * yomon baho olgan shifokorni o'chirib-qayta qo'shish orqali tarixini
 * tozalash mumkin bo'lardi. Reytingning butun ma'nosi shunda yo'qolardi.
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    await setDoctorActive(id, false);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
