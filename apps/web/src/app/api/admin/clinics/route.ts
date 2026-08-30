import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { createClinic, listClinics } from "@/server/repo";
import type { Clinic } from "@mammoai/shared";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);
    return NextResponse.json(await listClinics());
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = (await request.json()) as Omit<Clinic, "id" | "isSeedData">;
    if (!body.name || !body.address || !body.region || !body.phone) {
      return NextResponse.json({ error: "Nom, manzil, hudud va telefon kerak" }, { status: 400 });
    }
    return NextResponse.json(await createClinic(body));
  } catch (error) {
    return jsonError(error);
  }
}
