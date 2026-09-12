import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { addWater } from "@/server/repo";
import { buildWellnessResponse } from "@/server/views";

/** `ml` manfiy ham bo'lishi mumkin — "bekor qilish" (masalan xato bosilgan
 * stakanni ayirish). Kenglik ±5000 bilan cheklanadi — real qiymatlardan
 * tashqari, tasodifiy/qasddan noto'g'ri kiritishning ta'sirini cheklaydi. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as { ml?: number };
    const ml = Number(body.ml);
    if (!Number.isFinite(ml) || Math.abs(ml) > 5000) {
      return NextResponse.json({ error: "Noto'g'ri qiymat" }, { status: 400 });
    }
    await addWater(user.id, Math.round(ml));
    return NextResponse.json(await buildWellnessResponse(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
