"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Close } from "@mui/icons-material";
import { useI18n } from "@/lib/i18n";
import { Emoji } from "@/components/Emoji";
import { Portal } from "@/components/Portal";
import { dismissAssistantPeek, useAssistantPeek } from "@/lib/assistant-peek";

/**
 * TODAY-05 — yordamchining "mo'ralash" oynasi.
 *
 * JOYLASHUV: oyna menyu ustida suzib turgan mustaqil karta EMAS — u menyudagi
 * yordamchi ikonkasiga ULANGAN. Bog'lanish ikki narsa orqali:
 *  • oyna ostidan ikonkaga tushadigan pufakcha "dumi" (uchi menyu panelining
 *    yuqori qirrasiga aynan tegib turadi);
 *  • ochilish animatsiyasining MARKAZI ham o'sha ikonka (globals.css:
 *    `assistant-bloom` — clip-path radiusi ikonkadan o'sadi).
 *
 * Ikkalasi ham `--assistant-anchor-x` ga tayanadi: BottomNav yordamchi
 * bandining markazini O'LCHAB shu o'zgaruvchiga yozadi. Ilgari o'rin
 * `left-[90%]` deb taxmin qilingandi, va "hamkorimni kuzataman" rejimida
 * (Jamiyat bandi yo'q, 4 band) dum noto'g'ri bandga tushardi.
 *
 * NIMA TUZATILDI (foydalanuvchi so'rovi 2026-09-22 — "it is not smooth ...
 * this block is not smoothly merged"):
 *  1. Ilgari karta butun kengligi bilan ekran ostidan SURILIB chiqardi, ya'ni
 *     ikonkaga aloqasi ko'rinmasdi. Endi aynan ikonkadan ochiladi.
 *  2. Yopilganda animatsiyasiz G'OYIB bo'lardi (`if (!visible) return null`).
 *     Endi yopilish ham animatsiyali: `closing` holati, va do'kondagi holat
 *     animatsiya TUGAGACH o'zgartiriladi.
 *  3. "Yozmoqda" nuqtalari xabar chiqishi bilan BIRDAN o'chib ketardi
 *     (`{!revealed && ...}`) — sakrash shu yerdan kelardi. Endi ikkalasi ham
 *     DOIM ulangan holda turadi va bir-biriga silliq o'tadi (grid 1fr↔0fr).
 *  4. Ilgari menyudagi yordamchi bandining ustiga oq to'rtburchak "til"
 *     tushardi va "Yordamchi" yozuvini berkitib qo'yardi. Endi menyu
 *     to'liq ko'rinadi, bandning o'z ikonkasi esa kattalashadi (BottomNav).
 */

/** "Yozmoqda" bosqichi qancha davom etadi. */
const TYPING_MS = 1600;

/** Yopilish animatsiyasi (globals.css `.assistant-wilt`) bilan BIR XIL
 * bo'lishi shart — do'kondagi holat aynan shundan keyin o'zgaradi. */
const EXIT_MS = 260;

/** Pufakcha dumining balandligi. Oynaning menyudan balandligi ham AYNAN
 * shu — shuning uchun dum uchi panelning yuqori qirrasiga tegib turadi,
 * orada bo'shliq ham, ustma-ust tushish ham bo'lmaydi. */
const TAIL_HEIGHT = 13;
const TAIL_WIDTH = 46;

