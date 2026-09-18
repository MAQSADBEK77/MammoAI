import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { testYandexMetrikaConnection } from "@/server/yandex-metrika";

/** Admin panelning "Ulanishni tekshirish" tugmasi — SAQLANGAN token/counterId
 * bilan haqiqiy, kichik Reporting API so'rovi yuboradi. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const { visits, days } = await testYandexMetrikaConnection();
    return NextResponse.json({
      ok: true,
      message: `✅ Ulandi: mammo.uz, so'nggi ${days} kunda ${visits} ta tashrif topildi`,
    });
  } catch (error) {
    return jsonError(error);
  }
}
