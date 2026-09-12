import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { blockCommunityPostAuthor } from "@/server/repo";

/** COMM-001: "shu postni yozganni bloklash" — postning haqiqiy muallifi
 * SERVER TOMONDA aniqlanadi, klient hech qachon xom user_id'ni ko'rmaydi
 * (shuning uchun anonim post muallifini ham bloklash mumkin). */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    await blockCommunityPostAuthor(user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
