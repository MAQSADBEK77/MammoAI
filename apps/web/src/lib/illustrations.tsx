"use client";

// Admin panelda tanlangan illyustratsiyalar xaritasini bir marta yuklab, butun
// ilova bo'ylab (onboarding, bosh sahifa, alohida ekranlar) ishlatish uchun.
// Yuklanmaguncha (yoki tarmoq xatosida) DEFAULT_SLOT_ASSIGNMENTS ishlatiladi —
// shu tufayli hech qachon "bo'sh joy" ko'rinmaydi.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_SLOT_ASSIGNMENTS, illustrationWebPath, type IllustrationSlotKey } from "@mammoai/shared";
import { api } from "./api";

interface IllustrationsContextValue {
  /** Berilgan "joy" uchun to'g'ridan-to'g'ri <img src> sifatida ishlatsa bo'ladigan yo'l. */
  resolve: (slot: IllustrationSlotKey) => string;
}

const IllustrationsContext = createContext<IllustrationsContextValue | null>(null);

export function IllustrationsProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<Record<IllustrationSlotKey, string>>(DEFAULT_SLOT_ASSIGNMENTS);

  useEffect(() => {
    api.illustrations
      .get()
      .then((res) => setSlots(res.slots))
      .catch(() => {
        // Tarmoq xatosida standart (kod ichidagi) tanlov bilan davom etiladi.
      });
  }, []);

  const value: IllustrationsContextValue = {
    resolve: (slot) => illustrationWebPath(slots[slot] ?? DEFAULT_SLOT_ASSIGNMENTS[slot]),
  };

  return <IllustrationsContext.Provider value={value}>{children}</IllustrationsContext.Provider>;
}

export function useIllustrations(): IllustrationsContextValue {
  const ctx = useContext(IllustrationsContext);
  if (!ctx) throw new Error("useIllustrations — IllustrationsProvider ichida chaqirilishi kerak");
  return ctx;
}
