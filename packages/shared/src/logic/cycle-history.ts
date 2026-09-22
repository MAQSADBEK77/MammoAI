import type { CycleLog } from "../types";
import { addDays, daysBetween, detectPeriodStarts, DEFAULT_LUTEAL_PHASE_DAYS } from "./cycle";

/**
 * HISTORY-01 — "Sikl tarixi" bo'limi uchun o'tgan sikllar.
 *
 * Referensda (Flo) har bir sikl bitta qator: uzunligi, sanalari va kunlar
 * bo'yicha NUQTALI CHIZIQ (hayz / unumdor / ovulyatsiya). Chiziq ayolga
 * o'z siklining shaklini bir qarashda ko'rsatadi — bu qayd qilishning
 * eng ko'rinadigan "qaytimi".
 *
 * Bu yerda ham BASHORAT yo'q: sikl chegaralari faqat QAYD ETILGAN hayz
 * boshlanishlaridan olinadi. Unumdor oyna esa o'tgan sikl uchun retro-
 * spektiv hisoblanadi — sikl uzunligi ALLAQACHON ma'lum bo'lgani uchun bu
 * taxmin emas, o'sha siklning o'z uzunligidan kelib chiqqan hisob.
 */

export type CycleDayMarker = "period" | "fertile" | "ovulation" | null;

export interface HistoricCycle {
  /** Hayzning birinchi kuni (qayd etilgan). */
  start: string;
  /** Oxirgi kuni. Joriy (hali tugamagan) siklda `null`. */
  end: string | null;
  /** Tugagan siklda haqiqiy uzunlik; joriy siklda bugungacha o'tgan kunlar. */
  lengthDays: number;
  /** `true` — bu hali davom etayotgan sikl. */
  ongoing: boolean;
  /** Har bir kun uchun belgi, birinchi kundan boshlab. */
  days: CycleDayMarker[];
}

/** Bir chiziqda ko'rsatiladigan eng ko'p kun — juda uzun (yoki xato) sikl
 * butun qatorni buzib yubormasligi uchun. */
const MAX_STRIP_DAYS = 45;

export function buildCycleHistory(
  logs: Pick<CycleLog, "date" | "flow">[],
  today: string,
  options: { lutealPhaseDays?: number; limit?: number } = {}
): HistoricCycle[] {
  const luteal = options.lutealPhaseDays ?? DEFAULT_LUTEAL_PHASE_DAYS;
  const limit = options.limit ?? 6;
  const starts = detectPeriodStarts(logs);
  if (starts.length === 0) return [];

  const flowDates = new Set(logs.filter((l) => l.flow).map((l) => l.date));
  const out: HistoricCycle[] = [];

  for (let i = starts.length - 1; i >= 0 && out.length < limit; i--) {
    const start = starts[i];
    const nextStart = starts[i + 1] ?? null;
    const ongoing = nextStart === null;
    // Tugagan siklda uzunlik — ikki boshlanish orasidagi farq. Joriy siklda
    // bugungacha o'tgan kunlar (Flo ham "Current cycle: 21 days" deb shuni
    // ko'rsatadi).
    const rawLength = ongoing ? daysBetween(start, today) + 1 : daysBetween(start, nextStart);
    if (rawLength <= 0) continue;
    const lengthDays = rawLength;

    // Ovulyatsiya siklning OXIRIDAN sanaladi (lyuteal faza — barqaror qism).
    // Joriy siklda hali oxiri noma'lum, shuning uchun unda ovulyatsiya
    // ko'rsatilmaydi — aks holda taxminni fakt sifatida chizgan bo'lardik.
    const ovulationIndex = ongoing ? -1 : lengthDays - luteal;

    const days: CycleDayMarker[] = [];
    for (let d = 0; d < Math.min(lengthDays, MAX_STRIP_DAYS); d++) {
      const date = addDays(start, d);
      if (flowDates.has(date)) {
        days.push("period");
      } else if (ovulationIndex >= 0 && d === ovulationIndex) {
        days.push("ovulation");
      } else if (ovulationIndex >= 0 && d >= ovulationIndex - 5 && d <= ovulationIndex + 1) {
        days.push("fertile");
      } else {
        days.push(null);
      }
    }

    out.push({ start, end: ongoing ? null : addDays(start, lengthDays - 1), lengthDays, ongoing, days });
  }

  return out;
}
