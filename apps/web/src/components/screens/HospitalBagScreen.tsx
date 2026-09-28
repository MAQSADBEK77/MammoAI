"use client";

import { useEffect, useState } from "react";
import { CheckCircle, RadioButtonUnchecked } from "@mui/icons-material";
import clsx from "clsx";
import { HOSPITAL_BAG_ITEMS, bagProgress, type BagGroup } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { ScreenHeader, LoadingSpinner, ErrorState } from "@/components/ui";

/**
 * PREG-BAG-01 — tug'ruqxona sumkasi.
 *
 * Belgilash DARHOL ko'rinadi, server javobini kutmasdan: ayol ro'yxatni
 * sumka yig'ayotib, telefonni bir qo'lda ushlab bosadi. Har bosishda
 * bir soniya kutish bu ishni azobga aylantirardi (harakat sanagichida
 * ham xuddi shu xato bor edi).
 */
const GROUP_ORDER: BagGroup[] = ["documents", "mother", "baby"];

export function HospitalBagScreen() {
  const { dict } = useI18n();
  const t = dict.pregnancy;
  const [checked, setChecked] = useState<string[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      api.pregnancy
        .get()
        .then((res) => {
          if (!cancelled) setChecked(res.bagItems);
        })
        .catch(() => {
          if (!cancelled) setLoadError(true);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  function toggle(id: string) {
    const next = checked?.includes(id) ? checked.filter((x) => x !== id) : [...(checked ?? []), id];
    setChecked(next);
    // Serverga orqada yuboriladi. Xato bo'lsa keyingi ochilishda
    // server holati ko'rsatiladi — belgilash yo'qolishi mumkin, lekin
    // ekran hech qachon "qotib" qolmaydi.
    api.pregnancy.setBagItem(id, !checked?.includes(id)).catch(() => {});
  }

  if (loadError) {
    return (
      <div className="space-y-4 pb-8">
        <ScreenHeader title={t.bagTitle} subtitle={t.bagSubtitle} />
        <ErrorState message={dict.common.errorGeneric} />
      </div>
    );
  }

  if (checked === null) {
    return (
      <div className="space-y-4 pb-8">
        <ScreenHeader title={t.bagTitle} subtitle={t.bagSubtitle} />
        <LoadingSpinner label={dict.common.loading} inline />
      </div>
    );
  }

  const progress = bagProgress(checked);

  return (
    <div className="space-y-4 pb-8">
      <ScreenHeader title={t.bagTitle} subtitle={t.bagSubtitle} />

      <div className="rounded-3xl bg-surface p-4 shadow-sm">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-bold text-text-primary">{t.bagProgress(progress.checked, progress.total)}</p>
          <p className="text-xs font-semibold text-text-secondary">{progress.percent}%</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className={clsx("h-full rounded-full transition-all", progress.ready ? "bg-success" : "bg-pregnancy-accent")}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        {progress.ready ? (
          <div className="mt-3">
            <p className="text-sm font-bold text-success">{t.bagReady}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{t.bagReadyHint}</p>
          </div>
        ) : (
          <p className="mt-3 text-xs font-semibold text-warning">{t.bagMissing(progress.missingEssential.length)}</p>
        )}
      </div>

      {GROUP_ORDER.map((g) => (
        <section key={g} className="space-y-2">
          <h2 className="px-1 text-xs font-bold uppercase tracking-wide text-text-muted">{t.bagGroups[g]}</h2>
          <div className="overflow-hidden rounded-3xl bg-surface shadow-sm">
            {HOSPITAL_BAG_ITEMS.filter((i) => i.group === g).map((item, index) => {
              const on = checked.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={clsx(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-surface-muted",
                    index > 0 && "border-t border-border/60"
                  )}
                >
                  {on ? (
                    <CheckCircle sx={{ fontSize: 22 }} className="text-success shrink-0" />
                  ) : (
                    <RadioButtonUnchecked sx={{ fontSize: 22 }} className="shrink-0 text-text-muted" />
                  )}
                  <span className={clsx("min-w-0 flex-1 text-sm", on ? "text-text-muted line-through" : "text-text-primary")}>
                    {t.bagList[item.id as keyof typeof t.bagList]}
                  </span>
                  {item.essential && !on && (
                    <span className="bg-warning/15 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-warning">
                      {t.bagEssential}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <p className="px-1 text-[11px] leading-relaxed text-text-muted">{t.bagNote}</p>
    </div>
  );
}
