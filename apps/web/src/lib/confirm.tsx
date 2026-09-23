"use client";

// CONFIRM-01 — ilova ichidagi tasdiqlash oynasi.
//
// Nega kerak: ilgari hamma joyda brauzerning `window.confirm()`i
// ishlatilardi. Telegram Mini App WebView'da (ayniqsa iOS'da) `alert`,
// `confirm` va `prompt` QO'LLAB-QUVVATLANMAYDI — Telegram ularni bosib
// qoladi. Natijada `if (!window.confirm(...)) return;` naqshi JIMGINA
// `false` olib, amalni bekor qilardi: foydalanuvchi tugmani bosardi,
// hech narsa sodir bo'lmasdi va hech qanday xato ham ko'rinmasdi.
// Foydalanuvchi buni "rejimni o'zgartira olmayapman" deb aytdi.
//
// Foydalanuvchilarimizning deyarli hammasi Telegram orqali kiradi, ya'ni
// bu logout, akkauntni o'chirish, yozuvni o'chirish, hamkorni uzish,
// jamiyatdagi post/izohni o'chirish — hammasiga tegishli edi.
//
// Telegram'ning o'z `showConfirm` SDK'si o'rniga o'z oynamiz: u HAMMA
// muhitda bir xil ishlaydi (brauzer, Telegram, Median o'rami) va ilovaning
// dizayniga mos keladi.

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Dialog } from "@mui/material";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui";

interface ConfirmOptions {
  message: string;
  /** Tasdiqlash tugmasining matni — berilmasa "Davom etish". */
  confirmLabel?: string;
  /** Qaytarib bo'lmaydigan amallar (o'chirish) uchun qizil tugma. */
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { dict } = useI18n();
  const [pending, setPending] = useState<ConfirmOptions | null>(null);
  // Va'daning `resolve`si — oyna yopilganda chaqiriladi.
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    setPending(typeof options === "string" ? { message: options } : options);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    setPending(null);
    // Oyna yopilib, keyin qayta ochilishi mumkin — har safar yangi va'da.
    resolveRef.current?.(value);
    resolveRef.current = null;
  }, []);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Dialog
        open={pending !== null}
        // Tashqariga bosish/Esc — bekor qilish bilan bir xil. `false`
        // qaytarish SHART, aks holda kutayotgan va'da hech qachon
        // yechilmay, chaqiruvchi funksiya abadiy osilib qolardi.
        onClose={() => settle(false)}
        slotProps={{ paper: { sx: { borderRadius: "1.5rem", margin: 2, width: "100%", maxWidth: 380 } } }}
      >
        <div className="flex flex-col gap-4 bg-surface p-5">
          <p className="text-[0.95rem] leading-relaxed text-text-primary">{pending?.message}</p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => settle(false)}>
              {dict.common.cancel}
            </Button>
            <Button
              className="flex-1"
              variant={pending?.destructive ? "danger" : "primary"}
              onClick={() => settle(true)}
            >
              {pending?.confirmLabel ?? dict.common.continueButton}
            </Button>
          </div>
        </div>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

/** `const confirm = useConfirm();` → `if (!(await confirm("..."))) return;`
 * — `window.confirm` bilan bir xil naqsh, faqat `await` bilan. */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm faqat <ConfirmProvider> ichida ishlaydi");
  return ctx;
}
