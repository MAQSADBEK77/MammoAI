"use client";

import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import { Close, CheckOutlined } from "@mui/icons-material";
import type { CheckinCategory, CheckinResponse, Mood } from "@mammoai/shared";
import { MOOD_EMOJI, pendingCheckinQuestions } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { Portal } from "@/components/Portal";
import { api } from "@/lib/api";
import { Emoji } from "@/components/Emoji";
import { LoadingSpinner } from "@/components/ui";
import { CheckinArt } from "./CheckinArt";

/**
 * TODAY-02 — "Check-in" bosilganda ochiladigan to'liq ekranli karta to'plami
 * (referens dizayn): ustma-ust turgan kartalar, har birida bitta savol,
 * pastda "Yo'q"/"Ha". Javob berilgan karta ketadi, orqasidagisi oldinga
 * suriladi.
 *
 * Birinchi karta — KAYFIYAT (mavjud kunlik kayfiyat so'rovi shu yerga
 * ko'chirildi, alohida ikkita check-in bo'lib qolmasligi uchun). Qolganlari
 * `packages/shared/src/logic/checkin.ts`dagi "Ha/Yo'q" savollari.
 */

/** Kategoriya ranglari — bu BREND tokeni emas, illyustratsiya palitrasi
 * (referensdagi kabi har bir kategoriya o'z rangida). */
const CATEGORY_STYLE: Record<CheckinCategory | "mood", { card: string; tint: string }> = {
  wellbeing: { card: "from-[#2E9AD0] to-[#1B7FB4]", tint: "to-[#CFE8F6]" },
  reflection: { card: "from-[#12958F] to-[#0C7C79]", tint: "to-[#C9E9E7]" },
  body: { card: "from-[#E0578F] to-[#C93F78]", tint: "to-[#FADCE8]" },
  mood: { card: "from-[#7C5AD6] to-[#5C3FB0]", tint: "to-[#E0D7F8]" },
};

const MOODS: Mood[] = ["happy", "calm", "tired", "sad", "irritable", "anxious"];

interface CheckinDeckProps {
  onClose: () => void;
  /** Bugun kayfiyat allaqachon belgilangan bo'lsa — kayfiyat kartasi
   * ko'rsatilmaydi (takroriy so'ramaslik uchun). */
  todayMood: Mood | null;
  onPickMood: (mood: Mood) => Promise<void> | void;
}

type Card =
  | { kind: "mood" }
  | { kind: "question"; key: string; category: CheckinCategory };

