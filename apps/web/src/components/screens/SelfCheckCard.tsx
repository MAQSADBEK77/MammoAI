"use client";

import clsx from "clsx";
import { ChevronRight } from "@mui/icons-material";
import type { Article, RiskQuizResult } from "@mammoai/shared";
import { formatDateDisplay } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";

/**
 * REUSE-01 — bor narsalarni joyida ishlatish.
 *
 * Bosh ekranda "o'z-o'zini tekshirish testi" va "maqolalar" ikkita kichik,
 * faqat SARLAVHADAN iborat kartacha edi: natija ham, kontent ham
 * ko'rsatilmasdi. Holbuki production raqamlari boshqa narsani aytadi —
 * testni 34 ta ayol to'ldirgan, ya'ni hayz qayd etgandan (30) KO'PROQ.
 * Ya'ni eng ko'p ishlatilgan xususiyatlardan biri eng kam ko'rinadigan
 * joyda turgan edi.
 *
 * Referensdagi (Flo) "Symptom Checker" bloki NATIJANI ko'rsatadi: nima
 * aniqlangani, qachon yangilangani va keyingi qadam. Bu yerda ham shunday.
 */
export function SelfCheckCard({ result, onOpen }: { result: RiskQuizResult | null; onOpen: () => void }) {
  const { dict } = useI18n();
  const level = result ? dict.riskQuiz.levels[result.level] : null;

  return (
    <button type="button" onClick={onOpen} className="w-full text-left">
      <section className="rounded-3xl bg-surface p-5 shadow-sm active:scale-[0.99]">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-text-primary">{dict.cycle.riskQuizCardTitle}</h3>
          <ChevronRight sx={{ fontSize: 22 }} className="shrink-0 text-text-muted" />
        </div>

        {result && level ? (
          <>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-text-secondary">{dict.cycle.selfCheckLastResult}</p>
                <p className="mt-0.5 text-lg font-bold text-text-primary">{level.label}</p>
              </div>
              <span
                className={clsx(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-bold",
                  result.level === "high" && "bg-danger/15 text-danger",
                  result.level === "medium" && "bg-warning/15 text-warning",
                  result.level === "low" && "bg-success/15 text-success"
                )}
              >
                {dict.cycle.selfCheckUpdated(formatDateDisplay(result.completedAt))}
              </span>
            </div>
            {/* Referensdagi kabi ogohlantirish. Bu SHART: "yuqori xavf"
                yozuvini tashxis deb tushunish real xavf. */}
            <p className="mt-3 text-xs leading-relaxed text-text-muted">{dict.cycle.selfCheckDisclaimer}</p>
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{dict.cycle.riskQuizCardSubtitle}</p>
        )}
      </section>
    </button>
  );
}

/**
 * REUSE-01 — maqolalar. Ilgari bu ham faqat "Maqolalar" degan sarlavha edi,
 * ya'ni ichida nima borligi ko'rinmasdi va bosishga sabab yo'q edi.
 * Referensdagi ("Based on your current cycle") kabi endi maqolalarning
 * O'ZI ko'rinadi.
 */
export function ArticlesRow({
  articles,
  onOpen,
  onOpenAll,
}: {
  articles: Article[];
  onOpen: (slug: string) => void;
  onOpenAll: () => void;
}) {
  const { dict } = useI18n();
  if (articles.length === 0) return null;

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-text-primary">{dict.cycle.articlesCardTitle}</h3>
        <button type="button" onClick={onOpenAll} className="text-sm font-semibold text-primary-dark">
          {dict.cycle.viewAllLogsLabel}
        </button>
      </div>

      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
        {articles.map((a) => (
          <button
            key={a.slug}
            type="button"
            onClick={() => onOpen(a.slug)}
            className="w-52 shrink-0 snap-start rounded-2xl bg-surface p-4 text-left shadow-sm active:scale-[0.98]"
          >
            <span className="inline-block rounded-full bg-secondary/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-secondary">
              {dict.articles.categories[a.category]}
            </span>
            <p className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-text-primary">{a.title}</p>
            <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-text-secondary">{a.excerpt}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