export function TodayAssistantCard() {
  const { dict } = useI18n();
  const router = useRouter();
  const visible = useAssistantPeek();
  const [revealed, setRevealed] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const timeout = setTimeout(() => setRevealed(true), TYPING_MS);
    return () => clearTimeout(timeout);
  }, [visible]);

  if (!visible) return null;

  /** Yopish — avval chiqish animatsiyasi, KEYIN holat. Teskari tartibda
   * qilinsa komponent darhol yechilib, animatsiya ko'rinmay qolardi. */
  const close = () => {
    setClosing(true);
    setTimeout(dismissAssistantPeek, EXIT_MS);
  };

  /** Tayyor savol bilan yordamchiga o'tish — matn maydonga qo'yiladi,
   * avtomatik yuborilmaydi (foydalanuvchi uni tahrirlashi mumkin). */
  const ask = (question?: string) =>
    router.push(question ? `/yordamchi?q=${encodeURIComponent(question)}` : "/yordamchi");

  const options = [
    { emoji: "🔍", text: dict.cycle.assistantCardOption1 },
    { emoji: "🌿", text: dict.cycle.assistantCardOption2 },
  ];

  return (
    <Portal lockScroll={false}>
      <div
        className="fixed inset-x-0 z-30 flex justify-center px-4"
        style={{ bottom: `calc(var(--bottom-nav-height) + ${TAIL_HEIGHT}px)` }}
      >
        <div
          className={clsx(
            "relative w-full max-w-md rounded-[28px] bg-surface p-5 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.28)]",
            closing ? "assistant-wilt" : "assistant-bloom"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-base font-bold text-text-primary">{dict.cycle.assistantCardTitle}</p>
            <button
              type="button"
              onClick={close}
              aria-label={dict.cycle.assistantCardDismiss}
              className="tap-target flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary active:scale-95"
            >
              <Close sx={{ fontSize: 16 }} />
            </button>
          </div>

          {/* Avatar pastga tekislangan — u xabarlar guruhining OXIRGI
              pufakchasi bilan bir qatorda turadi. */}
          <div className="mt-4 flex items-end gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-light/40">
              <Emoji e="💬" size={22} />
            </span>

            <div className="min-w-0 flex-1">
              {/* Ikki blok ham DOIM ulangan holda turadi va biri ikkinchisiga
                  o'tadi. Balandlik `max-height` bilan emas, `grid-template-rows:
                  1fr↔0fr` bilan animatsiya qilinadi: `max-height`da aniq
                  qiymatni oldindan bilish kerak (matn uzunligi tilga qarab
                  o'zgaradi — ru/en'da uzunroq), taxminiy katta qiymat esa
                  animatsiyani "sakragan" qilib qo'yardi. */}
              <div
                className={clsx(
                  "grid transition-[grid-template-rows,opacity] duration-300",
                  revealed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
                )}
                style={{ transitionTimingFunction: "var(--motion-ease-brand)" }}
                aria-hidden={revealed}
              >
                <div className="overflow-hidden">
                  <span className="inline-flex items-center gap-1.5 rounded-3xl rounded-bl-md bg-surface-muted px-4 py-3.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="typing-dot h-2 w-2 rounded-full bg-text-muted"
                        style={{ animationDelay: `${i * 0.18}s` }}
                      />
                    ))}
                  </span>
                </div>
              </div>

              <div
                className={clsx(
                  "grid transition-[grid-template-rows,opacity] duration-500",
                  revealed ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
                style={{ transitionTimingFunction: "var(--motion-ease-brand)" }}
                aria-hidden={!revealed}
              >
                <div className="overflow-hidden">
                  <div className="space-y-2">
                    {/* Pufakchalar birin-ketin chiqadi — bir vaqtda paydo
                        bo'lgani "sahifa sakradi" degan taassurot berardi.
                        Kechikish CSS animatsiyasi emas, `transition-delay`:
                        shu orqali TESKARI yo'nalish (yopilish) ham silliq. */}
                    <p
                      className={clsx(
                        "rounded-3xl rounded-bl-md bg-surface-muted px-4 py-3 text-base leading-snug text-text-primary transition-all duration-300",
                        revealed ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                      )}
                      style={{ transitionDelay: revealed ? "60ms" : "0ms" }}
                    >
                      {dict.cycle.assistantCardMessage}
                    </p>
                    {options.map((opt, i) => (
                      <button
                        key={opt.text}
                        type="button"
                        onClick={() => ask(opt.text)}
                        tabIndex={revealed ? undefined : -1}
                        className={clsx(
                          "tap-target flex w-full items-center gap-2 rounded-3xl bg-surface-muted px-4 py-3 text-left text-base text-text-primary transition-all duration-300 active:scale-[0.99]",
                          revealed ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                        )}
                        style={{ transitionDelay: revealed ? `${160 + i * 90}ms` : "0ms" }}
                      >
                        <Emoji e={opt.emoji} size={20} />
                        <span className="min-w-0 flex-1">{opt.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tugma butun kenglikni EGALLAMAYDI — markazda, mazmuniga qarab
              kengayadigan tabletka shaklida. */}
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => ask()}
              className="tap-target rounded-full bg-accent px-10 py-3.5 text-lg font-bold text-white transition active:scale-[0.98]"
            >
              {dict.cycle.assistantCardCta}
            </button>
          </div>

          {/* Pufakcha dumi — oynani menyudagi ikonkaga bog'laydi. Yelkalari
              ICHKARIGA egilgan (concave), shuning uchun oynaning pastki
              qirrasiga chiziq qoldirmasdan qo'shilib ketadi; oddiy uchburchak
              qo'yilsa ulanish joyi burchak bo'lib ko'zga urilardi.
              `top-full` = oynaning pastki qirrasi, ya'ni orada bo'shliq yo'q.
              Rang `var(--color-surface)` — Tailwind'ning `fill-*` yordamchisi
              loyiha tokenlari uchun yaratilmagan. */}
          <svg
            aria-hidden
            width={TAIL_WIDTH}
            height={TAIL_HEIGHT}
            viewBox={`0 0 ${TAIL_WIDTH} ${TAIL_HEIGHT}`}
            className={clsx("absolute top-full", closing ? "assistant-tail-out" : "assistant-tail")}
            style={{ left: "var(--assistant-anchor-x, 90%)", fill: "var(--color-surface)" }}
          >
            <path d={`M0 0 C 11 0 13 ${TAIL_HEIGHT} 23 ${TAIL_HEIGHT} C 33 ${TAIL_HEIGHT} 35 0 ${TAIL_WIDTH} 0 Z`} />
          </svg>
        </div>
      </div>
    </Portal>
  );
}
