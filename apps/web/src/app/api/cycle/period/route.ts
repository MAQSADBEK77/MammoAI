import { NextResponse, type NextRequest } from "next/server";
import { jsonError, requireUser } from "@/server/api-utils";
import { applyPeriodDiff, clearPeriodRange, getCycleSettings, setPeriodRange } from "@/server/repo";
import { buildCycleResponse } from "@/server/views";

/**
 * CAL-01 — kalendarda hayz davrini bir bosishda belgilash yoki olib tashlash.
 *
 * `action: "set"`   — `startDate`dan boshlab foydalanuvchining O'Z o'rtacha
 *                     hayz uzunligi (`cycle_settings.average_period_length`,
 *                     odatda 5 kun) bo'yicha belgilaydi. `days` berilsa —
 *                     o'sha qiymat ishlatiladi (foydalanuvchi uzunlikni
 *                     qo'lda o'zgartirganda).
 * `action: "clear"` — `startDate` tegishli bo'lgan uzluksiz davrni butunlay
 *                     olib tashlaydi (xato bosilgan sanani qaytarish).
 */
interface PeriodBody {
  startDate?: string;
  action: "set" | "clear" | "diff";
  days?: number;
  /** CAL-04 (`action: "diff"`): tahrirlash rejimida belgilangan va bekor
   * qilingan kunlar — hammasi bitta so'rovda. */
  added?: string[];
  removed?: string[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as PeriodBody;

    if (body.action === "diff") {
      const added = (body.added ?? []).filter((d) => typeof d === "string" && DATE_RE.test(d));
      const removed = (body.removed ?? []).filter((d) => typeof d === "string" && DATE_RE.test(d));
      // Aqlli chegara — bir so'rovda butun tarixni qayta yozishning oldini
      // oladi (buzuq mijoz yoki xato kod holatida).
      if (added.length + removed.length > 400) {
        return NextResponse.json({ error: "Juda ko'p kun" }, { status: 400 });
      }
      await applyPeriodDiff(user.id, added, removed);
      return NextResponse.json(await buildCycleResponse(user.id));
    }

    if (typeof body.startDate !== "string" || !DATE_RE.test(body.startDate)) {
      return NextResponse.json({ error: "Sana noto'g'ri" }, { status: 400 });
    }
    if (body.action !== "set" && body.action !== "clear") {
      return NextResponse.json({ error: "Amal noto'g'ri" }, { status: 400 });
    }

    if (body.action === "clear") {
      await clearPeriodRange(user.id, body.startDate);
    } else {
      const settings = await getCycleSettings(user.id);
      const days = typeof body.days === "number" ? body.days : settings.averagePeriodLength;
      await setPeriodRange(user.id, body.startDate, days);
    }

    return NextResponse.json(await buildCycleResponse(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
