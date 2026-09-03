"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** Eski /tsikl, /homiladorlik, /klinikalar sahifalari endi "Asosiy"ga
 * birlashtirildi — saqlangan havolalar/tarix buzilmasligi uchun so'rov
 * parametrlarini (masalan checklistItemId) saqlab qolgan holda yo'naltiradi. */
export function RedirectToAsosiy() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const qs = params.toString();
    router.replace(qs ? `/asosiy?${qs}` : "/asosiy");
  }, [router, params]);

  return null;
}
