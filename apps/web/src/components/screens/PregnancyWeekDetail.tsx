"use client";

import { useEffect, useRef, useState } from "react";
import { Close } from "@mui/icons-material";
import clsx from "clsx";
import { fetalSizeForWeek, getMilestoneForWeek, type PregnancyWeekContent } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { PregnancyWeekImage } from "@/components/PregnancyWeekImage";
import { SizeFruitImage } from "@/components/SizeFruitImage";
import { LoadingSpinner } from "@/components/ui";

/**
 * PREG-DETAIL-01 — "Batafsil" ekrani.
 *
 * Ilgari bu kichik oyna edi: ikkita xatboshi va yopish tugmasi. Referensda
 * esa TO'LIQ EKRAN va uchta narsa qo'shiladi:
 *
 *   1. HAFTA TANLAGICH. Ayol faqat bugungi haftani emas, o'tganini ham,
 *      keladiganini ham ko'ra oladi. "Yana nima kutmoqda" degan savolga
 *      javob shu — va u homiladorlikda doimiy savol.
 *   2. O'LCHAMLAR. Bo'y va vazn raqamlari (JSST jadvali) + meva bilan
 *      taqqoslash. Ilgari faqat "kivi kattaligida" degan matn bor edi.
 *   3. O'LCHASH USULI 20-haftada o'zgarishi AYTILADI. Usiz 13->14
 *      haftadagi sakrash xatodek ko'rinadi.
 */
const MIN_WEEK = 1;
const MAX_WEEK = 42;

export function PregnancyWeekDetail({ currentWeek, onClose }: { currentWeek: number; onClose: () => void }) {
  const { dict } = useI18n();
  const [week, setWeek] = useState(currentWeek);
  const [content, setContent] = useState<PregnancyWeekContent | null>(null);
  const [loading, setLoading] = useState(true);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    // `setTimeout(0)` — effekt ichida SINXRON setState ESLint qoidasini
    // buzadi ("cascading renders"). Loyihada bu naqsh allaqachon
    // ishlatiladi (ClinicsScreen, maqolalar sahifasi).
    const timeout = setTimeout(() => {
      setLoading(true);
    }, 0);
    api.pregnancy
      .weekContent(week)
      .then((res) => {
        if (!cancelled) setContent(res.content ?? null);
      })
      .catch(() => {
        if (!cancelled) setContent(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [week]);

  // Tanlangan hafta ko'rinadigan joyda tursin — aks holda 37-haftadagi
  // ayol tanlagichni qo'lda aylantirishi kerak bo'lardi.
  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>(`[data-week="${week}"]`);
    el?.scrollIntoView({ behavior: "instant", block: "nearest", inline: "center" });
  }, [week]);

  const size = fetalSizeForWeek(week);
  const milestone = getMilestoneForWeek(week);
  const sizeLabel =
    content?.sizeLabel ??
    dict.pregnancy.sizes[milestone.sizeComparisonKey.replace("size.", "") as keyof typeof dict.pregnancy.sizes];

  return (
    <div className="bg-aurora-pregnancy-soft fixed inset-0 z-50 flex flex-col overflow-y-auto">
      <div className="flex shrink-0 justify-start p-4" style={{ paddingTop: "calc(var(--tg-safe-area-top) + 1rem)" }}>
        <button
          type="button"
          onClick={onClose}
          aria-label={dict.common.close}
          className="text-pregnancy-accent grid h-10 w-10 place-items-center rounded-full bg-surface/70"
        >
          <Close sx={{ fontSize: 20 }} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-4">
        <PregnancyWeekImage
          week={week}
          icon={milestone.icon}
          className="object-cover"
          style={{
            width: 260,
            height: 260,
            WebkitMaskImage: "radial-gradient(circle, #000 52%, transparent 74%)",
            maskImage: "radial-gradient(circle, #000 52%, transparent 74%)",
          }}
        />
      </div>

      {/* Hafta tanlagich */}
      <div ref={stripRef} className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-4 pb-3">
        {Array.from({ length: MAX_WEEK - MIN_WEEK + 1 }, (_, i) => MIN_WEEK + i).map((w) => (
          <button
            key={w}
            type="button"
            data-week={w}
            onClick={() => setWeek(w)}
            className={clsx(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              w === week ? "bg-surface text-pregnancy-accent shadow-sm" : "bg-surface/40 text-text-secondary"
            )}
          >
            {dict.pregnancy.weekLabel(w)}
          </button>
        ))}
      </div>

      {/* Pastki varaq */}
      <div className="shrink-0 rounded-t-[1.75rem] bg-surface px-4 pb-8 pt-5">
        <h2 className="text-xl font-extrabold text-text-primary">{dict.pregnancy.weekDetailTitle(week)}</h2>

        {size && (
          <div className="mt-4 flex items-center gap-4">
            <span className="bg-pregnancy-accent/10 grid h-16 w-16 shrink-0 place-items-center rounded-2xl">
              {/* SIZE-IMG-01: hafta rasmi bo'lsa — rasm, bo'lmasa emoji. */}
              <SizeFruitImage
                label={sizeLabel}
                emoji={
                  dict.pregnancy.sizeEmoji[
                    milestone.sizeComparisonKey.replace("size.", "") as keyof typeof dict.pregnancy.sizeEmoji
                  ] ?? "🍋"
                }
                size={34}
              />
            </span>
            <div className="min-w-0 space-y-0.5 text-sm">
              <p className="font-bold text-text-primary">{dict.pregnancy.sizeComparison(sizeLabel)}</p>
              <p className="text-text-secondary">{dict.pregnancy.detailLength(size.lengthCm)}</p>
              <p className="text-text-secondary">{dict.pregnancy.detailWeight(size.weightG)}</p>
            </div>
          </div>
        )}

        {size && (
          <p className="mt-3 text-xs leading-relaxed text-text-muted">
            {size.measure === "crown_rump" ? dict.pregnancy.measureCrownRump : dict.pregnancy.measureCrownHeel}{" "}
            {dict.pregnancy.detailAverageNote}
          </p>
        )}

        {loading ? (
          <div className="py-6">
            <LoadingSpinner inline />
          </div>
        ) : content ? (
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm font-bold text-text-primary">{dict.pregnancy.babyDevelopmentTitle}</p>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">{content.babyDevelopment}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">{dict.pregnancy.motherChangesTitle}</p>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">{content.motherChanges}</p>
            </div>
          </div>
        ) : (
          <p className="mt-5 text-sm text-text-muted">{dict.pregnancy.weekContentMissing}</p>
        )}
      </div>
    </div>
  );
}
