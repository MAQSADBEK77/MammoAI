"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Printer, ShieldAlert, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { RequireAuth } from "@/components/RequireAuth";
import { RiskBadge, getRiskDescription } from "@/components/RiskBadge";
import { Meter } from "@/components/Meter";
import { Badge, Button, Card, LinkButton, Select } from "@/components/ui";
import { StatCounter } from "@/components/StatCounter";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth-context";
import { apiGetFamilyMembers, apiGetHighRiskInfo, apiGetQuestions, apiSubmitAttempt, type FamilyMember } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/context";
import { localizedOptionText, localizedQuestionText } from "@/lib/quiz-i18n";
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
  const { t, language } = useLanguage();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { optionId: string; score: number }>>({});
  const [result, setResult] = useState<QuizAttempt | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highRiskInfo, setHighRiskInfo] = useState("");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [forWhom, setForWhom] = useState(""); // "" = self, else a family member id

  useEffect(() => {
    if (result?.riskLevel === "yuqori") {
      apiGetHighRiskInfo().then(setHighRiskInfo);
    }
  }, [result?.riskLevel]);

  useEffect(() => {
    apiGetQuestions()
      .then(setQuestions)
      .catch((err) => setError(err instanceof Error ? err.message : t.test.loadError));
    apiGetFamilyMembers().then(setFamilyMembers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function goNext() {
    if (step < questions.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    if (!user || !allAnswered) return;

    setSubmitting(true);
    setError(null);
    try {
      const attempt = await apiSubmitAttempt(
        Object.entries(answers).map(([questionId, a]) => ({ questionId, optionId: a.optionId })),
        forWhom || null
      );
      setResult(attempt);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.test.submitError);
    } finally {
      setSubmitting(false);
    }
  }

  function retake() {
    setAnswers({});
    setStep(0);
    setResult(null);
  }

  if (result) {
    return (
      <div className="flex min-h-full flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-14 sm:px-6 lg:px-8">
          <Card className="animate-pop-in p-8 text-center">
            <div className="print-area">
              <div className="mb-6 hidden text-left print:block">
                <Logo size="sm" align="left" dark={false} withSubtitle={false} />
                <p className="mt-3 text-sm text-slate-600">
                  {user?.firstName} {user?.lastName} · {formatDate(result.createdAt, language)}
                </p>
              </div>

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {t.test.resultLabel}
              </p>
              <p className="mt-3 text-6xl font-bold text-slate-900 dark:text-white">
                <StatCounter value={result.percent} suffix="%" duration={900} />
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.test.riskPercentLabel}</p>

              <div className="mt-6 flex justify-center">
                <RiskBadge level={result.riskLevel} pulse />
              </div>

              <div className="mt-6">
                <Meter percent={result.percent} level={result.riskLevel} />
                <div className="mt-1.5 flex justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  <span>{t.test.low}</span>
                  <span>{t.test.medium}</span>
                  <span>{t.test.high}</span>
                </div>
              </div>

              <p className="mt-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {getRiskDescription(t, result.riskLevel)}
              </p>

              <div className="mt-6 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-left text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                <p>{t.test.resultDisclaimer}</p>
              </div>

              {result.riskLevel === "yuqori" && highRiskInfo && (
                <div className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-left text-xs text-blue-800 dark:bg-blue-500/10 dark:text-blue-300">
                  <p className="font-semibold">{t.test.highRiskInfoTitle}</p>
                  <p className="mt-1 whitespace-pre-line">{highRiskInfo}</p>
                </div>
              )}
              {result.riskLevel === "yuqori" && (
                <p className="mt-3 text-left text-xs">
                  <Link href="/klinikalar" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                    {t.nav.clinics} →
                  </Link>
                </p>
              )}
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button variant="secondary" onClick={retake}>
                {t.test.retakeButton}
              </Button>
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer size={15} />
                {t.test.printButton}
              </Button>
              <LinkButton href="/profile">{t.test.backToProfile}</LinkButton>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex min-h-full flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <main className="flex flex-1 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
          {error ?? t.common.loading}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
          <Sparkles size={14} />
          {t.test.disclaimerBanner}
        </div>

        {step === 0 && familyMembers.length > 0 && (
          <div className="mb-6">
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t.test.forWhomLabel}
            </label>
            <Select value={forWhom} onChange={(e) => setForWhom(e.target.value)}>
              <option value="">{t.test.forSelfOption}</option>
              {familyMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName}
                  {m.relation ? ` (${m.relation})` : ""}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-400 dark:text-slate-500">
          <span>
            {t.test.questionLabel} {step + 1} / {questions.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="mb-6 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-700 transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <Card key={question.id} className="animate-fade-in-up p-6">
          <Badge tone="blue">{question.category}</Badge>
          <h2 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
            {localizedQuestionText(question, language)}
          </h2>

          <div className="mt-5 flex flex-col gap-2.5">
            {question.options.map((option) => {
              const selected = answered?.optionId === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectOption(option.id, option.score)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all cursor-pointer ${
                    selected
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300"
                      : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800/60"
                  }`}
                >
                  {localizedOptionText(question, option.id, option.text, language)}
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all ${
                      selected
                        ? "scale-110 border-blue-600 bg-blue-600 dark:border-blue-400 dark:bg-blue-400"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </Card>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft size={15} />
            {t.test.backButton}
          </Button>
          <Button onClick={goNext} disabled={!answered || submitting}>
            {submitting ? t.test.submittingButton : step === questions.length - 1 ? t.test.finishButton : t.test.nextButton}
            <ArrowRight size={15} />
          </Button>
        </div>
      </main>
    </div>
  );
}
