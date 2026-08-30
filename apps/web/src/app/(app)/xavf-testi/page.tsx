"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RISK_QUIZ_QUESTIONS } from "@mammoai/shared";
import type { RiskQuizAnswers, RiskQuizResult } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Button, Card, LoadingSpinner, ProgressBar, ScreenHeader } from "@/components/ui";

export default function RiskQuizPage() {
  const { dict } = useI18n();
  const router = useRouter();

  const [existingResult, setExistingResult] = useState<RiskQuizResult | null | undefined>(undefined);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Partial<RiskQuizAnswers>>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<RiskQuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.riskQuiz.get().then(setExistingResult);
  }, []);

  const question = RISK_QUIZ_QUESTIONS[stepIndex];
  const isLast = stepIndex === RISK_QUIZ_QUESTIONS.length - 1;

  async function answer(value: boolean) {
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    if (!isLast) {
      setStepIndex((i) => i + 1);
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.riskQuiz.submit(next as RiskQuizAnswers);
      setResult(res);
    } finally {
      setSubmitting(false);
    }
  }

  const shown = result ?? (existingResult && !started ? existingResult : null);

  if (existingResult === undefined) {
    return <LoadingSpinner label={dict.common.loading} />;
  }

  return (
    <div className="space-y-5 pb-6">
      <ScreenHeader title={dict.riskQuiz.title} />
      <p className="-mt-3 text-xs text-text-muted">{dict.riskQuiz.disclaimer}</p>

      {shown ? (
        <Card className="space-y-3">
          <Badge tone={shown.level === "high" ? "danger" : shown.level === "medium" ? "warning" : "success"}>
            {dict.riskQuiz.levels[shown.level].label}
          </Badge>
          <h2 className="text-xl font-bold text-text-primary">{dict.riskQuiz.resultTitle}</h2>
          <p className="text-text-secondary">{dict.riskQuiz.levels[shown.level].description}</p>
          {shown.level !== "low" && (
            <Button className="w-full" onClick={() => router.push("/klinikalar")}>
              {dict.riskQuiz.findClinicButton}
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setStarted(true);
              setResult(null);
              setAnswers({});
              setStepIndex(0);
            }}
          >
            {dict.riskQuiz.startButton}
          </Button>
        </Card>
      ) : (
        <Card className="space-y-4">
          <div className="space-y-2">
            <ProgressBar value={((stepIndex + 1) / RISK_QUIZ_QUESTIONS.length) * 100} />
            <p className="text-sm text-text-muted">
              {stepIndex + 1} / {RISK_QUIZ_QUESTIONS.length}
            </p>
          </div>
          <h2 className="text-lg font-semibold text-text-primary">{dict.riskQuiz.questions[question.id]}</h2>
          <div className="flex gap-2">
            <Button className="flex-1" variant="secondary" onClick={() => answer(true)} disabled={submitting}>
              {dict.common.yes}
            </Button>
            <Button className="flex-1" variant="secondary" onClick={() => answer(false)} disabled={submitting}>
              {dict.common.no}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
