"use client";

import { useState } from "react";
import clsx from "clsx";
import { Dialog, DialogContent } from "@mui/material";
import { Close } from "@mui/icons-material";
import type { ChronicCondition, OnboardingProfile } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";

/**
 * PROFILE-01 — onboarding'dan KEYIN so'raladigan savollar.
 *
 * Loyiha egasining qarori: bu savollarni onboarding'da so'rash mumkin edi,
 * lekin u allaqachon uzun (voronkada `phone_verify` bosqichida 17 kishi
 * qotib qolgan). Shuning uchun ular ishonch hosil bo'lgach, javobning
 * FOYDASI ko'rinib turgan joyda — tekshiruvlar ekranida, ro'yxatning
 * ustida — beriladi.
 *
 * Uchta qoida:
 *  1. Bittadan savol. Ettitasini birdan ko'rsatish yana bir onboarding
 *     bo'lardi va xuddi shunday tashlab ketilardi.
 *  2. Har savolda NEGA so'ralayotgani aytiladi. Ayol nima uchun javob
 *     berayotganini bilmasa, shaxsiy savolga javob bermaydi — va haqli.
 *  3. Har qadamda to'xtatsa bo'ladi. Javoblar darhol saqlanadi, ya'ni
 *     yarmida chiqib ketsa ham bergan javoblari yo'qolmaydi.
 */

/** Savollar tartibi — ro'yxatni ENG KO'P o'zgartiradigani birinchi.
 * Ayol bir-ikkitasiga javob berib to'xtasa ham, eng foydali javoblarni
 * bergan bo'ladi. */
const QUESTION_ORDER = [
  "sexuallyActive",
  "familyHistory",
  "hpvVaccinated",
  "hormonalContraception",
  "hasGivenBirth",
  "smokes",
  "chronicConditions",
] as const;

type QuestionId = (typeof QUESTION_ORDER)[number];

const CHRONIC_OPTIONS: ChronicCondition[] = ["diabetes", "hypertension", "thyroid", "anemia", "none"];

/** Kartani bu qurilmada yashirish (vaqtincha). Tibbiy ma'lumot emas —
 * shunchaki interfeys afzalligi, shuning uchun localStorage yetarli. */
const SNOOZE_KEY = "mammoai:profile-questions-snoozed";

function isSnoozed(): boolean {
  try {
    return window.localStorage.getItem(SNOOZE_KEY) === "1";
  } catch {
    return false;
  }
}

export function ProfileQuestionsCard({
  profile,
  onSaved,
}: {
  profile: OnboardingProfile;
  onSaved: (profile: OnboardingProfile) => void;
}) {
  const { dict } = useI18n();
  const t = dict.profileQuestions;
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [snoozed, setSnoozed] = useState(() => (typeof window === "undefined" ? false : isSnoozed()));

  // Javob berilmagan savollar. `null` = "hali so'ralmagan" — bu "yo'q"
  // bilan bir xil EMAS (GATE-01), shuning uchun aynan `null` tekshiriladi.
  const pending = QUESTION_ORDER.filter((id) => profile[id] === null);
  if (pending.length === 0 || snoozed) return null;

  const current = pending[Math.min(index, pending.length - 1)];

  async function save(patch: Partial<OnboardingProfile>) {
    setSaving(true);
    try {
      // Har javob DARHOL saqlanadi — yarmida chiqib ketsa ham yo'qolmaydi.
      const res = await api.onboarding.update(patch);
      onSaved(res.onboardingProfile);
      if (index + 1 >= pending.length) setOpen(false);
      else setIndex(index + 1);
    } finally {
      setSaving(false);
    }
  }

  function skip() {
    if (index + 1 >= pending.length) setOpen(false);
    else setIndex(index + 1);
  }

  function later() {
    try {
      window.localStorage.setItem(SNOOZE_KEY, "1");
    } catch {
      // Saqlab bo'lmasa ham shu sessiya uchun yopilgani yetarli.
    }
    setSnoozed(true);
  }

  const copy = t.questions[current];

  return (
    <>
      <section className="rounded-3xl bg-primary-light/40 p-5">
        <h3 className="text-base font-bold text-text-primary">{t.cardTitle}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{t.cardBody}</p>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIndex(0);
              setOpen(true);
            }}
            className="tap-target rounded-full bg-primary px-6 text-sm font-bold text-white active:scale-[0.98]"
          >
            {t.cardCta}
          </button>
          <button type="button" onClick={later} className="tap-target px-2 text-sm font-semibold text-text-secondary">
            {t.cardLater}
          </button>
        </div>
      </section>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: "24px", margin: 2 } } }}
      >
        <DialogContent>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted">{t.progress(index + 1, pending.length)}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={dict.common.close}
              className="tap-target flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted text-text-secondary"
            >
              <Close sx={{ fontSize: 16 }} />
            </button>
          </div>

          <p className="mt-3 text-lg font-bold leading-snug text-text-primary">{copy.title}</p>
          {/* Har savolda NEGA so'ralayotgani aytiladi — shaxsiy savolga
              sababsiz javob berishni kutish noto'g'ri bo'lardi. */}
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{copy.hint}</p>

          <div className="mt-5 space-y-2">
            {current === "chronicConditions" ? (
              CHRONIC_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={saving}
                  onClick={() => void save({ chronicConditions: c === "none" ? [] : [c] })}
                  className="tap-target w-full rounded-2xl border border-border bg-surface px-4 py-3 text-left text-base font-semibold text-text-primary active:scale-[0.99] disabled:opacity-50"
                >
                  {t.questions.chronicConditions.options[c]}
                </button>
              ))
            ) : (
              [
                { label: dict.common.yes, value: true },
                { label: dict.common.no, value: false },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  disabled={saving}
                  onClick={() => void save({ [current]: opt.value } as Partial<OnboardingProfile>)}
                  className="tap-target w-full rounded-2xl border border-border bg-surface px-4 py-3 text-left text-base font-semibold text-text-primary active:scale-[0.99] disabled:opacity-50"
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={skip}
            disabled={saving}
            className={clsx("tap-target mt-4 w-full text-sm font-semibold text-text-muted", saving && "opacity-50")}
          >
            {t.skip}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
