"use client";

import clsx from "clsx";
import { Add, CheckCircleOutlined } from "@mui/icons-material";
import type { SymptomCyclePattern } from "@mammoai/shared";
import { SYMPTOM_EMOJI } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { Emoji } from "@/components/Emoji";

/**
 * PATTERN-01 — "Simptom naqshlarim".
 *
 * Referensdagi (Flo) eng kuchli blok: u FAQAT qayd qilganda paydo bo'ladi va
 * har yangi qayd bilan boyib boradi — ya'ni ayolga qayd qilishdan aniq,
 * shaxsiy foyda qaytaradi.
 *
 * Referensda "Flo foydalanuvchilarining 79% ida ham shunday" degan taqqoslash
 * bor; bizda u ATAYLAB yo'q. Hozir atigi 30 ta foydalanuvchi hayz qayd etgan
 * va bunday kichik namunadan foiz chiqarish ishonchsiz — bir-ikki kishi
 * naqshni o'nlab foizga siljitadi.
 */
export function SymptomPatternsCard({
  patterns,
  onLogSymptom,
}: {
  patterns: SymptomCyclePattern[];
  onLogSymptom: () => void;
}) {
  const { dict } = useI18n();
  const t = dict.cycle;

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-sm">
      <h3 className="text-base font-bold text-text-primary">{t.symptomPatternsTitle}</h3>

      {patterns.length === 0 ? (
        // Bo'sh holat — bu blokning ASOSIY vazifasi: qayd qilishdan nima
        // chiqishini AVVALDAN aytish. Referensda ham xuddi shunday.
        <div className="mt-3">
          <p className="text-sm font-bold text-text-primary">{t.symptomPatternsEmptyTitle}</p>
          <ul className="mt-2.5 space-y-1.5">
            {t.symptomPatternsEmptyBullets.map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm leading-snug text-text-secondary">
                <CheckCircleOutlined sx={{ fontSize: 18 }} className="mt-0.5 shrink-0 text-primary" />
                {line}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onLogSymptom}
            className="tap-target mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-bold text-white active:scale-[0.98]"
          >
            <Add sx={{ fontSize: 18 }} />
            {t.symptomPatternsEmptyCta}
          </button>
        </div>
      ) : (
        <div className="mt-1 divide-y divide-border/60">
          {patterns.map((p) => (
            <div key={p.symptom} className="py-4">
              <p className="flex items-center gap-2 text-base font-bold text-text-primary">
                <Emoji e={SYMPTOM_EMOJI[p.symptom]} size={20} />
                {t.symptoms[p.symptom]}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                {p.dominantPhase
                  ? t.symptomPatternDominant(t.symptoms[p.symptom], dict.cyclePhase[p.dominantPhase].name)
                  : t.symptomPatternNotEnough(p.occurrences)}
              </p>

              {/* Sikl bo'yicha xarita: har qator — bitta sikl, har nuqta —
                  bitta kun. Simptom belgilangan kun ustiga aniq halqa
                  qo'yiladi (faqat rang bilan ajratish yetarli emas — u
                  faza rangi bilan chalkashardi). */}
              <div className="mt-2.5 space-y-1.5">
                {p.cycles.map((c) => (
                  <div key={c.start} className="no-scrollbar flex gap-1 overflow-x-auto">
                    {c.days.map((d, i) => (
                      <span
                        key={i}
                        className={clsx(
                          "h-2.5 w-2.5 shrink-0 rounded-full",
                          d.logged && "ring-2 ring-text-primary ring-offset-1 ring-offset-surface",
                          d.marker === "period" && "bg-primary",
                          d.marker === "ovulation" && "bg-accent",
                          d.marker === "fertile" && "bg-accent/40",
                          !d.marker && "bg-border"
                        )}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
