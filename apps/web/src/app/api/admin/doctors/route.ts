import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { createDoctor, listDoctorsAdmin, type DoctorInput } from "@/server/repo";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    return NextResponse.json(await listDoctorsAdmin());
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = (await request.json()) as DoctorInput;
    // Ism va mutaxassislik — ayol ro'yxatda KO'RADIGAN yagona ikki narsa.
    // Ularsiz yozuv foydasiz, shuning uchun bazaga ham tushmaydi.
    if (!body.fullName?.trim() || !body.specialty?.trim()) {
      return NextResponse.json({ error: "Ism va mutaxassislik kerak" }, { status: 400 });
    }
    return NextResponse.json(await createDoctor({ ...body, fullName: body.fullName.trim() }));
  } catch (error) {
    return jsonError(error);
  }
}
