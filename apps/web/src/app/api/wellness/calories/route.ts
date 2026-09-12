import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { addCalories } from "@/server/repo";
import { buildWellnessResponse } from "@/server/views";

/** `kcal` manfiy ham bo'lishi mumkin ("bekor qilish"). Kenglik ±5000 bilan
 * cheklanadi — apps/web/src/app/api/wellness/water/route.ts bilan bir xil sabab. */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as { kcal?: number };
    const kcal = Number(body.kcal);
    if (!Number.isFinite(kcal) || Math.abs(kcal) > 5000) {
      return NextResponse.json({ error: "Noto'g'ri qiymat" }, { status: 400 });
    }
    await addCalories(user.id, Math.round(kcal));
    return NextResponse.json(await buildWellnessResponse(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
