"use client";

// "Kunlik maslahatlar" — foydalanuvchi Flo'ning "My daily insights" gorizontal
// skroll kartalarini ko'rsatib, shu funksiyani so'radi. Matn/qaysi kartalar
// mantiqi packages/shared/src/logic/daily-insights.ts'da (backend/DB shart
// emas — sana bo'yicha aylanadigan sof funksiya).

import { useRouter } from "next/navigation";
import { getDailyInsightIds, DAILY_INSIGHT_EMOJI, DAILY_INSIGHT_LINK, localDateStr } from "@mammoai/shared";
import type { CyclePhase } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { Emoji } from "@/components/Emoji";

// Kartalarga vizual xilma-xillik — Flo'dagi har xil rangli kartalar kabi,
// lekin yangi palitra emas, mavjud brend tokenlaridan aylanadigan to'plam.
const TINTS = ["bg-primary/10", "bg-secondary/10", "bg-accent/10", "bg-warning/10"];

export function DailyInsightsCarousel({ phase }: { phase: CyclePhase | null }) {
  const { dict } = useI18n();
  const router = useRouter();
  const ids = getDailyInsightIds(phase, localDateStr());

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-base font-bold text-text-primary">{dict.cycle.dailyInsightsTitle}</p>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {ids.map((id, i) => {
          const content = dict.cycle.dailyInsights[id];
          const clickable = DAILY_INSIGHT_LINK[id] === "assistant";
          return (
            <button
              key={id}
              type="button"
              onClick={clickable ? () => router.push("/yordamchi") : undefined}
              className={`w-40 shrink-0 rounded-2xl p-4 text-left ${TINTS[i % TINTS.length]} ${clickable ? "active:scale-[0.98]" : ""}`}
            >
              <Emoji e={DAILY_INSIGHT_EMOJI[id]} size={22} />
              <p className="mt-2 text-sm font-bold text-text-primary">{content.title}</p>
              <p className="mt-1 text-xs leading-snug text-text-secondary">{content.body}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
