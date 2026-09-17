"use client";

// MOTION-01: butun Landing sahifasi bo'ylab qayta ishlatiladigan, `prefers-
// reduced-motion`ni HURMAT QILADIGAN scroll-reveal "qurilich bloklari".
// Har bir pastki bo'lim komponenti (bento, hayot-bosqichi kartalari, ishonch
// va h.k.) shu ikkitasidan foydalanadi — har birida qaytadan yozilmaydi.

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { fadeUpVariants, popVariants, VIEWPORT_ONCE } from "@/lib/motion";

const STAGGER_STEP_S = 0.12; // ~120ms — "to'lqin" effekti (foydalanuvchi so'ragan)

interface RevealProps extends Omit<HTMLMotionProps<"div">, "variants" | "initial" | "whileInView" | "viewport" | "custom" | "animate"> {
  /** Stagger tartib raqami (0, 1, 2, ...) — elementLAR SONIGA bog'liq,
   * matn/piksel uzunligiga EMAS (ru/en tarjimalar uzunroq bo'lishi mumkin —
   * WEB muhandisi eslatmasi). */
  index?: number;
}

/** Ekranga kirganda pastdan-yuqoriga + xiradan-aniqqa. `prefers-reduced-motion`
 * yoqilgan bo'lsa — `initial={false}` + darhol "visible" holat: hech qanday
 * harakat/kechikish yo'q, kontent boshidanoq to'liq ko'rinadi. */
export function Reveal({ index = 0, children, ...props }: RevealProps) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    return (
      <motion.div initial={false} animate={{ opacity: 1, y: 0 }} {...props}>
        {children}
      </motion.div>
    );
  }
  return (
    <motion.div variants={fadeUpVariants} custom={index * STAGGER_STEP_S} initial="hidden" whileInView="visible" viewport={VIEWPORT_ONCE} {...props}>
      {children}
    </motion.div>
  );
}

/** Kichik "pop" (scale 0.8→1, yengil spring) — ikonkalar/belgi-kartalar uchun. */
export function PopIn({ index = 0, children, ...props }: RevealProps) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    return (
      <motion.div initial={false} animate={{ opacity: 1, scale: 1 }} {...props}>
        {children}
      </motion.div>
    );
  }
  return (
    <motion.div variants={popVariants} custom={index * STAGGER_STEP_S} initial="hidden" whileInView="visible" viewport={VIEWPORT_ONCE} {...props}>
      {children}
    </motion.div>
  );
}
