import type { CycleLog, Symptom } from "../types";
import { getCyclePhase, type CyclePhase } from "./cycle-phase";
import { buildCycleHistory, type CycleDayMarker } from "./cycle-history";
import { DEFAULT_LUTEAL_PHASE_DAYS } from "./cycle";

/**
 * PATTERN-01 — "Simptom naqshlari".
 *
 * Referensdagi (Flo) eng kuchli blok: u FAQAT qayd qilganda paydo bo'ladi va
 * har yangi qayd bilan boyib boradi. Ya'ni ayolga qayd qilishdan aniq,
 * shaxsiy foyda qaytaradi — bu bizning "81% hech qachon qayd etmagan"
 * muammosiga to'g'ridan-to'g'ri javob.
 *
 * ATAYLAB QILINMAGAN NARSA: referensda "Flo foydalanuvchilarining 79% ida
 * ham shunday" degan taqqoslash bor. Bizda hozir atigi 30 ta foydalanuvchi
 * hayz qayd etgan — bunday kichik namunadan foiz chiqarish ishonchsiz
 * (bir-ikki kishi naqshni o'nlab foizga siljitadi). Taqqoslash ma'lumot
 * yetarli bo'lgach qo'shiladi.
 */

/** Naqsh haqida gapirish uchun simptom kamida shuncha marta belgilangan
 * bo'lishi kerak. Ikki marta — bu tasodif bo'lishi mumkin. */
export const MIN_OCCURRENCES_FOR_PATTERN = 3;
/** Faza "ustun" deb aytilishi uchun kerakli ulush — QAT'IY ko'pchilik.
 * Test aynan shu chegarani tekshirdi: 50/50 taqsimotda ham "asosan hayz
 * kunlarida" deb yozilardi, holbuki bu naqsh emas, shunchaki teng
 * taqsimot. Shuning uchun taqqoslash `>=` emas, `>`. */
export const MIN_DOMINANT_SHARE = 0.5;

export interface SymptomPatternDay {
  marker: CycleDayMarker;
  /** Shu kuni ayol aynan shu simptomni belgilaganmi. */
  logged: boolean;
}

/** Nomi ataylab `SymptomPattern`dan farq qiladi: o'sha nom `types.ts`da
 * allaqachon band (AI chat ishlatadigan oddiy `{symptom, occurrences}`).
 * Bu esa SIKL bo'yicha xaritani ham o'z ichiga oladi. */
export interface SymptomCyclePattern {
  symptom: Symptom;
  /** Jami necha marta belgilangan. */
  occurrences: number;
  /** Eng ko'p qaysi fazaga tushgani — yetarli ma'lumot bo'lmasa `null`,
   * va UI bunda hech qanday da'vo qilmaydi. */
  dominantPhase: CyclePhase | null;
  /** Oxirgi sikllar bo'yicha xarita (eng yangisi birinchi). */
  cycles: { start: string; days: SymptomPatternDay[] }[];
}

export function buildSymptomPatterns(
  logs: Pick<CycleLog, "date" | "flow" | "symptoms">[],
  today: string,
  options: { lutealPhaseDays?: number; maxSymptoms?: number; maxCycles?: number } = {}
): SymptomCyclePattern[] {
  const luteal = options.lutealPhaseDays ?? DEFAULT_LUTEAL_PHASE_DAYS;
  const maxSymptoms = options.maxSymptoms ?? 3;
  const history = buildCycleHistory(logs, today, { lutealPhaseDays: luteal, limit: options.maxCycles ?? 3 });
  if (history.length === 0) return [];

  // Sana → o'sha kuni belgilangan simptomlar.
  const byDate = new Map<string, Symptom[]>();
  for (const l of logs) if (l.symptoms?.length) byDate.set(l.date, l.symptoms);

  // Har bir simptom necha marta va qaysi fazalarda uchragani.
  const counts = new Map<Symptom, number>();
  const phaseCounts = new Map<Symptom, Map<CyclePhase, number>>();

  for (const cycle of history) {
    for (let d = 0; d < cycle.days.length; d++) {
      const date = addDaysLocal(cycle.start, d);
      const symptoms = byDate.get(date);
      if (!symptoms) continue;
      // Joriy (tugamagan) siklda uzunlik hali noma'lum, shuning uchun faza
      // hisobiga FAQAT tugagan sikllar kiradi — aks holda "asosan lyuteal
      // fazada" degan xulosa hali yozilmagan kunlarga tayanardi.
      const phase = cycle.ongoing ? null : getCyclePhase(d + 1, cycle.lengthDays, 5, luteal);
      for (const s of symptoms) {
        counts.set(s, (counts.get(s) ?? 0) + 1);
        if (!phase) continue;
        const m = phaseCounts.get(s) ?? new Map<CyclePhase, number>();
        m.set(phase, (m.get(phase) ?? 0) + 1);
        phaseCounts.set(s, m);
      }
    }
  }

  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, maxSymptoms);

  return top.map(([symptom, occurrences]) => {
    let dominantPhase: CyclePhase | null = null;
    const m = phaseCounts.get(symptom);
    if (m && occurrences >= MIN_OCCURRENCES_FOR_PATTERN) {
      const total = [...m.values()].reduce((a, b) => a + b, 0);
      const [best, bestCount] = [...m.entries()].sort((a, b) => b[1] - a[1])[0];
      if (total > 0 && bestCount / total > MIN_DOMINANT_SHARE) dominantPhase = best;
    }

    return {
      symptom,
      occurrences,
      dominantPhase,
      cycles: history.map((cycle) => ({
        start: cycle.start,
        days: cycle.days.map((marker, d) => ({
          marker,
          logged: (byDate.get(addDaysLocal(cycle.start, d)) ?? []).includes(symptom),
        })),
      })),
    };
  });
}

/** Mahalliy nusxa — `cycle.ts`dagi `addDays` UTC bilan ishlaydi va bu yerda
 * ham aynan shunday xatti-harakat kerak (sanalar "YYYY-MM-DD" satrlari). */
function addDaysLocal(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
