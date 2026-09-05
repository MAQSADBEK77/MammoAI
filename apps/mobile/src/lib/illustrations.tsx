// Admin panelda (web) tanlangan illyustratsiyalar xaritasini bir marta yuklab,
// butun ilova bo'ylab ishlatish uchun. RN'da SVG'lar Metro orqali statik import
// qilinishi shart bo'lgani uchun barcha variant HAM oldindan bundle qilingan
// (illustration-components.ts, avtomatik generatsiya qilingan) — bu yerda faqat
// qaysi slug JORIY ekanini serverdan bilib olamiz.

import { createContext, useContext, useEffect, useState, type FunctionComponent, type ReactNode } from "react";
import type { SvgProps } from "react-native-svg";
import { DEFAULT_SLOT_ASSIGNMENTS, type IllustrationSlotKey } from "@mammoai/shared";
import { api } from "./api";
import { ILLUSTRATION_COMPONENTS } from "./illustration-components";

interface IllustrationsContextValue {
  resolve: (slot: IllustrationSlotKey) => FunctionComponent<SvgProps>;
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
    resolve: (slot) => {
      const slug = slots[slot] ?? DEFAULT_SLOT_ASSIGNMENTS[slot];
      return ILLUSTRATION_COMPONENTS[slug] ?? ILLUSTRATION_COMPONENTS["classic-welcome"];
    },
  };

  return <IllustrationsContext.Provider value={value}>{children}</IllustrationsContext.Provider>;
}

export function useIllustrations(): IllustrationsContextValue {
  const ctx = useContext(IllustrationsContext);
  if (!ctx) throw new Error("useIllustrations — IllustrationsProvider ichida chaqirilishi kerak");
  return ctx;
}
