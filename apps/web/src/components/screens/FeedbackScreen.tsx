"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Button, Card, ScreenHeader } from "@/components/ui";

const RATINGS = [1, 2, 3, 4, 5];

export function FeedbackScreen() {
  const { dict } = useI18n();
  /**
   * PREMIUM-01 — Premium so'rovi shu ekranning ALOHIDA ko'rinishi.
   *
   * Ilgari "Faollashtirish uchun murojaat qilish" tugmasi ayolni shu
   * sahifaga olib kelardi, u yerda esa "Umumiy bahoingiz — 1 dan 5
   * gacha" degan savol turardi. Ayol Premium so'ragan, ilovaga baho
   * emas: savol ham noto'g'ri, tugma ham baho qo'yilmaguncha o'chiq
   * edi. Ya'ni Premium so'rashning ishlaydigan yo'li yo'q edi.
   *
   * So'rov `premium_request` turi bilan yoziladi — bu sotuv signali,
   * uni umumiy fikrlar orasida yo'qotib bo'lmaydi.
   */
  const isPremiumRequest = useSearchParams().get("tema") === "premium";
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    // Premium so'rovida matn ham, baho ham MAJBURIY EMAS: bosishning
    // o'zi "menga kerak" degani.
    if (!isPremiumRequest && rating === null && !message.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.feedback.submit({
        trigger: isPremiumRequest ? "premium_request" : "manual",
        rating,
        message: message.trim() || null,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.chat.sendError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader
        title={isPremiumRequest ? dict.feedback.premiumTitle : dict.feedback.title}
        subtitle={isPremiumRequest ? dict.feedback.premiumSubtitle : dict.feedback.subtitle}
      />

      {submitted ? (
        <Card className="py-8 text-center text-sm font-semibold text-success">
          {isPremiumRequest ? dict.feedback.premiumThankYou : dict.feedback.thankYou}
        </Card>
      ) : (
        <Card className="flex flex-col gap-4">
          {/* Premium so'rovida baho so'ralmaydi — ayol ilovaga baho
              qo'ymoqchi emas, imkoniyat so'rayapti. */}
          {!isPremiumRequest && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-text-secondary">{dict.feedback.ratingLabel}</p>
            <div className="flex gap-2">
              {RATINGS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={clsx(
                    "tap-target aspect-square flex-1 rounded-2xl text-base font-bold transition",
                    rating === n ? "bg-primary text-white" : "bg-surface-muted text-text-secondary"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            {/* FIX-UX-07: raqamlarning o'zi qaysi tomoni "yaxshi" ekanini
                ko'rsatmaydi — chap/o'ng uchlarda aniq semantik yorliq. */}
            <div className="flex justify-between text-xs text-text-muted">
              <span>{dict.feedback.ratingWorst}</span>
              <span>{dict.feedback.ratingBest}</span>
            </div>
          </div>
          )}

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isPremiumRequest ? dict.feedback.premiumPlaceholder : dict.feedback.messagePlaceholder}
            rows={5}
            maxLength={2000}
            className="tap-target w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
          />

          {error && <p className="text-xs font-medium text-danger">{error}</p>}

          <Button
            className="w-full"
            onClick={submit}
            disabled={submitting || (!isPremiumRequest && rating === null && !message.trim())}
          >
            {submitting ? "…" : isPremiumRequest ? dict.feedback.premiumSubmit : dict.feedback.submitButton}
          </Button>
        </Card>
      )}
    </div>
  );
}
