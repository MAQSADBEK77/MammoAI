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
      {/* OVERNIGHT-16: ilgari kartalar hech qanday moslashuvsiz oxirgi
          o'ringacha "xom" kesilib qolardi (tizim scrollbar'i bilan birga)
          — o'ngdagi xiralashish (fade) "yana bor" signalini beradi,
          scroll-snap esa har doim BUTUN kartaga to'g'ri to'xtaydi (yarim
          karta ko'rinib qolmaydi), tizim scrollbar'i esa yashiringan. */}
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)] [-webkit-mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)]">
        {ids.map((id, i) => {
          const content = dict.cycle.dailyInsights[id];
          const clickable = DAILY_INSIGHT_LINK[id] === "assistant";
          return (
            <button
              key={id}
              type="button"
              onClick={clickable ? () => router.push("/yordamchi") : undefined}
              className={`w-40 shrink-0 snap-start rounded-2xl p-4 text-left ${TINTS[i % TINTS.length]} ${clickable ? "active:scale-[0.98]" : ""}`}
            >
              <div className="flex items-start justify-between">
                <Emoji e={DAILY_INSIGHT_EMOJI[id]} size={22} />
                {/* "Sizga atalgan" tuyg'usi uchun kichik, iliq belgi — ataylab
                    robot/tizim ikonkasi emas (foydalanuvchi so'rovi: bu matn
                    "yaqin odam yozganday" his qilinsin). */}
                <Emoji e="💗" size={12} className="opacity-50" />
              </div>
              <p className="mt-2 text-sm font-bold text-text-primary">{content.title}</p>
              <p className="mt-1 text-xs leading-snug text-text-secondary">{content.body}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
