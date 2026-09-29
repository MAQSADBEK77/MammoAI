"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  extractPhoneDigits,
  formatPhoneInput,
  type PhoneCountry,
} from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTelegram } from "@/lib/telegram";
import { api } from "@/lib/api";
import { Button } from "@/components/ui";

/**
 * AUTH-03 — "hisobimni ulash" sahifasi.
 *
 * Nega alohida sahifa: endi ilovaga TELEFONSIZ kiriladi (Telegram shaxsi
 * o'zi tasdiqlangan). Lekin ikki toifa ayolga telefon baribir kerak:
 *
 *   1. ilgari telefon bilan ro'yxatdan o'tgan va endi Mini App unga yangi,
 *      bo'sh hisob ochib bergan — eski tarixini qaytarishi kerak;
 *   2. hisobini boshqa qurilmada ham ochmoqchi bo'lganlar.
 *
 * Qaysi hisob saqlanishi serverda hal qilinadi (`resolvePhoneLink`), bu
 * yerda faqat raqam va kod so'raladi.
 *
 * PHONE-02: mamlakat tanlanadi — O'zbekiston va Qirg'iziston.
 */
export default function LinkAccountPage() {
  const { dict, language } = useI18n();
  const router = useRouter();
  const t = dict.auth;

  const { webApp, isTelegram, initData, status: telegramStatus } = useTelegram();
  const { applyMeResponse } = useSession();
  /**
   * AUTH-05: Telegram ichida raqamni QO'LDA yozish va kod kutish ortiqcha —
   * Telegram buni bir bosishda beradi (`requestContact`). Foydalanuvchi
   * ko'rsatdi: kod kelmadi va u shu ekranda qolib ketdi.
   *
   * Shuning uchun Mini App ichida ASOSIY yo'l — Telegram tugmasi;
   * telefon+kod esa pastda, zaxira sifatida qoladi (veb uchun).
   */
  const [tgBusy, setTgBusy] = useState(false);
  const [tgError, setTgError] = useState<string | null>(null);

  /**
   * AUTH-06: Telegram ichida telefon+kod yo'li KO'RINMAYDI.
   *
   * Foydalanuvchi: "bitta yoki uzog'i ikkita click bilan qiladigan
   * qilish kerak... alohida telegram botga qaytadigan emas".
   *
   * Telegram raqamni o'zi, bitta oynada beradi (`requestContact`) —
   * botga qaytish ham, kod terish ham shart emas. Telefon+kod esa
   * VEB uchun kerak, shuning uchun u yo'qotilmadi: kichik havola
   * ortida turadi.
   */
  const [showPhoneForm, setShowPhoneForm] = useState(false);

  const [country, setCountry] = useState<PhoneCountry>(DEFAULT_PHONE_COUNTRY);
  const [phone, setPhone] = useState(DEFAULT_PHONE_COUNTRY.dial);
  const [token, setToken] = useState<string | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const e164 = extractPhoneDigits(phone, country);

  function pickCountry(next: PhoneCountry) {
    setCountry(next);
    // Raqamning milliy qismi saqlanadi, faqat prefiks almashadi.
    setPhone(formatPhoneInput(phone.replace(country.dial, ""), next));
  }

  function linkWithTelegram() {
    if (!webApp || !initData) return;
    setTgError(null);
    setTgBusy(true);
    webApp.requestContact((shared) => {
      if (!shared) {
        setTgBusy(false);
        return;
      }
      // Raqam webhook orqali keladi — tayyor bo'lgunga qadar so'rab
      // turamiz (Telegram javobi darhol emas).
      let tries = 0;
      const timer = setInterval(async () => {
        tries += 1;
        try {
          const status = await api.auth.telegramMiniAppStatus(initData);
          if (!status.phoneReady) {
            if (tries > 30) {
              clearInterval(timer);
              setTgBusy(false);
              setTgError(t.linkTelegramFailed);
            }
            return;
          }
          clearInterval(timer);
          const res = await api.auth.telegramMiniAppFinish(initData);
          applyMeResponse(res);
          router.replace("/asosiy");
        } catch {
          if (tries > 30) {
            clearInterval(timer);
            setTgBusy(false);
            setTgError(t.linkTelegramFailed);
          }
        }
      }, 2000);
    });
  }

  /**
   * AUTH-06: Mini App ichida oyna O'ZI ochiladi.
   *
   * Foydalanuvchi "Hisobimni ulash"ni bosib shu sahifaga keldi — niyati
   * allaqachon aniq. Yana bitta tugma qo'yish ortiqcha bosish bo'lardi,
   * u esa "bitta bosishda bo'lsin" degandi. Tugma baribir qoladi:
   * oynani yopib qo'ysa yoki xato chiqsa, qayta urinish uchun.
   */
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (!isTelegram || !webApp || !initData || autoStartedRef.current) return;
    autoStartedRef.current = true;
    const timer = setTimeout(() => linkWithTelegram(), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- faqat bir marta, Telegram tayyor bo'lganda
  }, [isTelegram, webApp, initData]);

  async function start() {
    if (!e164) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.auth.phoneCodeStart({ identifier: e164, language });
      setToken(res.token);
      setDeepLink(res.deepLink);
    } catch {
      setError(dict.common.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!token || code.trim().length < 4) return;
    setBusy(true);
    setError(null);
    try {
      await api.auth.phoneCodeVerify({ token, code: code.trim() });
      router.replace("/asosiy");
    } catch {
      setError(t.codeWrong);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-10"
      style={{ paddingTop: "calc(var(--tg-safe-area-top) + 2rem)" }}
    >
      <h1 className="text-2xl font-extrabold text-text-primary">{t.linkTitle}</h1>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{t.linkSubtitle}</p>

      {/* Telegram aniqlanmaguncha telefon formasini KO'RSATMAYMIZ:
          aks holda Mini App'da ayol avval "raqamingizni yozing" ni
          ko'rib, keyin tugma paydo bo'lardi — aynan shu chalkashlikni
          foydalanuvchi ko'rsatdi. */}
      {telegramStatus === "checking" && <p className="mt-8 text-center text-sm text-text-muted">{dict.common.loading}</p>}

      {isTelegram && (
        <div className="mt-7 space-y-3">
          <Button onClick={linkWithTelegram} disabled={tgBusy}>
            {tgBusy ? dict.common.loading : t.linkTelegram}
          </Button>
          <p className="text-center text-xs leading-relaxed text-text-muted">{t.linkTelegramHint}</p>
          {tgError && <p className="text-center text-sm font-medium text-danger">{tgError}</p>}
          {!showPhoneForm && (
            <button
              type="button"
              onClick={() => setShowPhoneForm(true)}
              className="w-full pt-2 text-center text-xs font-semibold text-text-muted underline underline-offset-4"
            >
              {t.linkByPhone}
            </button>
          )}
        </div>
      )}

      {(!isTelegram && telegramStatus !== "checking") || showPhoneForm ? (
        !token ? (
        <div className="mt-4 space-y-4">
          <div className="flex gap-2">
            {PHONE_COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => pickCountry(c)}
                className={clsx(
                  "flex-1 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                  c.code === country.code
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface text-text-secondary"
                )}
              >
                <span className="mr-1.5">{c.flag}</span>
                {c.dial}
              </button>
            ))}
          </div>

          <input
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value, country))}
            className="tap-target w-full rounded-2xl border border-border bg-surface px-4 text-base text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <Button onClick={start} disabled={!e164 || busy}>
            {t.sendCode}
          </Button>
        </div>
      ) : (
        <div className="mt-7 space-y-4">
          {/* Kod SMS orqali emas, Telegram boti orqali keladi — shuning
              uchun avval botni ochish kerak. */}
          {deepLink && (
            <a
              href={deepLink}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl bg-surface p-4 text-center text-sm font-bold text-primary shadow-sm"
            >
              {t.openBot}
            </a>
          )}
          <input
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder={t.codePlaceholder}
            className="tap-target w-full rounded-2xl border border-border bg-surface px-4 text-center text-xl font-bold tracking-[0.4em] text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <Button onClick={verify} disabled={busy || code.trim().length < 4}>
            {t.confirm}
          </Button>
        </div>
        )
      ) : null}

      {error && <p className="mt-4 text-sm font-medium text-danger">{error}</p>}

      <button
        type="button"
        onClick={() => router.back()}
        className="mt-auto pt-8 text-center text-sm font-semibold text-text-muted"
      >
        {dict.common.cancel}
      </button>
    </div>
  );
}
