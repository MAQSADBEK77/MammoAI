"use client";

// "Kunlik maslahatlar" — foydalanuvchi Flo'ning "My daily insights" gorizontal
// skroll kartalarini ko'rsatib, shu funksiyani so'radi. Matn/qaysi kartalar
// mantiqi packages/shared/src/logic/daily-insights.ts'da (backend/DB shart
// emas — sana bo'yicha aylanadigan sof funksiya).

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@mui/material";
import { getDailyInsightIds, DAILY_INSIGHT_EMOJI, DAILY_INSIGHT_LINK, localDateStr } from "@mammoai/shared";
import type { CyclePhase } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { Emoji } from "@/components/Emoji";

// Kartalarga vizual xilma-xillik — Flo'dagi har xil rangli kartalar kabi,
// lekin yangi palitra emas, mavjud brend tokenlaridan aylanadigan to'plam.
const TINTS = ["bg-primary/10", "bg-secondary/10", "bg-accent/10", "bg-warning/10"];

/**
 * TODAY-11 (foydalanuvchi so'rovi + referenslar): kartalar endi RASM-BIRINCHI.
 * Ilgari har kartada sarlavha USTIGA yana 2-3 qatorlik paragraf turardi va
 * bosh ekran matnga to'lib ketardi ("yozuvi ko'p"). Referenslarda (Flo va
 * boshqa ikkita ilova) karta ikki qismdan iborat: yuqorisi — rangli VIZUAL
 * blok, pastda — ikki-uch so'zli sarlavha. Matnning o'zi kartani bosganda
 * ochiladi.
 *
 * Maslahat MATNI yo'qolmadi — u endi bosilganda chiqadi. Ya'ni bosh ekran
 * tinch, lekin mazmun joyida.
 */
export function DailyInsightsCarousel({ phase }: { phase: CyclePhase | null }) {
  const { dict } = useI18n();
  const router = useRouter();
  const ids = getDailyInsightIds(phase, localDateStr());
  const [openId, setOpenId] = useState<(typeof ids)[number] | null>(null);
  const openContent = openId ? dict.cycle.dailyInsights[openId] : null;

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
              // Yordamchi kartasi avvalgidek to'g'ridan-to'g'ri chatga olib
              // boradi; qolganlari matnni shu yerda ochadi.
              onClick={clickable ? () => router.push("/yordamchi") : () => setOpenId(id)}
              className="w-40 shrink-0 snap-start overflow-hidden rounded-2xl bg-surface text-left shadow-sm active:scale-[0.98]"
            >
              {/* Vizual blok — kartaning yuzi. Balandligi QAT'IY, shuning
                  uchun sarlavha uzunligidan qat'i nazar hamma karta bir xil
                  ko'rinadi (aks holda qator notekis bo'lib qolardi). */}
              <span className={`flex h-24 items-center justify-center ${TINTS[i % TINTS.length]}`}>
                <Emoji e={DAILY_INSIGHT_EMOJI[id]} size={44} />
              </span>
              <span className="flex h-16 items-start p-3">
                <span className="line-clamp-2 text-sm font-bold leading-snug text-text-primary">
                  {content.title}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Matn kartadan chiqarilib shu yerga ko'chdi. "Yaqin odam yozganday"
          ohangdagi kichik belgi ham shu yerda — kartada u faqat shovqin
          qo'shardi. */}
      <Dialog
        open={!!openId}
        onClose={() => setOpenId(null)}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: "24px", margin: 2 } } }}
      >
        <DialogContent>
          {openId && openContent && (
            <div className="text-center">
              <Emoji e={DAILY_INSIGHT_EMOJI[openId]} size={48} />
              <p className="mt-3 text-lg font-bold text-text-primary">{openContent.title}</p>
              <p className="mt-2 text-base leading-relaxed text-text-secondary">{openContent.body}</p>
              <p className="mt-4">
                <Emoji e="💗" size={16} className="opacity-60" />
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
