"use client";

import { useState } from "react";
import { localDateStr, monthsSinceDate, shouldShowMenopauseSuggestion } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Button, Card } from "@/components/ui";
import { Emoji } from "@/components/Emoji";

/**
 * MENO-02 — klimaks rejimini TAKLIF qilish.
 *
 * Muammo: `perimenopause` rejimi faqat onboarding'da tanlanardi. Lekin bu
 * davrga kirgan ayol allaqachon ro'yxatdan o'tgan bo'ladi — ya'ni rejim
 * bor edi, unga yo'l esa yo'q edi. Shu sababli hayz rejimida qolib,
 * tabiiy ravishda tartibsizlashgan sikl uchun "bashorat noaniq" degan
 * ogohlantirishlarni olib yurardi.
 *
 * MAJBURAN KO'CHIRILMAYDI. "Siz klimaksdasiz" degan avtomatik qaror
 * xato bo'lishi mumkin (tartibsiz sikl qalqonsimon bez, stress yoki
 * boshqa sabab bilan ham bo'ladi) va noto'g'ri bo'lsa haqoratli.
 * Shuning uchun bu taklif, qaror emas — kim, qachon va qaysi rejimda
 * ko'rishini `shouldShowMenopauseSuggestion()` hal qiladi.
 */
const DISMISS_KEY = "mammoai_menopause_suggest_dismissed";

interface Props {
  /** Oxirgi hayz boshlangan sana (`cycle.settings.lastPeriodStart`). */
  lastPeriodStart: string | null;
  /** `cycle.isIrregular` — sikl naqshi barqaror emasligi. */
  cyclesIrregular: boolean;
}

export function MenopauseSuggestCard({ lastPeriodStart, cyclesIrregular }: Props) {
  const { dict } = useI18n();
  const { onboardingProfile, refresh } = useSession();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) !== null;
    } catch {
      // Xotira bloklangan — "hozir emas" tanlovini eslab qololmasak, har
      // ochilishda takrorlagandan ko'ra jim turgan yaxshiroq.
      return true;
    }
  });
  const [saving, setSaving] = useState(false);

  const show = shouldShowMenopauseSuggestion({
    age: onboardingProfile?.age ?? null,
    monthsSinceLastPeriod: monthsSinceDate(lastPeriodStart, localDateStr()),
    cyclesIrregular,
    currentGoal: onboardingProfile?.primaryGoal ?? null,
    dismissed,
  });
  if (!show) return null;

  function close() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Eslab qololmadik — bu safar baribir yopiladi.
    }
  }

  async function switchMode() {
    setSaving(true);
    try {
      await api.onboarding.update({ primaryGoal: "perimenopause", isPregnant: false });
      await refresh();
      close();
    } catch {
      // Saqlanmadi — kartani yopmaymiz, ayol qayta urinib ko'ra oladi.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="animate-fade-in-up flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted">
          <Emoji e="🌷" size={22} />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-text-primary">{dict.cycle.menopauseSuggestTitle}</p>
          <p className="mt-0.5 text-sm text-text-secondary">{dict.cycle.menopauseSuggestBody}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={switchMode} disabled={saving} className="flex-1">
          {dict.cycle.menopauseSuggestSwitch}
        </Button>
        <Button variant="ghost" onClick={close} disabled={saving}>
          {dict.cycle.menopauseSuggestDismiss}
        </Button>
      </div>
      {/* Qaytarib o'zgartirish mumkinligini AYTIB qo'yish shart — aks holda
          tugma "bir yo'lli eshik"dek ko'rinadi va bosilmaydi. */}
      <p className="text-xs text-text-tertiary">{dict.cycle.menopauseSuggestNote}</p>
    </Card>
  );
}
