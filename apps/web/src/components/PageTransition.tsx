"use client";

// MOTION-APP-01: pastki tab-menyu (BottomNav) orqali sahifalar orasida
// o'tish ilgari darhol, "sakrab" almashardi. Endi yengil fade+ko'tarilish
// bilan — LandingPage'da sinovdan o'tgan xuddi shu harakat tizimidan
// (lib/motion.ts — EASE_BRAND/DURATION) foydalanib, `(app)/layout.tsx`da
// BARCHA tab uchun BIR MARTA ulanadi (har bir ekranga alohida qo'shilmaydi).

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { DURATION, EASE_BRAND } from "@/lib/motion";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  // Reduced-motion: hech qanday animatsiya, kontent DARHOL to'liq ko'rinadi.
  if (reduceMotion) return <>{children}</>;

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: DURATION.section, ease: EASE_BRAND }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
