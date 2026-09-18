import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { getYandexMetrikaCounterId, getYandexMetrikaToken, setYandexMetrikaCounterId, setYandexMetrikaToken } from "@/server/yandex-metrika";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const [token, counterId] = await Promise.all([getYandexMetrikaToken(), getYandexMetrikaCounterId()]);
    return NextResponse.json({
      hasToken: !!token,
      maskedToken: token ? `•••• ${token.slice(-6)}` : null,
      counterId,
    });
  } catch (error) {
    return jsonError(error);
  }
}

interface PatchBody {
  token?: string;
  counterId?: string;
}

// Bu yerda ATAYLAB darhol ulanishni tekshirmaydi (Telegram bot tokenidan
// farqli) — foydalanuvchining o'z spetsifikatsiyasi "Saqlash" va "Ulanishni
// tekshirish"ni ikkita ALOHIDA tugma sifatida so'ragan (POST /test route'i).
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = (await request.json()) as PatchBody;
    if (body.token) await setYandexMetrikaToken(body.token.trim());
    if (body.counterId) await setYandexMetrikaCounterId(body.counterId.trim());
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
