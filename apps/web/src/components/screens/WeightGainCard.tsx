"use client";

import clsx from "clsx";
import { weightGainGuide, type WeightGainStatus } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { Card } from "@/components/ui";

/**
 * PREG-WEIGHT-01 — vazn oshishi me'yor bilan yonma-yon.
 *
 * Ilgari ekranda faqat "+6.2 kg" turardi. Bu raqamning o'zi hech narsa
 * demaydi: 6.2 kg 20-haftada normal, 34-haftada esa kam. Me'yorsiz
 * raqam ayolni yo behuda tinchlantiradi, yo behuda qo'rqitadi.
 *
 * Chiziq — diagramma emas, BITTA o'q: me'yor oralig'i yashil bo'lak,
 * ayolning raqami esa nuqta. Diagramma chizish mumkin edi, lekin unda
 * javob "qayerdaman?" degan savoldan uzoqlashardi.
 */
const STATUS_TONE: Record<WeightGainStatus, string> = {
  below: "text-warning",
  within: "text-success",
  above: "text-warning",
};

export function WeightGainCard({
  heightCm,
  prePregnancyWeightKg,
  week,
  totalGainKg,
}: {
  heightCm: number | null;
  prePregnancyWeightKg: number | null;
  week: number;
  totalGainKg: number | null;
}) {
  const { dict } = useI18n();
  const t = dict.pregnancy;
  const guide = weightGainGuide(heightCm, prePregnancyWeightKg, week, totalGainKg);
  // Bo'y yoki vazn ma'lum bo'lmasa karta umuman ko'rsatilmaydi: me'yorsiz
  // u yana o'sha foydasiz raqamga aylanardi.
  if (!guide) return null;

  const [low, high] = guide.expected;
  const [, totalHigh] = guide.total;
  // O'q butun tavsiya oralig'ini qamraydi, shuning uchun nuqta ham,
  // yashil bo'lak ham bir xil o'lchovda.
  const scale = (kg: number) => Math.max(0, Math.min(100, (kg / (totalHigh + 2)) * 100));

  return (
    <Card className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-base font-bold text-text-primary">{t.gainTitle}</p>
        <p className="text-xs font-semibold text-text-secondary">{t.gainCategories[guide.category]}</p>
      </div>

      {totalGainKg === null ? (
        <p className="text-sm text-text-secondary">{t.gainNone}</p>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <p className={clsx("text-2xl font-extrabold", guide.status ? STATUS_TONE[guide.status] : "text-text-primary")}>
              {t.gainCurrent(totalGainKg)}
            </p>
            {guide.status && (
              <p className={clsx("text-xs font-bold", STATUS_TONE[guide.status])}>{t.gainStatus[guide.status]}</p>
            )}
          </div>

          <div className="relative h-3 overflow-hidden rounded-full bg-surface-muted">
            <span
              className="bg-success/30 absolute inset-y-0 rounded-full"
              style={{ left: `${scale(low)}%`, width: `${Math.max(2, scale(high) - scale(low))}%` }}
            />
            <span
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text-primary ring-2 ring-surface"
              style={{ left: `${scale(totalGainKg)}%` }}
            />
          </div>

          {guide.status && (
            <p className="text-xs leading-relaxed text-text-secondary">{t.gainStatusHint[guide.status]}</p>
          )}
        </>
      )}

      <div className="space-y-0.5 text-xs text-text-secondary">
        <p>{t.gainRange(low, high)}</p>
        <p>{t.gainTotal(guide.total[0], guide.total[1])}</p>
      </div>

      <p className="text-[11px] leading-relaxed text-text-muted">{t.gainNote}</p>
    </Card>
  );
}
