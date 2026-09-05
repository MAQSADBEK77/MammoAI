// Foydalanish analitikasi (mobil) — qaysi ekranda qancha vaqt o'tkazilgani
// avtomatik kuzatiladi (web'dagi kabi, `usePathname` orqali — expo-router
// butun ilova bo'ylab yagona yo'l manzilini beradi). Tugma bosishlar uchun esa
// React Native'da DOM'dagi kabi global "document click" delegatsiyasi yo'q,
// shuning uchun faqat pastki tab-panel bosishlari avtomatik kuzatiladi
// (`(tabs)/_layout.tsx`dagi `tabBarButton` orqali) — chuqurroq ekran-ichi
// tugmalar hozircha qamrab olinmagan (kelajakda kerakli joylarga `trackClick`
// qo'shish mumkin).
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { usePathname } from "expo-router";
import type { AnalyticsEventInput, AnalyticsEventType } from "@mammoai/shared";
import { api } from "./api";

const FLUSH_INTERVAL_MS = 15_000;
const MAX_QUEUE_BEFORE_FLUSH = 15;

// Sessiya ID — JS jarayoni tirik turgancha barqaror (ilova qayta ochilsa yangisi).
const sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

let queue: AnalyticsEventInput[] = [];
let flushTimerStarted = false;

function track(type: AnalyticsEventType, path: string, opts?: { label?: string; durationMs?: number }): void {
  if (!path) return;
  queue.push({
    type,
    path,
    label: opts?.label ?? null,
    durationMs: opts?.durationMs ?? null,
    sessionId,
    platform: "mobile",
  });
  if (queue.length >= MAX_QUEUE_BEFORE_FLUSH) flush();
}

function flush(): void {
  if (queue.length === 0) return;
  const events = queue;
  queue = [];
  api.analytics.sendEvents(events).catch(() => {
    // Tarmoq xatosi — analitika hodisalari yo'qoladi, bu ilova uchun kritik emas.
  });
}

function startFlushLoop(): void {
  if (flushTimerStarted) return;
  flushTimerStarted = true;
  setInterval(flush, FLUSH_INTERVAL_MS);
  AppState.addEventListener("change", (state) => {
    if (state !== "active") flush();
  });
}

/** Bosilgan tugma/havolani qo'lda belgilash uchun (masalan pastki tab-panel). */
export function trackClick(path: string, label: string): void {
  track("click", path, { label });
}

/** Joriy ekranda o'tkazilgan vaqtni kuzatadi — ildiz layout'ida bir marta
 * chaqiriladi, expo-router'ning global `usePathname()`si orqali ishlaydi. */
export function useAnalytics(): void {
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  // `Date.now()` render paytida emas, effektda o'rnatiladi (render tana qismi
  // sof/predictable bo'lishi kerak).
  const enteredAtRef = useRef(0);

  useEffect(() => {
    startFlushLoop();
    if (enteredAtRef.current === 0) enteredAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (pathRef.current === pathname) return;
    track("pageview", pathRef.current, { durationMs: Date.now() - enteredAtRef.current });
    pathRef.current = pathname;
    enteredAtRef.current = Date.now();
  }, [pathname]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        track("pageview", pathRef.current, { durationMs: Date.now() - enteredAtRef.current });
      } else {
        enteredAtRef.current = Date.now();
      }
    });
    return () => sub.remove();
  }, []);
}
