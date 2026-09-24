"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SendOutlined } from "@mui/icons-material";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTelegram } from "@/lib/telegram";
import { useTelegramStartLink } from "@/lib/telegram-link";
import { api } from "@/lib/api";
import { LoadingSpinner, Button } from "@/components/ui";

const STATUS_POLL_MS = 2000;
// WEB2-03: avvalgi kodda BU YERDA hech qanday chegara yo'q edi — agar
// webhook signal umuman kelmasa (Telegram klient xatosi, eski versiya va
// h.k.), sahifa ABADIY "Kutilmoqda..." holatida qolib ketardi. 90 soniya —
// odatiy holatda popup tasdig'i bir necha soniyada keladi, shuning uchun
// bu real foydalanuvchini shoshiltirmasdan, aniq buzilgan holatni ushlab
// qolish uchun yetarlicha keng zaxira.
const WAITING_CONTACT_TIMEOUT_MS = 90_000;

type Phase = "loading" | "notTelegram" | "needsContact" | "waitingContact" | "declined" | "timeout" | "finishing" | "error";

/**
 * Telegram Mini App kirish nuqtasi — BotFather'da shu URL ("https://mammo.uz/tg")
 * Mini App manzili sifatida ro'yxatdan o'tkaziladi. Butun boshqa ilova (barcha
 * ekranlar) o'zgarishsiz qoladi — bu sahifa faqat autentifikatsiya "qo'lqopi":
 * muvaffaqiyatli tugagach oddiy httpOnly sessiya cookie'si o'rnatiladi va
 * foydalanuvchi asosiy ilovaga (yoki onboarding'ga) yo'naltiriladi.
 */
