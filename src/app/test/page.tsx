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

  // Resume-in-progress: restore a saved answer set on mount, save on every
  // change, clear once the attempt is submitted (or the user retakes).
  const progressKey = user ? `mammoai-test-progress:${user.id}` : null;

  useEffect(() => {
    if (!progressKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(progressKey) ?? "null");
      if (saved && typeof saved === "object") {
        setAnswers(saved.answers ?? {});
        setStep(saved.step ?? 0);
        setForWhom(saved.forWhom ?? "");
      }
    } catch {
      // corrupt/old-shape data — ignore, start fresh
    }
  }, [progressKey]);

  useEffect(() => {
    if (!progressKey || result) return;
    if (Object.keys(answers).length === 0 && step === 0) return; // nothing to save yet
    localStorage.setItem(progressKey, JSON.stringify({ answers, step, forWhom }));
  }, [progressKey, answers, step, forWhom, result]);

  const question = questions[step];
  const progress = questions.length ? Math.round(((step + 1) / questions.length) * 100) : 0;
  const answered = question ? answers[question.id] : undefined;

  const allAnswered = useMemo(
    () => questions.length > 0 && questions.every((q) => answers[q.id]),
    [questions, answers]
  );

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const q of questions) if (q.category && !seen.includes(q.category)) seen.push(q.category);
    return seen;
  }, [questions]);

  function categoryDone(category: string) {
    return questions.filter((q) => q.category === category).every((q) => answers[q.id]);
  }

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
      if (progressKey) localStorage.removeItem(progressKey);
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
    if (progressKey) localStorage.removeItem(progressKey);
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
              <p className="mt-3 text-6xl font-bold text-pink-900 dark:text-white">
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
                <div className="mt-3 rounded-xl bg-pink-50 px-4 py-3 text-left text-xs text-pink-800 dark:bg-pink-500/10 dark:text-pink-300">
                  <p className="font-semibold">{t.test.highRiskInfoTitle}</p>
                  <p className="mt-1 whitespace-pre-line">{highRiskInfo}</p>
                </div>
              )}
              {result.riskLevel === "yuqori" && (
                <p className="mt-3 text-left text-xs">
                  <Link href="/klinikalar" className="font-semibold text-pink-600 hover:underline dark:text-pink-400">
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
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-pink-50 px-4 py-3 text-xs text-pink-700 dark:bg-pink-500/10 dark:text-pink-300">
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

        {categories.length > 1 && (
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => {
              const isCurrent = cat === question.category;
              const done = categoryDone(cat);
              return (
                <span
                  key={cat}
                  className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    isCurrent
                      ? "bg-pink-600 text-white"
                      : done
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                  }`}
                >
                  {done && !isCurrent ? "✓ " : ""}
                  {cat}
                </span>
              );
            })}
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
            className="h-full rounded-full bg-gradient-to-r from-pink-500 to-pink-700 transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <Card key={question.id} className="animate-fade-in-up p-6">
          <Badge tone="pink">{question.category}</Badge>
          <h2 className="mt-3 text-lg font-semibold text-pink-900 dark:text-white">
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
                      ? "border-pink-500 bg-pink-50 text-pink-700 dark:border-pink-400 dark:bg-pink-500/10 dark:text-pink-300"
                      : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800/60"
                  }`}
                >
                  {localizedOptionText(question, option.id, option.text, language)}
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all ${
                      selected
                        ? "scale-110 border-pink-600 bg-pink-600 dark:border-pink-400 dark:bg-pink-400"
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
