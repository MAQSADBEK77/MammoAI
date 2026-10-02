"use client";

import { useEffect, useRef } from "react";
import { shouldReloadForNewBuild } from "@mammoai/shared";

/**
 * DEPLOY-02 — eski nusxa qolib ketishining oldini oladi.
 *
 * Foydalanuvchi uch marta "o'zgarish ko'rinmayapti" dedi va har safar
 * sabab bir xil bo'lib chiqdi: kod `main`da, Vercel deploy qilgan,
 * `/api/version` yangi commit'ni qaytaradi — lekin Telegram Mini App
 * webview'i ESKI hujjat va eski JS bo'laklarini ushlab turadi.
 *
 * Endi ilova o'zining build commit'ini jonli server bilan solishtiradi
 * va farq bo'lsa bir marta qayta yuklanadi. Tekshiruv:
 *   • ilova ochilganda;
 *   • ilova yana ko'rinadigan bo'lganda (Telegram'da oyna fonga
 *     o'tib qaytganda — aynan shu paytda eski nusxa qoladi).
 *
 * Qayta yuklash qarori `shouldReloadForNewBuild`da (packages/shared),
 * testlar bilan: noto'g'ri yozilsa u CHEKSIZ halqaga aylanadi.
 */
const RELOADED_KEY = "mammoai_reloaded_for_build";
/** Ikki tekshiruv orasidagi eng kam vaqt. */
const CHECK_INTERVAL_MS = 60_000;

export function VersionGuard() {
  const lastCheckRef = useRef(0);

  useEffect(() => {
    const builtCommit = process.env.NEXT_PUBLIC_COMMIT_SHA?.slice(0, 7) ?? null;
    // Lokal ishlab chiqishda commit yo'q — tekshiruv umuman ishlamaydi.
    if (!builtCommit || builtCommit === "local") return;

    let cancelled = false;

    const check = async () => {
      const now = Date.now();
      if (now - lastCheckRef.current < CHECK_INTERVAL_MS) return;
      lastCheckRef.current = now;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const live = (await res.json()) as { commit?: string };
        let alreadyReloadedFor: string | null = null;
        try {
          alreadyReloadedFor = sessionStorage.getItem(RELOADED_KEY);
        } catch {
          // Xotira bloklangan — bu holatda qayta yuklamaymiz, chunki
          // "bir marta" kafolatini bera olmaymiz.
          return;
        }
        if (!shouldReloadForNewBuild({ builtCommit, liveCommit: live.commit, alreadyReloadedFor })) return;
        try {
          sessionStorage.setItem(RELOADED_KEY, live.commit ?? "");
        } catch {
          return;
        }
        window.location.reload();
      } catch {
        // Tarmoq yiqildi — keyingi safar tekshiramiz.
      }
    };

    void check();
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
