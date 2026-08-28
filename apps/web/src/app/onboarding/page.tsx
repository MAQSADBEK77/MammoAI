"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { CycleRegularity, OnboardingProfile } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Button, ProgressBar } from "@/components/ui";
import clsx from "clsx";

type Step = "welcome" | "language" | "age" | "pregnant" | "cycle" | "family" | "checkup";
const STEPS: Step[] = ["welcome", "language", "age", "pregnant", "cycle", "family", "checkup"];

interface SurveyState {
  age: string;
  isPregnant: boolean | null;
  cycleRegularity: CycleRegularity | null;
  familyHistory: boolean | null;
  lastCheckup: OnboardingProfile["lastCheckup"] | null;
}

export default function OnboardingPage() {
  const { dict, language, setLanguage } = useI18n();
  const { applyMeResponse } = useSession();
  const router = useRouter();

  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [survey, setSurvey] = useState<SurveyState>({
    age: "",
    isPregnant: null,
    cycleRegularity: null,
    familyHistory: null,
    lastCheckup: null,
  });

  const step = STEPS[stepIndex];
  const goNext = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  async function finish() {
    setSubmitting(true);
    try {
      const age = Number(survey.age);
      const isPregnant = !!survey.isPregnant;
      const res = await api.onboarding.submit({
        age,
        isPregnant,
        cycleRegularity: survey.cycleRegularity ?? "unknown",
        familyHistory: !!survey.familyHistory,
        lastCheckup: survey.lastCheckup ?? "unknown",
        primaryGoal: isPregnant ? "pregnancy" : "cycle",
        language,
      });
      applyMeResponse(res);
      router.replace(isPregnant ? "/homiladorlik" : "/tsikl");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-between bg-background px-6 py-8">
      {step !== "welcome" && (
        <div className="mb-6">
          <ProgressBar value={((stepIndex) / (STEPS.length - 1)) * 100} />
        </div>
      )}

      {step === "welcome" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center animate-fade-in-up">
          <Image src="/logo.svg" alt="Logo" width={220} height={124} priority />
          <h1 className="text-3xl font-extrabold text-text-primary">{dict.onboarding.welcomeTitle}</h1>
          <p className="max-w-xs text-text-secondary">{dict.onboarding.welcomeSubtitle}</p>
        </div>
      )}

      {step === "language" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 animate-fade-in-up">
          <h2 className="mb-2 text-xl font-bold text-text-primary">{dict.onboarding.languageTitle}</h2>
          <LangOption label="O'zbekcha" active={language === "uz"} onClick={() => setLanguage("uz")} />
          <LangOption label="Русский" active={language === "ru"} onClick={() => setLanguage("ru")} />
        </div>
      )}

      {step === "age" && (
        <div className="flex flex-1 flex-col justify-center gap-4 animate-fade-in-up">
          <h2 className="text-xl font-bold text-text-primary">{dict.onboarding.surveyTitle}</h2>
          <p className="text-sm text-text-secondary">{dict.onboarding.surveyIntro}</p>
          <label className="mt-4 block text-sm font-semibold text-text-secondary">
            {dict.onboarding.ageLabel}
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={10}
            max={100}
            value={survey.age}
            onChange={(e) => setSurvey((s) => ({ ...s, age: e.target.value }))}
            className="tap-target rounded-2xl border border-border bg-surface px-4 text-lg text-text-primary outline-none focus:border-primary"
            placeholder="30"
          />
        </div>
      )}

      {step === "pregnant" && (
        <ChoiceStep
          title={dict.onboarding.pregnantQuestion}
          options={[
            { label: dict.common.yes, value: "yes", onClick: () => setSurvey((s) => ({ ...s, isPregnant: true })) },
            { label: dict.common.no, value: "no", onClick: () => setSurvey((s) => ({ ...s, isPregnant: false })) },
          ]}
          selected={survey.isPregnant === null ? null : survey.isPregnant ? "yes" : "no"}
        />
      )}

      {step === "cycle" && (
        <ChoiceStep
          title={dict.onboarding.cycleRegularityQuestion}
          options={[
            { label: dict.onboarding.cycleRegular, value: "regular", onClick: () => setSurvey((s) => ({ ...s, cycleRegularity: "regular" })) },
            { label: dict.onboarding.cycleIrregular, value: "irregular", onClick: () => setSurvey((s) => ({ ...s, cycleRegularity: "irregular" })) },
            { label: dict.common.dontKnow, value: "unknown", onClick: () => setSurvey((s) => ({ ...s, cycleRegularity: "unknown" })) },
          ]}
          selected={survey.cycleRegularity}
        />
      )}

      {step === "family" && (
        <ChoiceStep
          title={dict.onboarding.familyHistoryQuestion}
          options={[
            { label: dict.common.yes, value: "yes", onClick: () => setSurvey((s) => ({ ...s, familyHistory: true })) },
            { label: dict.common.no, value: "no", onClick: () => setSurvey((s) => ({ ...s, familyHistory: false })) },
          ]}
          selected={survey.familyHistory === null ? null : survey.familyHistory ? "yes" : "no"}
        />
      )}

      {step === "checkup" && (
        <ChoiceStep
          title={dict.onboarding.lastCheckupQuestion}
          options={[
            { label: dict.onboarding.checkupRecent, value: "recent", onClick: () => setSurvey((s) => ({ ...s, lastCheckup: "recent" })) },
            { label: dict.onboarding.checkupOverYear, value: "over_year", onClick: () => setSurvey((s) => ({ ...s, lastCheckup: "over_year" })) },
            { label: dict.onboarding.checkupNever, value: "never", onClick: () => setSurvey((s) => ({ ...s, lastCheckup: "never" })) },
            { label: dict.common.dontKnow, value: "unknown", onClick: () => setSurvey((s) => ({ ...s, lastCheckup: "unknown" })) },
          ]}
          selected={survey.lastCheckup}
        />
      )}

      <div className="mt-8 flex items-center gap-3">
        {stepIndex > 0 && (
          <Button variant="ghost" onClick={goBack} disabled={submitting}>
            {dict.common.back}
          </Button>
        )}
        {step === "welcome" ? (
          <Button className="ml-auto" onClick={goNext}>
            {dict.onboarding.startButton}
          </Button>
        ) : step === "checkup" ? (
          <Button className="ml-auto" onClick={finish} disabled={submitting || !survey.lastCheckup}>
            {dict.onboarding.finishButton}
          </Button>
        ) : (
          <Button className="ml-auto" onClick={goNext} disabled={!canProceed(step, survey)}>
            {dict.common.next}
          </Button>
        )}
      </div>
    </div>
  );
}

function canProceed(step: Step, survey: SurveyState): boolean {
  switch (step) {
    case "age":
      return Number(survey.age) >= 10 && Number(survey.age) <= 100;
    case "pregnant":
      return survey.isPregnant !== null;
    case "cycle":
      return survey.cycleRegularity !== null;
    case "family":
      return survey.familyHistory !== null;
    default:
      return true;
  }
}

function LangOption({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "tap-target w-full max-w-xs rounded-2xl border-2 px-6 py-4 text-lg font-semibold transition",
        active ? "border-primary bg-primary-light text-primary-dark" : "border-border bg-surface text-text-primary"
      )}
    >
      {label}
    </button>
  );
}

function ChoiceStep({
  title,
  options,
  selected,
}: {
  title: string;
  options: { label: string; value: string; onClick: () => void }[];
  selected: string | null;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-3 animate-fade-in-up">
      <h2 className="mb-2 text-xl font-bold text-text-primary">{title}</h2>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={opt.onClick}
          className={clsx(
            "tap-target w-full rounded-2xl border-2 px-5 py-4 text-left text-base font-medium transition",
            selected === opt.value
              ? "border-primary bg-primary-light text-primary-dark"
              : "border-border bg-surface text-text-primary hover:border-primary-light"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
