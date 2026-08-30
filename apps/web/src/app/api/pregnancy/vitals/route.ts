import { NextResponse, type NextRequest } from "next/server";
import type { VitalType } from "@mammoai/shared";
import { jsonError, requireUser } from "@/server/api-utils";
import { addPregnancyVital } from "@/server/repo";
import { buildPregnancyResponse } from "@/server/views";

const VITAL_TYPES: VitalType[] = ["heart_rate", "blood_pressure", "weight", "temperature"];

// Har bir tur uchun oddiy formatni tekshirish — qat'iy tibbiy validatsiya emas,
// faqat ma'nosiz qiymatlarning saqlanishini oldini olish uchun.
const VALUE_PATTERN: Record<VitalType, RegExp> = {
  heart_rate: /^\d{2,3}$/,
  blood_pressure: /^\d{2,3}\/\d{2,3}$/,
  weight: /^\d{2,3}(\.\d)?$/,
  temperature: /^3[3-9](\.\d)?$/,
};

/** "Sog'liq ko'rsatkichlari" — foydalanuvchi o'zi qayd etadigan tezkor-jurnal. */
export async function POST(request: NextRequest) {
  try {
    const user = requireUser(request);
    const body = (await request.json()) as { type?: VitalType; value?: string; recordedAt?: string };
    const value = body.value?.trim();

    if (!body.type || !VITAL_TYPES.includes(body.type) || !value) {
      return NextResponse.json({ error: "Turi va qiymati kerak" }, { status: 400 });
    }
    if (!VALUE_PATTERN[body.type].test(value)) {
      return NextResponse.json({ error: "Qiymat formati noto'g'ri" }, { status: 400 });
    }

    addPregnancyVital(user.id, body.type, value, body.recordedAt);
    return NextResponse.json(buildPregnancyResponse(user.id));
  } catch (error) {
    return jsonError(error);
  }
}
