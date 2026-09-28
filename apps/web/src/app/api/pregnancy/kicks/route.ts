import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { addKickEvent } from "@/server/repo";
import { buildPregnancyResponse } from "@/server/views";

/**
 * Harakat sanagichi.
 *
 * PREG-KICKS-01: endi faqat kunlik son emas, har harakatning VAQTI ham
 * yoziladi — "2 soat ichida 10 ta" qoidasi shusiz hisoblanmaydi.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    await addKickEvent(user.id);
    return NextResponse.json(await buildPregnancyResponse(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
