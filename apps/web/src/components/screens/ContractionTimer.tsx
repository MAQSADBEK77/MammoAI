"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { summarizeContractions, type Contraction } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Card } from "@/components/ui";

/**
 * PREG-LABOR-01 — shvat sanagichi.
 *
 * Nega bu shunchaki taymer emas: ayolga kerak bo'lgan javob "nechta
 * qisqarish bo'ldi" emas, "QACHON tug'ruqxonaga borish kerak". Shuning
 * uchun ekranning markazida sanoq emas, XULOSA turadi.
 *
 * 5-1-1 bajarilganda xabar qizil va aniq bo'ladi. Bajarilmaganda esa
 * "hali emas" deyilmaydi — faqat joriy o'rtachalar ko'rsatiladi.
 * "Hali emas" degan gap yolg'on xotirjamlik berardi: qoida tug'ruqni
 * TASDIQLAMAYDI, u faqat bitta chegara.
 */
export function ContractionTimer({
  contractions,
  onChange,
}: {
  contractions: Contraction[];
  onChange: (next: Contraction[]) => void;
}) {
  const { dict } = useI18n();
  const t = dict.pregnancy;
  const [busy, setBusy] = useState(false);
  /** Davom etayotgan qisqarish soniyalari. Holatda saqlanadi — render
   * paytida `Date.now()` chaqirish sof emas (React qoidasi). */
  const [ongoingSec, setOngoingSec] = useState(0);

  const ongoing = contractions.find((c) => c.endedAt === null) ?? null;

  // Davom etayotgan qisqarish vaqtini har soniyada yangilaymiz.
  const ongoingStart = ongoing?.startedAt ?? null;
  useEffect(() => {
    // `setTimeout(0)` — effekt ichida SINXRON setState React qoidasini
    // buzadi ("cascading renders"). Loyihada bu naqsh allaqachon
    // ishlatiladi (ClinicsScreen, maqolalar sahifasi).
    const update = () =>
      setOngoingSec(ongoingStart ? Math.max(0, Math.floor((Date.now() - Date.parse(ongoingStart)) / 1000)) : 0);
    const first = setTimeout(update, 0);
    const id = ongoingStart ? setInterval(update, 1000) : null;
    return () => {
      clearTimeout(first);
      if (id) clearInterval(id);
    };
  }, [ongoingStart]);

  const summary = summarizeContractions(contractions);

  async function toggle() {
    setBusy(true);
    try {
      const res = await api.pregnancy.contraction(ongoing ? "stop" : "start");
      onChange(res.contractions);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <p className="text-base font-bold text-text-primary">{t.contractionsTitle}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{t.contractionsHint}</p>
      </div>

      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={clsx(
          "mx-auto grid h-32 w-32 place-items-center rounded-full text-center text-white transition active:scale-[0.97] disabled:opacity-60",
          ongoing ? "bg-danger" : "bg-pregnancy-accent"
        )}
      >
        <span className="text-sm font-bold leading-tight">
          {ongoing ? t.contractionsStop : t.contractionsStart}
          {ongoing && (
            <>
              <br />
              <span className="text-2xl font-extrabold">
                {String(Math.floor(ongoingSec / 60)).padStart(2, "0")}:{String(ongoingSec % 60).padStart(2, "0")}
              </span>
            </>
          )}
        </span>
      </button>

      {summary.count > 0 && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label={t.contractionsCount} value={String(summary.count)} />
          <Stat
            label={t.contractionsAvgDuration}
            value={summary.averageDurationSec !== null ? `${summary.averageDurationSec} s` : "—"}
          />
          <Stat
            label={t.contractionsAvgInterval}
            value={summary.averageIntervalMin !== null ? `${summary.averageIntervalMin} min` : "—"}
          />
        </div>
      )}

      {summary.meetsRule && (
        <div className="rounded-2xl bg-danger/10 p-3">
          <p className="text-sm font-bold text-danger">{t.contractionsRuleMet}</p>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">{t.contractionsRuleMetHint}</p>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-text-muted">{t.contractionsDisclaimer}</p>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-muted py-2">
      <p className="text-base font-extrabold text-text-primary">{value}</p>
      <p className="text-[11px] leading-tight text-text-secondary">{label}</p>
    </div>
  );
}
