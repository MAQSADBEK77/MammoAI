import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { grantPremium, revokePremium } from "@/server/repo";

interface GrantBody {
  /** `null` — muddatsiz (masalan promo/sinov uchun). */
  durationDays: number | null;
  note?: string | null;
}

/** To'lov provayderi ulanmaguncha PREMIUM'ni qo'lda berish yagona yo'l
 * (masalan mijoz Click/Payme'ga to'g'ridan-to'g'ri o'tkazma qilgach). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    requireAdmin(request);
    const { userId } = await params;
    const body = (await request.json()) as GrantBody;
    const subscription = await grantPremium(userId, { durationDays: body.durationDays, note: body.note?.trim() || null });
    return NextResponse.json({ subscription });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    requireAdmin(request);
    const { userId } = await params;
    await revokePremium(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
