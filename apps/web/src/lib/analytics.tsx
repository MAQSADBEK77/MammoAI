"use client";

// Foydalanish analitikasi — qaysi sahifada qancha vaqt o'tkazilgani va qaysi
// tugma bosilgani (admin panelda "chuqur tahlil" uchun). Faqat asosiy ilova
// (onboarding + (app) guruhi) kuzatiladi — /admin/* sahifalar EMAS, chunki bu
// mijoz (foydalanuvchi) xatti-harakatini o'rganish uchun, panel egasi emas.
//
// Naqsh: hodisalar xotirada to'planadi (queue), so'ng davriy (15s) yoki
// sahifa yopilganda (pagehide/visibilitychange, `sendBeacon` orqali) bitta
// to'plam sifatida yuboriladi — har bir bosish uchun alohida so'rov emas.
// Xatolik yoki tarmoq muammosi ilovaning asosiy ishlashiga umuman ta'sir
// qilmasligi kerak, shuning uchun barcha xatolar jimgina yutiladi.

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { AnalyticsEventInput, AnalyticsEventType } from "@mammoai/shared";
import { api } from "./api";

const SESSION_KEY = "mammoai_analytics_session";
const FLUSH_INTERVAL_MS = 15_000;
const MAX_QUEUE_BEFORE_FLUSH = 15;

let queue: AnalyticsEventInput[] = [];
let flushTimerStarted = false;

function isTrackedPath(path: string): boolean {
  return typeof path === "string" && path.length > 0 && !path.startsWith("/admin");
}

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Xususiy rejim/saqlash bloklangan bo'lsa — vaqtinchalik ID bilan davom etamiz.
    return "no-storage";
  }
}

function track(type: AnalyticsEventType, path: string, opts?: { label?: string; durationMs?: number }): void {
  if (typeof window === "undefined" || !isTrackedPath(path)) return;
  queue.push({
    type,
    path,
    label: opts?.label ?? null,
    durationMs: opts?.durationMs ?? null,
    sessionId: getSessionId(),
    platform: "web",
  });
  if (queue.length >= MAX_QUEUE_BEFORE_FLUSH) flush();
}

function flush(useBeacon = false): void {
  if (queue.length === 0) return;
  const events = queue;
  queue = [];
  if (useBeacon && "sendBeacon" in navigator) {
    try {
      const blob = new Blob([JSON.stringify({ events })], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/events", blob);
      return;
    } catch {
      // sendBeacon muvaffaqiyatsiz bo'lsa — pastdagi oddiy fetch'ga tushamiz.
    }
  }
  api.analytics.sendEvents(events).catch(() => {
    // Tarmoq xatosi — analitika hodisalari yo'qoladi, lekin bu ilova uchun kritik emas.
  });
}

function startFlushLoop(): void {
  if (flushTimerStarted) return;
  flushTimerStarted = true;
  setInterval(() => flush(false), FLUSH_INTERVAL_MS);
  const handleHide = () => flush(true);
  window.addEventListener("pagehide", handleHide);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
}

/** Joriy sahifada o'tkazilgan vaqtni kuzatadi — yo'l o'zgarganda (client-side
 * navigatsiya) oldingi sahifa uchun `pageview` hodisasi yuboriladi. */
function usePageViewTracking(): void {
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  // `Date.now()` render paytida emas, effektda o'rnatiladi (React Compiler
  // qoidasi — render tana qismi sof/predictable bo'lishi kerak).
  const enteredAtRef = useRef(0);
  useEffect(() => {
    if (enteredAtRef.current === 0) enteredAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (pathRef.current === pathname) return;
    track("pageview", pathRef.current, { durationMs: Date.now() - enteredAtRef.current });
    pathRef.current = pathname;
    enteredAtRef.current = Date.now();
  }, [pathname]);

  useEffect(() => {
    function handleHide() {
      track("pageview", pathRef.current, { durationMs: Date.now() - enteredAtRef.current });
    }
    window.addEventListener("pagehide", handleHide);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") handleHide();
    });
    return () => window.removeEventListener("pagehide", handleHide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Har qanday tugma/havola bosilishini avtomatik ushlaydi (delegatsiya) —
 * ilovadagi yuzlab tugmani birma-bir belgilash shart emas. */
function useClickTracking(): void {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement | null)?.closest("button, a, [role='button']") as HTMLElement | null;
      if (!target) return;
      const label = target.getAttribute("aria-label")?.trim() || target.textContent?.replace(/\s+/g, " ").trim().slice(0, 60) || target.tagName;
      if (!label) return;
      track("click", window.location.pathname, { label });
    }
    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  usePageViewTracking();
  useClickTracking();
  useEffect(() => {
    startFlushLoop();
  }, []);
  return <>{children}</>;
}