export function CheckinDeck({ onClose, todayMood, onPickMood }: CheckinDeckProps) {
  const { dict } = useI18n();
  const [cards, setCards] = useState<Card[] | null>(null);
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.checkin
      .get()
      .then((res: CheckinResponse) => {
        if (cancelled) return;
        buildCards(res);
      })
      // Tarmoq xatosi — kartalarni baribir ko'rsatamiz (javob saqlanmasa,
      // foydalanuvchi keyin qayta urinadi), chunki bo'sh ekran ko'rsatish
      // bundan ham yomon.
      .catch(() => !cancelled && buildCards({ date: "", answers: [] }));

    function buildCards(res: CheckinResponse) {
      const questions: Card[] = pendingCheckinQuestions(res.answers).map((q) => ({
        kind: "question",
        key: q.key,
        category: q.category,
      }));
      setCards(todayMood ? questions : [{ kind: "mood" }, ...questions]);
    }

    return () => {
      cancelled = true;
    };
  }, [todayMood]);

  const advance = useCallback(() => setIndex((i) => i + 1), []);

  async function answer(questionKey: string, value: boolean) {
    setSaving(true);
    try {
      await api.checkin.answer({ questionKey, answer: value });
    } catch {
      // Saqlanmadi — foydalanuvchini to'xtatib qo'ymaymiz, savol ertaga
      // yana chiqadi (javob yozilmagani uchun "pending" bo'lib qoladi).
    } finally {
      setSaving(false);
      advance();
    }
  }

  async function pickMood(mood: Mood) {
    setSaving(true);
    try {
      await onPickMood(mood);
    } finally {
      setSaving(false);
      advance();
    }
  }

  const current = cards?.[index] ?? null;
  const category: CheckinCategory | "mood" = current?.kind === "question" ? current.category : "mood";
  const style = CATEGORY_STYLE[category];

  return (
    <Portal>
      <div className={clsx("fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-background", style.tint)}>
      <div className="flex justify-start p-4" style={{ paddingTop: "calc(var(--tg-safe-area-top) + 1rem)" }}>
        <button
          type="button"
          onClick={onClose}
          aria-label={dict.common.close}
          className="tap-target flex h-11 w-11 items-center justify-center rounded-full text-text-primary active:scale-95"
        >
          <Close sx={{ fontSize: 28 }} />
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-between px-5 pb-8">
        {!cards ? (
          <div className="flex flex-1 items-center justify-center">
            <LoadingSpinner label={dict.common.loading} />
          </div>
        ) : !current ? (
          // Hammasiga javob berilgan — yakuniy holat.
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <Emoji e="🌸" size={48} />
            <p className="text-2xl font-extrabold text-text-primary">{dict.checkin.doneTitle}</p>
            <p className="max-w-xs text-sm text-text-secondary">{dict.checkin.doneBody}</p>
            <button
              type="button"
              onClick={onClose}
              className="tap-target mt-4 rounded-full bg-primary px-10 py-3.5 text-base font-bold text-white active:scale-[0.98]"
            >
              {dict.common.close}
            </button>
          </div>
        ) : (
          <>
            {/* Karta to'plami — orqadagi ikkita "qirra" keyingi kartalar
                borligini ko'rsatadi (referensdagidek). */}
            <div className="relative mt-2 flex-1">
              {cards.length - index > 2 && (
                <div className="absolute inset-x-6 top-4 h-full rounded-[32px] bg-text-primary/10" />
              )}
              {cards.length - index > 1 && (
                <div className="absolute inset-x-3 top-2 h-full rounded-[32px] bg-text-primary/15" />
              )}
              <div
                // `key` — har bir kartada animatsiya qaytadan ishga tushishi uchun.
                key={current.kind === "question" ? current.key : "mood"}
                className={clsx(
                  "animate-fade-in-up relative flex h-full flex-col items-center rounded-[32px] bg-gradient-to-b px-6 pb-8 pt-6 text-white shadow-xl",
                  style.card
                )}
              >
                <span className="rounded-full bg-white/25 px-4 py-1.5 text-sm font-bold">
                  {current.kind === "mood" ? dict.checkin.moodCategory : dict.checkin.categories[current.category]}
                </span>

                <div className="my-4 h-40 w-full max-w-[260px]">
                  <CheckinArt questionKey={current.kind === "mood" ? "mood" : current.key} />
                </div>

                <p className="text-center text-base font-medium text-white/85">
                  {current.kind === "mood"
                    ? dict.checkin.moodSubtitle
                    : dict.checkin.questions[current.key as keyof typeof dict.checkin.questions].subtitle}
                </p>
                <p className="mt-2 text-center text-2xl font-extrabold leading-snug">
                  {current.kind === "mood"
                    ? dict.checkin.moodQuestion
                    : dict.checkin.questions[current.key as keyof typeof dict.checkin.questions].question}
                </p>

                {current.kind === "mood" && (
                  <div className="mt-6 grid w-full grid-cols-3 gap-3">
                    {MOODS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        disabled={saving}
                        onClick={() => pickMood(m)}
                        className="tap-target flex aspect-square items-center justify-center rounded-2xl bg-white/20 transition active:scale-95 disabled:opacity-60"
                      >
                        <Emoji e={MOOD_EMOJI[m]} size={30} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {current.kind === "question" && (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => answer(current.key, false)}
                  className="tap-target flex items-center justify-center gap-2 rounded-full bg-surface py-4 text-lg font-bold text-text-primary shadow-md active:scale-[0.98] disabled:opacity-60"
                >
                  <Close sx={{ fontSize: 22 }} />
                  {dict.checkin.no}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => answer(current.key, true)}
                  className="tap-target flex items-center justify-center gap-2 rounded-full bg-surface py-4 text-lg font-bold text-text-primary shadow-md active:scale-[0.98] disabled:opacity-60"
                >
                  <CheckOutlined sx={{ fontSize: 22 }} />
                  {dict.checkin.yes}
                </button>
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </Portal>
  );
}