function TelegramMiniAppInner() {
  const { dict } = useI18n();
  const router = useRouter();
  const { applyMeResponse, refresh } = useSession();
  const { webApp, initData, tgUser, status: telegramStatus } = useTelegram();

  // DEEPLINK-01: bot xabaridagi tugma ilovani ANIQ bir ekranda ochishi uchun
  // (`?next=/asosiy?log=1`). Onboardingni tugatgan foydalanuvchi shu manzilga
  // tushadi, tugatmagani esa baribir onboardingga — yarim sozlangan hisob
  // bilan ichki ekranga kirib qolmasligi kerak.
  //
  // XAVFSIZLIK: faqat SHU saytdagi nisbiy yo'l qabul qilinadi. Tekshiruvsiz
  // bo'lsa `?next=https://zararli.example` ochiq-yo'naltirish zaifligini
  // berardi; `//` ham rad etiladi — u protokolga nisbiy manzil.
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");
  const nextPath = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  const telegramHref = useTelegramStartLink();
  const [phase, setPhase] = useState<Phase>("loading");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // WEB2-02: ilgari bu yerda useTelegram()'dan MUSTAQIL o'z 2500ms taymeri
  // bo'lardi — u lib/telegram.ts'ning ICHKI 2000ms poll'idan atigi 500ms
  // farq qilardi, shuning uchun sekin tarmoqda haqiqiy Telegram
  // foydalanuvchisi ham "bu Telegram emas" xatosini ko'rishi mumkin edi.
  // Endi bitta manba — useTelegram()'ning o'zi qaytaradigan `status`
  // ("checking" / "found" / "not-found", 5.5s'gacha kutadi) — ikkinchi,
  // mos kelmaydigan taймаут yo'q.
  // TG-DETECT-01: shart "not-found" bilan CHEKLANMAYDI. Aniqlash tugagan,
  // lekin imzolangan `initData` yo'q bo'lsa ham to'xtaymiz — quyidagi
  // autentifikatsiya effekti `initData`siz umuman ishga tushmaydi, ya'ni
  // bunday holatda ekran MANGU aylanaverardi (aynan shu xato skrinshot
  // bilan xabar qilindi: brauzerda ochilgan `/tg` cheksiz spinner).
  useEffect(() => {
    if (telegramStatus === "checking") return;
    if (telegramStatus === "found" && initData) return;
    // FIX-07 bilan bir xil naqsh — setState effekt ICHIDA sinxron
    // chaqirilmaydi (kaskadli render'larni oldini olish uchun).
    const timeout = setTimeout(() => setPhase((p) => (p === "loading" ? "notTelegram" : p)), 0);
    return () => clearTimeout(timeout);
  }, [telegramStatus, initData]);

  useEffect(() => {
    if (!initData) return;
    let cancelled = false;
    api.auth
      .telegramMiniAppStart(initData)
      .then(async (res) => {
        if (cancelled) return;
        if (res.loggedIn) {
          await refresh();
          router.replace(res.onboarded ? nextPath : "/onboarding?fromTelegram=1");
          return;
        }
        setPhase("needsContact");
      })
      .catch((err) => {
        // OVERNIGHT-19: ilgari xato JIM yutib yuborilardi — sabab (masalan
        // server tomonidagi vaqtinchalik DB migratsiya to'qnashuvi, aynan
        // shu safar production'da topilgan) hech qayerda ko'rinmasdi.
        console.error("Telegram Mini App kirish xatosi:", err);
        if (!cancelled) setPhase("error");
      });
    return () => {
      cancelled = true;
    };
  }, [initData, refresh, router]);

  function shareContact() {
    if (!webApp) return;
    setPhase("waitingContact");
    webApp.requestContact((shared) => {
      if (!shared) setPhase("declined");
    });
  }

  // "waitingContact" holatida — webhook orqali raqam kelishini poll qilamiz.
  // WEB2-03: cheksiz kutish o'rniga WAITING_CONTACT_TIMEOUT_MS'dan keyin
  // "timeout" holatiga o'tadi (declined'ga o'xshash — qayta urinish tugmasi).
  useEffect(() => {
    if (phase !== "waitingContact" || !initData || !tgUser) return;
    let settled = false;
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.auth.telegramMiniAppStatus(initData);
        // WEB3-02: `await`dan OLDIN emas, KEYIN tekshiriladi — so'rov
        // jo'natilgandan keyin, LEKIN javob kelgunga qadar taймаут (yoki
        // boshqa poll-tsikl) allaqachon "settled"ni true qilgan bo'lishi
        // mumkin (masalan foydalanuvchi "Qayta urinish"ni bosib, YANGI
        // poll-tsikl boshlagan). Bunday holatda kechikkan javob joriy
        // holatni/intervalni O'ZGARTIRMASLIGI kerak.
        if (settled) return;
        if (!res.phoneReady) return;
        settled = true;
        if (pollRef.current) clearInterval(pollRef.current);
        setPhase("finishing");
        const finishRes = await api.auth.telegramMiniAppFinish(initData);
        applyMeResponse(finishRes);
        router.replace(finishRes.onboardingProfile ? nextPath : "/onboarding?fromTelegram=1");
      } catch {
        // Navbatdagi poll'da qayta urinib ko'ramiz — bitta muvaffaqiyatsiz so'rov jim o'tkaziladi.
      }
    }, STATUS_POLL_MS);
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      setPhase("timeout");
    }, WAITING_CONTACT_TIMEOUT_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      clearTimeout(timeout);
    };
  }, [phase, initData, tgUser, applyMeResponse, router]);

  if (phase === "notTelegram") {
    return (
      // TG-DETECT-01: ilgari bu yerda faqat bitta jumla turardi — "bu sahifa
      // Telegram ichida ochilishi kerak" — va BOSHQA hech narsa. Ayol nima
      // qilishini bilmasdi. Endi shu yerning o'zidan botga o'tish mumkin.
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-base font-semibold text-text-primary">{dict.auth.miniAppNotInTelegram}</p>
        <a
          href={telegramHref}
          className="tap-target flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-br from-primary to-primary-dark px-6 py-4 text-base font-bold text-white shadow-[0_8px_20px_color-mix(in_srgb,var(--color-primary)_26%,transparent)] transition active:scale-[0.98]"
        >
          <SendOutlined sx={{ fontSize: 20 }} />
          {dict.auth.openTelegramButton}
        </a>
      </div>
    );
  }

  if (phase === "needsContact" || phase === "waitingContact" || phase === "declined" || phase === "timeout") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <h1 className="text-xl font-bold text-text-primary">{dict.auth.miniAppShareTitle}</h1>
        <p className="text-sm leading-relaxed text-text-secondary">{dict.auth.miniAppShareIntro}</p>
        {phase === "declined" && <p className="text-sm font-medium text-danger">{dict.auth.miniAppDeclined}</p>}
        {phase === "timeout" && <p className="text-sm font-medium text-danger">{dict.auth.miniAppTimeout}</p>}
        {phase === "waitingContact" ? (
          <p className="text-sm text-text-secondary">{dict.auth.miniAppWaiting}</p>
        ) : (
          <button
            type="button"
            onClick={shareContact}
            className="tap-target mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#26A5E4] text-base font-bold text-white transition hover:brightness-95"
          >
            <SendOutlined sx={{ fontSize: 20 }} />
            {phase === "declined" || phase === "timeout" ? dict.auth.miniAppRetryButton : dict.auth.miniAppShareButton}
          </button>
        )}
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <p className="text-sm font-medium text-danger">{dict.auth.miniAppError}</p>
        <Button onClick={() => window.location.reload()}>{dict.auth.miniAppRetryButton}</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <LoadingSpinner label={dict.auth.miniAppLoading} />
    </div>
  );
}

/**
 * DEEPLINK-01: `useSearchParams()` Next.js'da Suspense chegarasini talab
 * qiladi (statik prerender paytida) — `/klinikalar` sahifasidagi bilan
 * bir xil naqsh.
 */
export default function TelegramMiniAppPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <TelegramMiniAppInner />
    </Suspense>
  );
}
