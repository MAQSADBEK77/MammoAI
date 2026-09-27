import { NextResponse, type NextRequest } from "next/server";
import { HOSPITAL_BAG_ITEMS } from "@mammoai/shared";
import { ApiError, jsonError, requireUser } from "@/server/api-utils";
import { setBagItem } from "@/server/repo";
import { buildPregnancyResponse } from "@/server/views";

/**
 * PREG-BAG-01 — tug'ruqxona sumkasi ro'yxati.
 *
 * Band id'si RO'YXATDAN bo'lishi tekshiriladi: aks holda bazaga
 * ixtiyoriy matn yozib yuborish mumkin bo'lardi va u hech qachon
 * ko'rsatilmaydigan "o'lik" qatorlar bo'lib qolardi.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as { itemId?: unknown; checked?: unknown };
    const itemId = typeof body.itemId === "string" ? body.itemId : "";
    if (!HOSPITAL_BAG_ITEMS.some((i) => i.id === itemId)) throw new ApiError(400, "Noma'lum band");
    if (typeof body.checked !== "boolean") throw new ApiError(400, "Noto'g'ri qiymat");
    await setBagItem(user.id, itemId, body.checked);
    return NextResponse.json(await buildPregnancyResponse(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
