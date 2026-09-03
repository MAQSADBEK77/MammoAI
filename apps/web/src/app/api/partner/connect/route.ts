import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { connectPartnerByCode, getPartnerStatus } from "@/server/repo";

/** Hamkor yuborgan kod orqali ulanadi. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as { code?: string };
    if (!body.code?.trim()) return NextResponse.json({ error: "Kod kiritilmadi" }, { status: 400 });
    await connectPartnerByCode(user.id, body.code);
    return NextResponse.json(await getPartnerStatus(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
