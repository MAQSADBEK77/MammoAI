"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Close, ChatBubbleOutlineOutlined } from "@mui/icons-material";
import { useI18n } from "@/lib/i18n";
import { Emoji } from "@/components/Emoji";
import { Portal } from "@/components/Portal";
import { dismissAssistantPeek, useAssistantPeek } from "@/lib/assistant-peek";

/**
 * TODAY-05 — yordamchining "mo'ralash" oynasi.
 *
 * JOYLASHUV (foydalanuvchi so'rovi 2026-09-21): oyna menyu ustida suzib
 * turgan alohida karta EMAS — u menyudagi yordamchi ikonkasiga ULANGAN.
 * Shuning uchun:
 *  • BottomNav har doim tekis (hech qanday ko'tarilgan band yo'q);
 *  • oyna menyuning yuqori qirrasiga aniq tegib turadi
 *    (`bottom: var(--bottom-nav-height)` — BottomNav o'zi o'lchaydigan
 *    HAQIQIY balandlik, taxmin emas);
 *  • oynadan pastga, yordamchi bandining ustiga oq "til" tushadi. Ikkalasi
 *    ham `bg-surface` va tegib turgani uchun yaxlit shakl bo'lib ko'rinadi.
 * Til o'rni foizda (`left: 90%`): menyu ham, oyna ham bir xil kenglikda
 * (`max-w-md` + `px-4`) va 5 ta band teng bo'lingani uchun 5-bandning
 * markazi aynan shu yerda. Qattiq piksel qiymat ekran kengligi o'zgarganda
 * siljib ketardi.
 *
 * ANIMATSIYA (referensdagi ikki bosqich):
 *  1) karta pastdan silliq suriladi va ichida "yozmoqda" nuqtalari turadi;
 *  2) bir necha soniyadan keyin nuqtalar o'rnini haqiqiy xabar egallaydi,
 *     karta balandligi esa sakramasdan o'sadi (grid-rows 0fr→1fr).
 */

/** "Yozmoqda" bosqichi qancha davom etadi. Referensdagi kabi — javob
 * yozilayotgandek his qoldiradigan, lekin kutdirmaydigan oraliq. */
const TYPING_MS = 1600;

export function TodayAssistantCard() {
  const { dict } = useI18n();
  const router = useRouter();
  const visible = useAssistantPeek();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const timeout = setTimeout(() => setRevealed(true), TYPING_MS);
    return () => clearTimeout(timeout);
  }, [visible]);

  if (!visible) return null;

  /** Tayyor savol bilan yordamchiga o'tish — matn maydonga qo'yiladi,
   * avtomatik yuborilmaydi (foydalanuvchi uni tahrirlashi mumkin). */
  const ask = (question?: string) =>
    router.push(question ? `/yordamchi?q=${encodeURIComponent(question)}` : "/yordamchi");

  return (
    <Portal lockScroll={false}>
      <div className="fixed inset-x-0 z-30 flex justify-center px-4" style={{ bottom: "var(--bottom-nav-height)" }}>
        <div className="assistant-rise relative w-full max-w-md rounded-t-[28px] bg-surface p-5 shadow-[0_-8px_28px_rgba(0,0,0,0.12)]">
          <div className="flex items-start justify-between gap-3">
            <p className="text-base font-bold text-text-primary">{dict.cycle.assistantCardTitle}</p>
            <button
              type="button"
              onClick={dismissAssistantPeek}
              aria-label={dict.cycle.assistantCardDismiss}
              className="tap-target flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary active:scale-95"
            >
              <Close sx={{ fontSize: 16 }} />
            </button>
          </div>

          {/* Avatar pastga tekislangan — referensda u xabarlar guruhining
              OXIRGI pufakchasi bilan bir qatorda turadi. */}
          <div className="mt-4 flex items-end gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-light/40">
              <Emoji e="💬" size={22} />
            </span>

            <div className="min-w-0 flex-1">
              {!revealed && (
                <span className="inline-flex items-center gap-1.5 rounded-3xl rounded-bl-md bg-surface-muted px-4 py-3.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="typing-dot h-2 w-2 rounded-full bg-text-muted"
                      style={{ animationDelay: `${i * 0.18}s` }}
                    />
                  ))}
                </span>
              )}

              {/* Balandlik grid orqali animatsiya qilinadi — mazmun
                  balandligini oldindan bilish shart emas. */}
              <div
                className={clsx(
                  "grid transition-[grid-template-rows] duration-500",
                  revealed ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
                style={{ transitionTimingFunction: "var(--motion-ease-brand)" }}
              >
                <div className="overflow-hidden">
                  {revealed && (
                    <div className="space-y-2">
                      <p
                        className="assistant-bubble rounded-3xl rounded-bl-md bg-surface-muted px-4 py-3 text-base leading-snug text-text-primary"
                        style={{ animationDelay: "0ms" }}
                      >
                        {dict.cycle.assistantCardMessage}
                      </p>
                      {[
                        { emoji: "🔍", text: dict.cycle.assistantCardOption1 },
                        { emoji: "🌿", text: dict.cycle.assistantCardOption2 },
                      ].map((opt, i) => (
                        <button
                          key={opt.text}
                          type="button"
                          onClick={() => ask(opt.text)}
                          className="assistant-bubble tap-target flex w-full items-center gap-2 rounded-3xl bg-surface-muted px-4 py-3 text-left text-base text-text-primary transition active:scale-[0.99]"
                          style={{ animationDelay: `${120 + i * 110}ms` }}
                        >
                          <Emoji e={opt.emoji} size={20} />
                          <span className="min-w-0 flex-1">{opt.text}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Referensda tugma butun kenglikni EGALLAMAYDI — markazda,
              mazmuniga qarab kengayadigan tabletka shaklida. */}
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => ask()}
              className="tap-target rounded-full bg-accent px-10 py-3.5 text-lg font-bold text-white transition active:scale-[0.98]"
            >
              {dict.cycle.assistantCardCta}
            </button>
          </div>

          {/* Menyudagi yordamchi bandiga tushadigan oq til — oynani o'sha
              ikonkaga bog'laydi. `top-full` = oynaning pastki qirrasidan
              boshlanadi, ya'ni orada bo'shliq qolmaydi. */}
          <button
            type="button"
            onClick={() => ask()}
            aria-label={dict.nav.assistant}
            className="absolute left-[90%] top-full flex h-14 w-[4.5rem] -translate-x-1/2 items-start justify-center rounded-b-2xl bg-surface pt-1.5 text-text-primary"
          >
            <ChatBubbleOutlineOutlined sx={{ fontSize: 28 }} />
          </button>
        </div>
      </div>
    </Portal>
  );
}
