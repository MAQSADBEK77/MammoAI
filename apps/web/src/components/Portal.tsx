"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * FIX-OVERLAY-01 — to'liq ekranli oynalarni `document.body`ga chiqaradi.
 *
 * NEGA KERAK: `(app)/layout.tsx`dagi `PageTransition` — `opacity`/`transform`
 * animatsiyali `motion.div`, ya'ni O'Z stacking context'ini yaratadi. Uning
 * ICHIDAGI `z-50` faqat shu kontekst ichida ishlaydi va tashqaridagi
 * `BottomNav` (`z-20`) baribir USTDA qolib ketadi — real qurilmada aynan shu
 * kuzatildi: kalendar va yozuv varag'i ustiga pastki menyu chiqib turardi
 * va "Saqlash" tugmasini bosib bo'lmasdi.
 *
 * Portal orqali oyna DOM daraxtida `body`ning bevosita bolasi bo'ladi —
 * shuning uchun uning `z-50`i endi BottomNav bilan bir xil miqyosda
 * taqqoslanadi va ustida turadi. React kontekstlari (i18n, sessiya)
 * o'zgarishsiz ishlayveradi: portal DOM joyini o'zgartiradi, React
 * daraxtidagi o'rnini emas.
 */
export function Portal({
  children,
  lockScroll = true,
}: {
  children: React.ReactNode;
  /** `false` — sahifa skrolli qotirilmaydi. To'liq ekranli oynalar uchun
   * `true` (standart), lekin pastdan "mo'ralab" turgan kichik panel uchun
   * (TodayAssistantCard) SHART emas: u sahifani to'sib qo'ymaydi va uni
   * qotirish butun ekranni harakatsiz qilib qo'yardi. */
  lockScroll?: boolean;
}) {
  // Server render'da `document` yo'q — mount bo'lgandan keyin chiqaramiz.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  // FIX-SCROLL-01: oyna ochiq turganda sahifaning O'ZI ham skroll qilinardi —
  // real qurilmada bu "ikkita skroll" bo'lib sezilardi (barmoq oynani emas,
  // ortidagi sahifani surib yuborardi). Oyna ochiq ekan, `body` qotiriladi.
  useEffect(() => {
    if (!mounted || !lockScroll) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mounted, lockScroll]);

  if (!mounted) return null;
  return createPortal(children, document.body);
}
