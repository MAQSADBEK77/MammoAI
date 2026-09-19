"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SendOutlined } from "@mui/icons-material";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTelegram } from "@/lib/telegram";
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
export default function TelegramMiniAppPage() {
  const { dict } = useI18n();
  const router = useRouter();
  const { applyMeResponse, refresh } = useSession();
  const { webApp, initData, tgUser, status: telegramStatus } = useTelegram();

  const [phase, setPhase] = useState<Phase>("loading");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // WEB2-02: ilgari bu yerda useTelegram()'dan MUSTAQIL o'z 2500ms taymeri
  // bo'lardi — u lib/telegram.ts'ning ICHKI 2000ms poll'idan atigi 500ms
  // farq qilardi, shuning uchun sekin tarmoqda haqiqiy Telegram
  // foydalanuvchisi ham "bu Telegram emas" xatosini ko'rishi mumkin edi.
  // Endi bitta manba — useTelegram()'ning o'zi qaytaradigan `status`
  // ("checking" / "found" / "not-found", 5.5s'gacha kutadi) — ikkinchi,
  // mos kelmaydigan taймаут yo'q.
  useEffect(() => {
    if (telegramStatus !== "not-found") return;
    // FIX-07 bilan bir xil naqsh — setState effekt ICHIDA sinxron
    // chaqirilmaydi (kaskadli render'larni oldini olish uchun).
    const timeout = setTimeout(() => setPhase((p) => (p === "loading" ? "notTelegram" : p)), 0);
    return () => clearTimeout(timeout);
  }, [telegramStatus]);

  useEffect(() => {
    if (!initData) return;
    let cancelled = false;
    api.auth
      .telegramMiniAppStart(initData)
      .then(async (res) => {
        if (cancelled) return;
        if (res.loggedIn) {
          await refresh();
          router.replace(res.onboarded ? "/" : "/onboarding?fromTelegram=1");
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
        router.replace(finishRes.onboardingProfile ? "/" : "/onboarding?fromTelegram=1");
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
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
        <p className="text-base font-semibold text-text-primary">{dict.auth.miniAppNotInTelegram}</p>
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
