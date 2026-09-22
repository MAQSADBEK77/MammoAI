"use client";

import clsx from "clsx";
import type { HistoricCycle } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";

/**
 * HISTORY-01 — "Sikl tarixi".
 *
 * Referensda (Flo) har bir sikl bitta qator: uzunligi, sanalari va kunlar
 * bo'yicha nuqtali chiziq. Chiziq ayolga o'z siklining SHAKLINI bir qarashda
 * ko'rsatadi va har yangi qayd bilan boyib boradi — ya'ni bu qayd qilishning
 * eng ko'rinadigan qaytimi.
 *
 * Bu yerda bashorat yo'q: sikl chegaralari faqat qayd etilgan hayz
 * boshlanishlaridan olinadi (qarang: logic/cycle-history.ts).
 */
export function CycleHistoryCard({ cycles }: { cycles: HistoricCycle[] }) {
  const { dict } = useI18n();
  const t = dict.cycle;

  // Hech qanday sikl yo'q bo'lsa umuman chizilmaydi — bo'sh holat uchun
  // "Mening sikllarim" blokida allaqachon taklif bor, uni takrorlash
  // shovqin bo'lardi.
  if (cycles.length === 0) return null;

  /** "2-sen" ko'rinishidagi qisqa sana — tarix qatorlari uchun to'liq
   * "02.09.2026" formati og'ir ko'rinardi. */
  const shortDate = (date: string) => {
    const d = new Date(date + "T00:00:00");
    return `${d.getDate()}-${dict.common.months[d.getMonth()]}`;
  };

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-sm">
      <h3 className="text-base font-bold text-text-primary">{t.cycleHistoryTitle}</h3>

      <div className="mt-1 divide-y divide-border/60">
        {cycles.map((c) => (
          <div key={c.start} className="py-3.5">
            <p className="text-base font-bold text-text-primary">
              {c.ongoing ? t.cycleHistoryCurrent(c.lengthDays) : t.heroDaysValue(c.lengthDays)}
            </p>
            <p className="mt-0.5 text-sm text-text-secondary">
              {c.ongoing || !c.end
                ? t.cycleHistoryStarted(shortDate(c.start))
                : `${shortDate(c.start)} – ${shortDate(c.end)}`}
            </p>
            {/* Nuqtali chiziq. `flex-wrap` ataylab YO'Q: uzun sikl ikkinchi
                qatorga o'tsa, sikl shakli o'qilmay qolardi. Buning o'rniga
                nuqtalar kichrayadi va zarur bo'lsa suriladi. */}
            <div className="no-scrollbar mt-2.5 flex gap-1 overflow-x-auto">
              {c.days.map((marker, i) => (
                <span
                  key={i}
                  className={clsx(
                    "h-2.5 w-2.5 shrink-0 rounded-full",
                    marker === "period" && "bg-primary",
                    marker === "ovulation" && "bg-accent",
                    marker === "fertile" && "bg-accent/40",
                    !marker && "bg-border"
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Izoh — ranglar nimani bildirishi aytilmasa, chiziq bezakka aylanadi. */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-secondary">
        {[
          { color: "bg-primary", label: t.calendarLegendPeriod },
          { color: "bg-accent/40", label: t.cycleHistoryLegendFertile },
          { color: "bg-accent", label: t.calendarLegendOvulation },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={clsx("h-2.5 w-2.5 rounded-full", item.color)} />
            {item.label}
          </span>
        ))}
      </div>
    </section>
  );
}
