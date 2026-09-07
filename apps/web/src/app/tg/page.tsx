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

type Phase = "loading" | "notTelegram" | "needsContact" | "waitingContact" | "declined" | "finishing" | "error";

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
  const { webApp, isTelegram, initData, tgUser } = useTelegram();

  const [phase, setPhase] = useState<Phase>("loading");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // `useTelegram()` bir necha yuz ms poll qilib window.Telegram'ni kutadi —
  // shuncha vaqt "loading" holatida turamiz, keyin haqiqatan Telegram
  // ichida emasligini bilib olamiz.
  useEffect(() => {
    if (webApp) return;
    const timeout = setTimeout(() => setPhase((p) => (p === "loading" ? "notTelegram" : p)), 2500);
    return () => clearTimeout(timeout);
  }, [webApp]);

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
      .catch(() => !cancelled && setPhase("error"));
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
  useEffect(() => {
    if (phase !== "waitingContact" || !initData || !tgUser) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.auth.telegramMiniAppStatus(String(tgUser.id));
        if (!res.phoneReady) return;
        if (pollRef.current) clearInterval(pollRef.current);
        setPhase("finishing");
        const finishRes = await api.auth.telegramMiniAppFinish(initData);
        applyMeResponse(finishRes);
        router.replace(finishRes.onboardingProfile ? "/" : "/onboarding?fromTelegram=1");
      } catch {
        // Navbatdagi poll'da qayta urinib ko'ramiz — bitta muvaffaqiyatsiz so'rov jim o'tkaziladi.
      }
    }, STATUS_POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [phase, initData, tgUser, applyMeResponse, router]);

  if (phase === "notTelegram") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
        <p className="text-base font-semibold text-text-primary">{dict.auth.miniAppNotInTelegram}</p>
      </div>
    );
  }

  if (phase === "needsContact" || phase === "waitingContact" || phase === "declined") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <h1 className="text-xl font-bold text-text-primary">{dict.auth.miniAppShareTitle}</h1>
        <p className="text-sm leading-relaxed text-text-secondary">{dict.auth.miniAppShareIntro}</p>
        {phase === "declined" && <p className="text-sm font-medium text-danger">{dict.auth.miniAppDeclined}</p>}
        {phase === "waitingContact" ? (
          <p className="text-sm text-text-secondary">{dict.auth.miniAppWaiting}</p>
        ) : (
          <button
            type="button"
            onClick={shareContact}
            className="tap-target mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#26A5E4] text-base font-bold text-white transition hover:brightness-95"
          >
            <SendOutlined sx={{ fontSize: 20 }} />
            {phase === "declined" ? dict.auth.miniAppRetryButton : dict.auth.miniAppShareButton}
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
