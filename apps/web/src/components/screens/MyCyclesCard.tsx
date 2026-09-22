"use client";

import clsx from "clsx";
import { CheckCircle, ErrorOutlined, Add } from "@mui/icons-material";
import type { CycleSummary, LengthStatus } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";

/**
 * SUMMARY-01 — "Mening sikllarim".
 *
 * Referensda (Flo) bosh ekranning pastki qismi deyarli butunlay bitta
 * tamoyilga qurilgan: "qayd qilsang — buni qaytarib beraman". Bizda esa
 * foydalanuvchilarning 81% i hech qachon hayz qayd etmagan va qayd
 * qilishdan nima foyda ko'rishi HECH QAYERDA ko'rsatilmasdi.
 *
 * Bu blokda BASHORAT yo'q — faqat allaqachon qayd etilgan narsa o'lchanadi.
 * Shuning uchun u kam ma'lumotli foydalanuvchida yolg'on gapirmaydi:
 * o'lchash uchun yetarli ma'lumot bo'lmasa, raqam o'rniga taklif chiqadi.
 */
export function MyCyclesCard({ summary, onLogPeriod }: { summary: CycleSummary; onLogPeriod: () => void }) {
  const { dict } = useI18n();
  const t = dict.cycle;

  const rows: { key: string; label: string; value: string; ok: boolean; status: string }[] = [];

  if (summary.previousCycleLength) {
    const { days, status } = summary.previousCycleLength;
    rows.push({
      key: "cycle",
      label: t.myCyclesPreviousCycle,
      value: t.heroDaysValue(days),
      ok: status === "normal",
      status: statusLabel(status, t),
    });
  }
  if (summary.previousPeriodLength) {
    const { days, status } = summary.previousPeriodLength;
    rows.push({
      key: "period",
      label: t.myCyclesPreviousPeriod,
      value: t.heroDaysValue(days),
      ok: status === "normal",
      status: statusLabel(status, t),
    });
  }
  if (summary.variation) {
    const { min, max, regular } = summary.variation;
    rows.push({
      key: "variation",
      label: t.myCyclesVariation,
      value: t.myCyclesRange(min, max),
      ok: regular,
      status: regular ? t.myCyclesStatusRegular : t.myCyclesStatusIrregular,
    });
  }

  return (
    <section className="rounded-3xl bg-surface p-5 shadow-sm">
      <h3 className="text-base font-bold text-text-primary">{t.myCyclesTitle}</h3>

      {rows.length === 0 ? (
        // Bo'sh holat — bu bo'limning ASOSIY maqsadi shu: qayd qilishdan
        // nima chiqishini ko'rsatish va bir bosishda o'sha yerga olib borish.
        <div className="mt-3">
          <p className="text-sm leading-relaxed text-text-secondary">{t.myCyclesEmpty}</p>
          <button
            type="button"
            onClick={onLogPeriod}
            className="tap-target mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-bold text-white active:scale-[0.98]"
          >
            <Add sx={{ fontSize: 18 }} />
            {t.myCyclesLogCta}
          </button>
        </div>
      ) : (
        <div className="mt-1 divide-y divide-border/60">
          {rows.map((r) => (
            <div key={r.key} className="flex items-center justify-between gap-3 py-3.5">
              <div className="min-w-0">
                <p className="text-sm text-text-secondary">{r.label}</p>
                <p className="mt-0.5 text-lg font-bold text-text-primary">{r.value}</p>
              </div>
              {/* Holat belgisi — rang bilan birga IKONKA ham bor, chunki
                  faqat rangga tayanish rang ko'rmaydigan foydalanuvchida
                  ma'noni yo'qotardi. */}
              <span
                className={clsx(
                  "flex shrink-0 items-center gap-1 text-xs font-bold uppercase tracking-wide",
                  r.ok ? "text-success" : "text-warning"
                )}
              >
                {r.ok ? <CheckCircle sx={{ fontSize: 18 }} /> : <ErrorOutlined sx={{ fontSize: 18 }} />}
                {r.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function statusLabel(status: LengthStatus, t: ReturnType<typeof useI18n>["dict"]["cycle"]): string {
  if (status === "short") return t.myCyclesStatusShort;
  if (status === "long") return t.myCyclesStatusLong;
  return t.myCyclesStatusNormal;
}
