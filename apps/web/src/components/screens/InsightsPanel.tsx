"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import type { InsightsSummary, SymptomPattern } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui";

function formatShortDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${day}.${month}`;
}

/** Bitta seriyali (magnitude) vertikal ustunlar — SignupsChart bilan bir xil
 * dataviz-uslubi: yagona brend rangi, legend shart emas, hover'da tooltip. */
function BarTrendChart({ points, valueSuffix }: { points: { label: string; value: number }[]; valueSuffix: string }) {
  const max = useMemo(() => Math.max(1, ...points.map((p) => p.value)), [points]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  return (
    <div>
      <div className="flex h-28 items-end gap-1.5">
        {points.map((p, i) => {
          const heightPct = (p.value / max) * 100;
          const isHovered = hoverIndex === i;
          return (
            <div
              key={`${p.label}-${i}`}
              className="group relative flex h-full flex-1 items-end justify-center"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex((h) => (h === i ? null : h))}
            >
              {isHovered && (
                <div className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-nav px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg">
                  {p.label} · {p.value} {valueSuffix}
                </div>
              )}
              <div
                className={clsx("w-full max-w-[18px] rounded-t-[4px] transition-colors", isHovered ? "bg-primary-dark" : "bg-primary/60")}
                style={{ height: `${Math.max(heightPct, 4)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] font-medium text-text-muted">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

/** Bitta seriyali ranking (kategoriya bo'yicha chastota) — admin analitikaning
 * RankedBar komponenti bilan bir xil uslub (foydalanuvchi ekraniga moslashtirilgan). */
function RankedRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs font-semibold text-text-secondary">
        <span className="truncate">{label}</span>
        <span className="shrink-0 text-text-muted">{count}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.max(pct, 3)}%` }} />
      </div>
    </div>
  );
}

export function InsightsPanel({ summary, patterns }: { summary: InsightsSummary; patterns: SymptomPattern[] }) {
  const { dict } = useI18n();

  if (!summary.hasEnoughData) {
    return <p className="py-10 text-center text-sm text-text-muted">{dict.chat.insightsEmpty}</p>;
  }

  const symptomMax = Math.max(1, ...summary.symptomFrequency.map((p) => p.count));
  const moodMax = Math.max(1, ...summary.moodDistribution.map((p) => p.count));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      {patterns.length > 0 && (
        <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
          <p className="text-sm font-bold text-warning">{dict.chat.patternBannerTitle}</p>
          <ul className="mt-1.5 flex flex-col gap-0.5">
            {patterns.map((p) => (
              <li key={p.symptom} className="text-sm text-text-secondary">
                {dict.cycle.symptoms[p.symptom]} — {p.occurrences}x
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-sm text-text-secondary">{dict.chat.patternBannerBody}</p>
        </div>
      )}

      {summary.cycleLengths.length > 0 && (
        <Card className="flex flex-col gap-3">
          <p className="text-sm font-bold text-text-primary">{dict.chat.cycleLengthChartTitle}</p>
          <BarTrendChart
            points={summary.cycleLengths.map((p) => ({ label: formatShortDate(p.startDate), value: p.lengthDays }))}
            valueSuffix={dict.chat.daysUnit}
          />
        </Card>
      )}

      {summary.painDaysPerCycle.length > 0 && (
        <Card className="flex flex-col gap-3">
          <p className="text-sm font-bold text-text-primary">{dict.chat.painDaysChartTitle}</p>
          <BarTrendChart
            points={summary.painDaysPerCycle.map((p) => ({ label: formatShortDate(p.startDate), value: p.painDays }))}
            valueSuffix={dict.chat.daysUnit}
          />
          <p className="text-xs text-text-muted">{dict.chat.painDaysChartHint}</p>
        </Card>
      )}

      {summary.symptomFrequency.length > 0 && (
        <Card className="flex flex-col gap-3">
          <p className="text-sm font-bold text-text-primary">{dict.chat.symptomFrequencyChartTitle}</p>
          <div className="flex flex-col gap-2.5">
            {summary.symptomFrequency.map((p) => (
              <RankedRow key={p.symptom} label={dict.cycle.symptoms[p.symptom]} count={p.count} max={symptomMax} />
            ))}
          </div>
        </Card>
      )}

      {summary.moodDistribution.length > 0 && (
        <Card className="flex flex-col gap-3">
          <p className="text-sm font-bold text-text-primary">{dict.chat.moodDistributionChartTitle}</p>
          <div className="flex flex-col gap-2.5">
            {summary.moodDistribution.map((p) => (
              <RankedRow key={p.mood} label={dict.cycle.moods[p.mood]} count={p.count} max={moodMax} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
