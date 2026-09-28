import { NextResponse, type NextRequest } from "next/server";
import { ApiError, jsonError, requireUser } from "@/server/api-utils";
import { startContraction, stopContraction } from "@/server/repo";
import { buildPregnancyResponse } from "@/server/views";

/**
 * PREG-LABOR-01 — shvat sanagichi.
 *
 * Vaqtni SERVER belgilaydi, mijoz emas: telefon soati noto'g'ri bo'lsa
 * 5-1-1 hisobi buzilardi, va bu ayolni tug'ruqxonaga kech yoki erta
 * yuborishi mumkin edi.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as { action?: string };
    if (body.action !== "start" && body.action !== "stop") {
      throw new ApiError(400, "Noto'g'ri amal");
    }
    if (body.action === "start") await startContraction(user.id);
    else await stopContraction(user.id);
    return NextResponse.json(await buildPregnancyResponse(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
