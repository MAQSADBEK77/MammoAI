import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { getYandexMetrikaCounterId, getYandexMetrikaDashboard, getYandexMetrikaToken } from "@/server/yandex-metrika";

/** YANDEX-METRIKA-04: admin `/admin/analitika` sahifasining "Yandex Metrika"
 * bo'limi shu route'ni chaqiradi. Sozlanmagan bo'lsa (token/counterId yo'q)
 * bu XATO EMAS — `{configured:false}` bilan 200 qaytariladi, shunda UI
 * do'stona bo'sh holatni ko'rsatadi (spec: xato bilan butun panelni
 * buzmasin). Haqiqiy Yandex xatolari (401/403/429/...) esa jonli qoladi —
 * jsonError orqali aniq xabar bilan qaytadi. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const [token, counterId] = await Promise.all([getYandexMetrikaToken(), getYandexMetrikaCounterId()]);
    if (!token || !counterId) {
      return NextResponse.json({ configured: false });
    }

    const url = new URL(request.url);
    const days = Number(url.searchParams.get("days")) || 30;
    const force = url.searchParams.get("force") === "1";
    const dashboard = await getYandexMetrikaDashboard(days, force);
    return NextResponse.json({ configured: true, ...dashboard });
  } catch (error) {
    return jsonError(error);
  }
}
