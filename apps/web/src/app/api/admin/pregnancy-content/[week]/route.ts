import { NextResponse, type NextRequest } from "next/server";
import { jsonError, ApiError } from "@/server/api-utils";
import { requireAdmin } from "@/server/admin-auth";
import { upsertPregnancyWeekContent, logAdminAction } from "@/server/repo";

export async function PATCH(request: NextRequest, context: { params: Promise<{ week: string }> }) {
  try {
    const identity = await requireAdmin(request);
    const { week } = await context.params;
    const weekNum = Number(week);
    if (!Number.isInteger(weekNum) || weekNum < 1 || weekNum > 42) throw new ApiError(400, "Hafta 1-42 oralig'ida bo'lishi kerak");

    type Text = { sizeLabel?: string; babyDevelopment?: string; motherChanges?: string };
    const body = (await request.json()) as Text & { ru?: Text | null; en?: Text | null };
    const sizeLabel = body.sizeLabel?.trim();
    const babyDevelopment = body.babyDevelopment?.trim();
    const motherChanges = body.motherChanges?.trim();
    // O'zbekcha — MAJBURIY, chunki u boshqa tillar uchun zaxira matn.
    if (!sizeLabel || !babyDevelopment || !motherChanges) throw new ApiError(400, "O'zbekcha maydonlar to'ldirilishi kerak");

    // PREG-I18N: tarjima BUTUNLAY to'ldirilgan bo'lsagina saqlanadi —
    // yarim to'ldirilgani ayolga ikki tilli aralash matn ko'rsatardi.
    // `undefined` esa "tegma" degani (mavjud tarjima o'chib ketmaydi).
    const translation = (t: Text | null | undefined) => {
      if (t === undefined) return undefined;
      if (t === null) return null;
      const size = t.sizeLabel?.trim();
      const baby = t.babyDevelopment?.trim();
      const mother = t.motherChanges?.trim();
      if (!size || !baby || !mother) throw new ApiError(400, "Tarjimaning barcha maydonlari to'ldirilishi kerak");
      return { sizeLabel: size, babyDevelopment: baby, motherChanges: mother };
    };

    const content = await upsertPregnancyWeekContent(weekNum, {
      sizeLabel,
      babyDevelopment,
      motherChanges,
      ru: translation(body.ru),
      en: translation(body.en),
    });
    logAdminAction(identity.adminLabel, "pregnancy_content_updated", `hafta=${weekNum}`).catch(() => {});
    return NextResponse.json({ content });
  } catch (error) {
    return jsonError(error);
  }
}
