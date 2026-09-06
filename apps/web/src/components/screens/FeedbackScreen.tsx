"use client";

import { useState } from "react";
import clsx from "clsx";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Button, Card, ScreenHeader } from "@/components/ui";

const RATINGS = [1, 2, 3, 4, 5];

export function FeedbackScreen() {
  const { dict } = useI18n();
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (rating === null && !message.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.feedback.submit({ trigger: "manual", rating, message: message.trim() || null });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.chat.sendError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader title={dict.feedback.title} subtitle={dict.feedback.subtitle} />

      {submitted ? (
        <Card className="py-8 text-center text-sm font-semibold text-success">{dict.feedback.thankYou}</Card>
      ) : (
        <Card className="flex flex-col gap-4">
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
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={dict.feedback.messagePlaceholder}
            rows={5}
            maxLength={2000}
            className="tap-target w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
          />

          {error && <p className="text-xs font-medium text-danger">{error}</p>}

          <Button className="w-full" onClick={submit} disabled={submitting || (rating === null && !message.trim())}>
            {submitting ? "…" : dict.feedback.submitButton}
          </Button>
        </Card>
      )}
    </div>
  );
}
