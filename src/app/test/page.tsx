"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { RequireAuth } from "@/components/RequireAuth";
import { RiskBadge } from "@/components/RiskBadge";
import { Meter } from "@/components/Meter";
import { Badge, Button, Card, LinkButton } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { RISK_DESCRIPTIONS, getQuestions, submitAttempt } from "@/lib/store";
import type { QuizAttempt, QuizQuestion } from "@/lib/types";

export default function TestPage() {
  return (
    <RequireAuth>
      <TestContent />
    </RequireAuth>
  );
}

function TestContent() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { optionId: string; score: number }>>({});
  const [result, setResult] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    setQuestions(getQuestions());
  }, []);

  const question = questions[step];
  const progress = questions.length ? Math.round(((step + 1) / questions.length) * 100) : 0;
  const answered = question ? answers[question.id] : undefined;

  const allAnswered = useMemo(
    () => questions.length > 0 && questions.every((q) => answers[q.id]),
    [questions, answers]
  );

  function selectOption(optionId: string, score: number) {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: { optionId, score } }));
  }

  function goNext() {
    if (step < questions.length - 1) {
      setStep((s) => s + 1);
    } else if (user && allAnswered) {
      const attempt = submitAttempt(
        user.id,
        Object.entries(answers).map(([questionId, a]) => ({ questionId, ...a }))
      );
      setResult(attempt);
    }
  }

  function retake() {
    setAnswers({});
    setStep(0);
    setResult(null);
  }

  if (result) {
    return (
      <div className="flex min-h-full flex-col bg-slate-50">
        <Navbar />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-14 sm:px-6 lg:px-8">
          <Card className="p-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Test natijasi
            </p>
            <p className="mt-3 text-6xl font-bold text-slate-900">{result.percent}%</p>
            <p className="mt-1 text-sm text-slate-500">xavf ko&apos;rsatkichi</p>

            <div className="mt-6 flex justify-center">
              <RiskBadge level={result.riskLevel} />
            </div>

            <div className="mt-6">
              <Meter percent={result.percent} level={result.riskLevel} />
              <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
                <span>Past</span>
                <span>O&apos;rta</span>
                <span>Yuqori</span>
              </div>
            </div>

            <p className="mt-6 text-sm leading-relaxed text-slate-600">
              {RISK_DESCRIPTIONS[result.riskLevel]}
            </p>

            <div className="mt-6 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-left text-xs text-amber-800">
              <ShieldAlert size={16} className="mt-0.5 shrink-0" />
              <p>
                Bu natija tibbiy tashxis emas, faqat dastlabki xabardorlik uchun
                mo&apos;ljallangan. Xavotir bo&apos;lsa shifokorga murojaat qiling.
              </p>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button variant="secondary" onClick={retake}>
                Qayta topshirish
              </Button>
              <LinkButton href="/profile">Profilga qaytish</LinkButton>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex min-h-full flex-col bg-slate-50">
        <Navbar />
        <main className="flex flex-1 items-center justify-center text-sm text-slate-400">
          Yuklanmoqda...
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-700">
          <Sparkles size={14} />
          Bu test dastlabki xabardorlik uchun mo&apos;ljallangan, tibbiy tashxis
          o&apos;rnini bosmaydi.
        </div>

        <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-400">
          <span>
            Savol {step + 1} / {questions.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="mb-6 h-2 w-full rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-700 transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <Card className="p-6">
          <Badge tone="blue">{question.category}</Badge>
          <h2 className="mt-3 text-lg font-semibold text-slate-900">
            {question.text}
          </h2>

          <div className="mt-5 flex flex-col gap-2.5">
            {question.options.map((option) => {
              const selected = answered?.optionId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectOption(option.id, option.score)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors cursor-pointer ${
                    selected
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {option.text}
                  <span
                    className={`h-4 w-4 rounded-full border-2 ${
                      selected ? "border-blue-600 bg-blue-600" : "border-slate-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </Card>

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft size={15} />
            Orqaga
          </Button>
          <Button onClick={goNext} disabled={!answered}>
            {step === questions.length - 1 ? "Yakunlash" : "Keyingi"}
            <ArrowRight size={15} />
          </Button>
        </div>
      </main>
    </div>
  );
}
