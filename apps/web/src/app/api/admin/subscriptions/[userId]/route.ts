import { NextResponse, type NextRequest } from "next/server";
import { jsonError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { grantPremium, revokePremium, logAdminAction } from "@/server/repo";

interface GrantBody {
  /** `null` — muddatsiz (masalan promo/sinov uchun). */
  durationDays: number | null;
  note?: string | null;
}

/** To'lov provayderi ulanmaguncha PREMIUM'ni qo'lda berish yagona yo'l
 * (masalan mijoz Click/Payme'ga to'g'ridan-to'g'ri o'tkazma qilgach).
 * ADMIN-001: pul bilan bog'liq amal — audit-jurnalga yoziladi. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const identity = await requireAdmin(request);
    const { userId } = await params;
    const body = (await request.json()) as GrantBody;
    const subscription = await grantPremium(userId, { durationDays: body.durationDays, note: body.note?.trim() || null });
    await logAdminAction(identity.adminLabel, "premium_granted", `user=${userId} days=${body.durationDays ?? "muddatsiz"}`);
    return NextResponse.json({ subscription });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const identity = await requireAdmin(request);
    const { userId } = await params;
    await revokePremium(userId);
    await logAdminAction(identity.adminLabel, "premium_revoked", `user=${userId}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
