"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RISK_QUIZ_QUESTIONS, computeRiskScore, riskLevelFromScore } from "@mammoai/shared";
import type { RiskQuizAnswers, RiskLevel } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { Badge, Button, Card, LoadingSpinner, ProgressBar } from "@/components/ui";

const SRC_KEY = "mammoai_qr_src";
const ANSWERS_KEY = "mammoai_qr_answers";

/**
 * QR-flyer orqali ochiladigan, LOGIN TALAB QILMAYDIGAN "2 daqiqada bepul
 * tekshiring" sahifasi (maktab/klinika tarqatmasi funneli). `(app)` guruhi
 * TASHQARISIDA — avtomatik ochiq, sessiya kerak emas.
 *
 * Mavjud "Xavf-testi" savol/ball mantig'idan (packages/shared/src/logic/risk-quiz.ts)
 * to'liq foydalanadi, faqat natija mijoz tomonida hisoblanadi (server chaqiruvi
 * yo'q, sessiya yo'q). Natija va manba (`?src=`) sessionStorage'ga yoziladi —
 * foydalanuvchi "Ro'yxatdan o'tish"ni bosib onboarding'ni tugatgach, haqiqiy
 * natija akkauntga yoziladi (apps/web/src/app/onboarding/page.tsx).
 */
export default function BaholashPage() {
  const { dict } = useI18n();

  return (
    <div className="min-h-dvh bg-background">
      <div className="bg-aurora-cycle px-4 pb-10 pt-8 text-white">
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-extrabold">{dict.riskQuiz.title}</h1>
          <p className="mt-2 text-sm text-white/85">{dict.riskQuiz.disclaimer}</p>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pb-10 -mt-6">
        {/* `useSearchParams` build vaqtida statik prerender qilishga to'sqinlik
         * qiladi — Next.js talabi bo'yicha Suspense chegarasi ichida bo'lishi kerak. */}
        <Suspense fallback={<LoadingSpinner label={dict.common.loading} />}>
          <QuizBody />
        </Suspense>
      </div>
    </div>
  );
}

function QuizBody() {
  const { dict } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [answers, setAnswers] = useState<Partial<RiskQuizAnswers>>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<{ score: number; level: RiskLevel } | null>(null);

  useEffect(() => {
    try {
      const src = searchParams.get("src")?.trim() || "direct";
      sessionStorage.setItem(SRC_KEY, src);
    } catch {
      // sessionStorage bloklangan bo'lsa — manba kuzatilmaydi, lekin test o'zi ishlayveradi.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const question = RISK_QUIZ_QUESTIONS[stepIndex];
  const isLast = stepIndex === RISK_QUIZ_QUESTIONS.length - 1;

  function answer(value: boolean) {
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    if (!isLast) {
      setStepIndex((i) => i + 1);
      return;
    }
    const fullAnswers = next as RiskQuizAnswers;
    const score = computeRiskScore(fullAnswers);
    const level = riskLevelFromScore(score);
    setResult({ score, level });
    try {
      sessionStorage.setItem(ANSWERS_KEY, JSON.stringify(fullAnswers));
    } catch {
      // Saqlanmasa ham — natija shu sahifada ko'rinadi, faqat keyinroq akkauntga yozilmaydi.
    }
  }

  if (result) {
    return (
      <Card className="flex flex-col gap-3">
        <Badge tone={result.level === "high" ? "danger" : result.level === "medium" ? "warning" : "success"}>
          {dict.riskQuiz.levels[result.level].label}
        </Badge>
        <h2 className="text-xl font-bold text-text-primary">{dict.riskQuiz.resultTitle}</h2>
        <p className="text-text-secondary">{dict.riskQuiz.levels[result.level].description}</p>
        <Button className="w-full" onClick={() => router.push("/onboarding?fromQuiz=1")}>
          {dict.landing.ctaPrimary}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <ProgressBar value={((stepIndex + 1) / RISK_QUIZ_QUESTIONS.length) * 100} />
        <p className="text-sm text-text-muted">
          {stepIndex + 1} / {RISK_QUIZ_QUESTIONS.length}
        </p>
      </div>
      <h2 className="text-lg font-semibold text-text-primary">{dict.riskQuiz.questions[question.id]}</h2>
      <div className="flex gap-2">
        <Button className="flex-1" variant="secondary" onClick={() => answer(true)}>
          {dict.common.yes}
        </Button>
        <Button className="flex-1" variant="secondary" onClick={() => answer(false)}>
          {dict.common.no}
        </Button>
      </div>
    </Card>
  );
}
