"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type {
  CycleRegularity,
  Goal,
  HealthCondition,
  HeardAboutUs,
  OnboardingProfile,
  PeriodAttitude,
  Symptom,
} from "@mammoai/shared";
import { ADULT_GOALS, MINOR_GOALS, goalToLandingTab, needsCycleInfo, needsHeightWeight } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Button, IconChip, ProgressBar } from "@/components/ui";
import clsx from "clsx";

type Step =
  | "welcome"
  | "language"
  | "account_choice"
  | "account_identifier"
  | "privacy"
  | "heard_about_us"
  | "name"
  | "age"
  | "goal"
  | "cycle_regularity"
  | "cycle_lengths"
  | "last_period"
  | "typical_symptoms"
  | "period_attitude"
  | "health_conditions"
  | "family_history"
  | "last_checkup"
  | "height_weight"
  | "notifications"
  | "analyzing";

interface SurveyState {
  accountChoice: "create" | "login" | null;
  identifier: string;
  heardAboutUs: HeardAboutUs | null;
  name: string;
  age: string;
  primaryGoal: Goal | null;
  cycleRegularity: CycleRegularity | null;
  averageCycleLength: string;
  averagePeriodLength: string;
  lastPeriodDate: string;
  typicalSymptoms: Symptom[];
  periodAttitude: PeriodAttitude | null;
  healthConditions: HealthCondition[];
  healthConditionsOther: string;
  familyHistory: boolean | null;
  lastCheckup: OnboardingProfile["lastCheckup"] | null;
  heightCm: string;
  weightKg: string;
  notificationsEnabled: boolean | null;
}

const INITIAL_SURVEY: SurveyState = {
  accountChoice: null,
  identifier: "",
  heardAboutUs: null,
  name: "",
  age: "",
  primaryGoal: null,
  cycleRegularity: null,
  averageCycleLength: "28",
  averagePeriodLength: "5",
  lastPeriodDate: "",
  typicalSymptoms: [],
  periodAttitude: null,
  healthConditions: [],
  healthConditionsOther: "",
  familyHistory: null,
  lastCheckup: null,
  heightCm: "",
  weightKg: "",
  notificationsEnabled: null,
};

function landingPath(goal: Goal): string {
  const tab = goalToLandingTab(goal);
  return tab === "cycle" ? "/tsikl" : tab === "pregnancy" ? "/homiladorlik" : "/tekshiruvlar";
}

const SYMPTOM_OPTIONS: Symptom[] = [
  "cramps",
  "headache",
  "fatigue",
  "irritability",
  "difficulty_concentrating",
  "bloating",
  "back_pain",
  "nausea",
];

const HEALTH_CONDITION_OPTIONS: HealthCondition[] = [
  "yeast_infection",
  "uti",
  "bacterial_vaginosis",
  "pcos",
  "endometriosis",
  "fibroids",
  "unknown",
  "none",
];

export default function OnboardingPage() {
  const { dict, language, setLanguage } = useI18n();
  const { applyMeResponse } = useSession();
  const router = useRouter();

  const [survey, setSurvey] = useState<SurveyState>(INITIAL_SURVEY);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const age = Number(survey.age);
  const isMinor = age > 0 && age < 18;

  // Bosqichlar ro'yxati maqsad/yoshga qarab dinamik shakllanadi (App.pdf §7-10).
  const steps = useMemo<Step[]>(() => {
    const base: Step[] = [
      "welcome",
      "language",
      "account_choice",
      "account_identifier",
      "privacy",
      "heard_about_us",
      "name",
      "age",
      "goal",
    ];
    if (!survey.primaryGoal) return [...base, "analyzing"];

    const tail: Step[] = [];
    if (needsCycleInfo(survey.primaryGoal)) {
      tail.push(
        "cycle_regularity",
        "cycle_lengths",
        "last_period",
        "typical_symptoms",
        "period_attitude",
        "health_conditions"
      );
    }
    tail.push("family_history", "last_checkup");
    if (needsHeightWeight(survey.primaryGoal)) tail.push("height_weight");
    tail.push("notifications", "analyzing");
    return [...base, ...tail];
  }, [survey.primaryGoal]);

  const step = steps[stepIndex];
  const goNext = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  function toggleArrayValue<T>(arr: T[], value: T): T[] {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  }

  async function submitIdentifier() {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await api.auth.start({ identifier: survey.identifier.trim(), language });
      applyMeResponse(res);
      if (res.onboardingProfile) {
        router.replace(landingPath(res.onboardingProfile.primaryGoal));
        return;
      }
      goNext();
    } catch {
      setErrorMessage(dict.auth.invalidIdentifier);
    } finally {
      setSubmitting(false);
    }
  }

  async function finish() {
    setSubmitting(true);
    try {
      if (survey.primaryGoal && needsCycleInfo(survey.primaryGoal) && survey.lastPeriodDate) {
        await api.cycle.updateSettings({
          lastPeriodStart: survey.lastPeriodDate,
          averageCycleLength: Number(survey.averageCycleLength) || 28,
          averagePeriodLength: Number(survey.averagePeriodLength) || 5,
        });
      }
      const res = await api.onboarding.submit({
        name: survey.name.trim(),
        age,
        isPregnant: survey.primaryGoal === "pregnancy",
        cycleRegularity: survey.cycleRegularity ?? "unknown",
        familyHistory: !!survey.familyHistory,
        lastCheckup: survey.lastCheckup ?? "unknown",
        primaryGoal: survey.primaryGoal!,
        heardAboutUs: survey.heardAboutUs ?? "other",
        typicalSymptoms: survey.typicalSymptoms,
        periodAttitude: survey.periodAttitude,
        healthConditions: survey.healthConditions,
        healthConditionsOther: survey.healthConditionsOther || null,
        heightCm: survey.heightCm ? Number(survey.heightCm) : null,
        weightKg: survey.weightKg ? Number(survey.weightKg) : null,
        notificationsEnabled: !!survey.notificationsEnabled,
      });
      applyMeResponse(res);
      router.replace(landingPath(survey.primaryGoal!));
    } finally {
      setSubmitting(false);
    }
  }

  // "Tahlil qilinmoqda" bosqichiga yetganda avtomatik yakunlaymiz — bu "mount'da
  // fetch" naqshi emas, balki foydalanuvchi shu bosqichga yetganda bir martalik
  // yakunlovchi amal, shuning uchun ataylab qoldirilgan.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (step === "analyzing") finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function canProceed(): boolean {
    switch (step) {
      case "account_choice":
        return survey.accountChoice !== null;
      case "account_identifier":
        return survey.identifier.trim().length > 3;
      case "heard_about_us":
        return survey.heardAboutUs !== null;
      case "name":
        return survey.name.trim().length > 0;
      case "age":
        return age >= 13 && age <= 100;
      case "goal":
        return survey.primaryGoal !== null;
      case "cycle_regularity":
        return survey.cycleRegularity !== null;
      case "last_period":
        return survey.lastPeriodDate.length > 0;
      case "period_attitude":
        return survey.periodAttitude !== null;
      case "family_history":
        return survey.familyHistory !== null;
      case "last_checkup":
        return survey.lastCheckup !== null;
      case "height_weight":
        return survey.heightCm.length > 0 && survey.weightKg.length > 0;
      case "notifications":
        return survey.notificationsEnabled !== null;
      default:
        return true;
    }
  }

  const goalOptions = isMinor ? MINOR_GOALS : ADULT_GOALS;

  return (
    <div
      className={clsx(
        "mx-auto flex min-h-dvh max-w-md flex-col justify-between px-6 py-8",
        step === "welcome" ? "bg-primary" : "bg-background"
      )}
    >
      {step !== "welcome" && step !== "analyzing" && (
        <div className="mb-6">
          <ProgressBar value={(stepIndex / (steps.length - 1)) * 100} />
        </div>
      )}

      <div className="flex-1">
        {step === "welcome" && (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center animate-fade-in-up">
            <div className="rounded-full bg-white/15 p-4">
              <Image src="/logo.svg" alt="Logo" width={180} height={101} priority />
            </div>
            <h1 className="text-3xl font-extrabold text-white">{dict.onboarding.welcomeTitle}</h1>
            <p className="max-w-xs text-white/85">{dict.onboarding.welcomeSubtitle}</p>
          </div>
        )}

        {step === "language" && (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <h2 className="mb-2 text-xl font-bold text-text-primary">{dict.onboarding.languageTitle}</h2>
            <LangOption label="O'zbekcha" active={language === "uz"} onClick={() => setLanguage("uz")} />
            <LangOption label="Русский" active={language === "ru"} onClick={() => setLanguage("ru")} />
          </div>
        )}

        {step === "account_choice" && (
          <ChoiceStep
            title={dict.onboarding.surveyTitle}
            options={[
              { label: dict.auth.createAccount, value: "create", onClick: () => setSurvey((s) => ({ ...s, accountChoice: "create" })) },
              { label: dict.auth.haveAccount, value: "login", onClick: () => setSurvey((s) => ({ ...s, accountChoice: "login" })) },
            ]}
            selected={survey.accountChoice}
          />
        )}

        {step === "account_identifier" && (
          <div className="flex h-full flex-col justify-center gap-4">
            <h2 className="text-xl font-bold text-text-primary">{dict.auth.identifierLabel}</h2>
            <input
              value={survey.identifier}
              onChange={(e) => setSurvey((s) => ({ ...s, identifier: e.target.value }))}
              placeholder={dict.auth.identifierPlaceholder}
              className="tap-target rounded-2xl border border-border bg-surface px-4 text-lg text-text-primary outline-none focus:border-primary"
            />
            {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}
          </div>
        )}

        {step === "privacy" && (
          <div className="flex h-full flex-col justify-center gap-4">
            <h2 className="text-xl font-bold text-text-primary">{dict.privacy.title}</h2>
            <p className="text-sm leading-relaxed text-text-secondary">{dict.privacy.body}</p>
          </div>
        )}

        {step === "heard_about_us" && (
          <ChoiceStep
            title={dict.onboarding.heardAboutUsTitle}
            options={(["social_media", "friend", "doctor", "app_store", "other"] as HeardAboutUs[]).map((v) => ({
              label: dict.onboarding.heardAboutUs[v],
              value: v,
              onClick: () => setSurvey((s) => ({ ...s, heardAboutUs: v })),
            }))}
            selected={survey.heardAboutUs}
          />
        )}

        {step === "name" && (
          <div className="flex h-full flex-col justify-center gap-4">
            <h2 className="text-xl font-bold text-text-primary">{dict.onboarding.nameQuestion}</h2>
            <input
              value={survey.name}
              onChange={(e) => setSurvey((s) => ({ ...s, name: e.target.value }))}
              placeholder={dict.onboarding.namePlaceholder}
              className="tap-target rounded-2xl border border-border bg-surface px-4 text-lg text-text-primary outline-none focus:border-primary"
            />
          </div>
        )}

        {step === "age" && (
          <div className="flex h-full flex-col justify-center gap-4">
            <h2 className="text-xl font-bold text-text-primary">{dict.onboarding.ageLabel}</h2>
            <select
              value={survey.age}
              onChange={(e) => setSurvey((s) => ({ ...s, age: e.target.value }))}
              className="tap-target rounded-2xl border border-border bg-surface px-4 text-lg text-text-primary outline-none focus:border-primary"
            >
              <option value="" disabled>
                —
              </option>
              {Array.from({ length: 88 }, (_, i) => i + 13).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}

        {step === "goal" && (
          <ChoiceStep
            title={dict.onboarding.goalTitle}
            options={goalOptions.map((g) => ({
              label: dict.onboarding.goals[g],
              value: g,
              onClick: () => setSurvey((s) => ({ ...s, primaryGoal: g })),
            }))}
            selected={survey.primaryGoal}
          />
        )}

        {step === "cycle_regularity" && (
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

        {step === "cycle_lengths" && (
          <div className="flex h-full flex-col justify-center gap-4">
            <h2 className="text-xl font-bold text-text-primary">{dict.onboarding.averageCycleLengthQuestion}</h2>
            <input
              type="number"
              value={survey.averageCycleLength}
              onChange={(e) => setSurvey((s) => ({ ...s, averageCycleLength: e.target.value }))}
              className="tap-target rounded-2xl border border-border bg-surface px-4 text-lg text-text-primary outline-none focus:border-primary"
            />
            <h2 className="mt-4 text-xl font-bold text-text-primary">{dict.onboarding.averagePeriodLengthQuestion}</h2>
            <input
              type="number"
              value={survey.averagePeriodLength}
              onChange={(e) => setSurvey((s) => ({ ...s, averagePeriodLength: e.target.value }))}
              className="tap-target rounded-2xl border border-border bg-surface px-4 text-lg text-text-primary outline-none focus:border-primary"
            />
          </div>
        )}

        {step === "last_period" && (
          <div className="flex h-full flex-col justify-center gap-4">
            <h2 className="text-xl font-bold text-text-primary">{dict.onboarding.lastPeriodQuestion}</h2>
            <input
              type="date"
              value={survey.lastPeriodDate}
              onChange={(e) => setSurvey((s) => ({ ...s, lastPeriodDate: e.target.value }))}
              className="tap-target rounded-2xl border border-border bg-surface px-4 text-lg text-text-primary outline-none focus:border-primary"
            />
          </div>
        )}

        {step === "typical_symptoms" && (
          <div className="flex h-full flex-col justify-center gap-4">
            <h2 className="text-xl font-bold text-text-primary">{dict.onboarding.typicalSymptomsQuestion}</h2>
            <div className="grid grid-cols-3 gap-2">
              {SYMPTOM_OPTIONS.map((sym) => (
                <IconChip
                  key={sym}
                  label={dict.cycle.symptoms[sym]}
                  active={survey.typicalSymptoms.includes(sym)}
                  onClick={() => setSurvey((s) => ({ ...s, typicalSymptoms: toggleArrayValue(s.typicalSymptoms, sym) }))}
                />
              ))}
            </div>
          </div>
        )}

        {step === "period_attitude" && (
          <ChoiceStep
            title={dict.onboarding.periodAttitudeQuestion}
            options={(["uncomfortable", "dislike", "want_to_learn", "comfortable"] as PeriodAttitude[]).map((v) => ({
              label: dict.onboarding.periodAttitude[v],
              value: v,
              onClick: () => setSurvey((s) => ({ ...s, periodAttitude: v })),
            }))}
            selected={survey.periodAttitude}
          />
        )}

        {step === "health_conditions" && (
          <div className="flex h-full flex-col justify-center gap-4">
            <h2 className="text-xl font-bold text-text-primary">{dict.onboarding.healthConditionsQuestion}</h2>
            <div className="grid grid-cols-2 gap-2">
              {HEALTH_CONDITION_OPTIONS.map((cond) => (
                <IconChip
                  key={cond}
                  label={dict.onboarding.healthConditions[cond]}
                  active={survey.healthConditions.includes(cond)}
                  onClick={() => setSurvey((s) => ({ ...s, healthConditions: toggleArrayValue(s.healthConditions, cond) }))}
                />
              ))}
            </div>
            {survey.healthConditions.includes("none") && (
              <input
                value={survey.healthConditionsOther}
                onChange={(e) => setSurvey((s) => ({ ...s, healthConditionsOther: e.target.value }))}
                placeholder={dict.onboarding.healthConditionsOtherPlaceholder}
                className="tap-target rounded-2xl border border-border bg-surface px-4 text-text-primary outline-none focus:border-primary"
              />
            )}
          </div>
        )}

        {step === "family_history" && (
          <ChoiceStep
            title={dict.onboarding.familyHistoryQuestion}
            options={[
              { label: dict.common.yes, value: "yes", onClick: () => setSurvey((s) => ({ ...s, familyHistory: true })) },
              { label: dict.common.no, value: "no", onClick: () => setSurvey((s) => ({ ...s, familyHistory: false })) },
            ]}
            selected={survey.familyHistory === null ? null : survey.familyHistory ? "yes" : "no"}
          />
        )}

        {step === "last_checkup" && (
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

        {step === "height_weight" && (
          <div className="flex h-full flex-col justify-center gap-4">
            <h2 className="text-xl font-bold text-text-primary">{dict.onboarding.heightWeightTitle}</h2>
            <label className="text-sm font-semibold text-text-secondary">{dict.onboarding.heightLabel}</label>
            <input
              type="number"
              value={survey.heightCm}
              onChange={(e) => setSurvey((s) => ({ ...s, heightCm: e.target.value }))}
              className="tap-target rounded-2xl border border-border bg-surface px-4 text-lg text-text-primary outline-none focus:border-primary"
            />
            <label className="text-sm font-semibold text-text-secondary">{dict.onboarding.weightLabel}</label>
            <input
              type="number"
              value={survey.weightKg}
              onChange={(e) => setSurvey((s) => ({ ...s, weightKg: e.target.value }))}
              className="tap-target rounded-2xl border border-border bg-surface px-4 text-lg text-text-primary outline-none focus:border-primary"
            />
          </div>
        )}

        {step === "notifications" && (
          <ChoiceStep
            title={dict.onboarding.notificationsQuestion}
            options={[
              { label: dict.common.yes, value: "yes", onClick: () => setSurvey((s) => ({ ...s, notificationsEnabled: true })) },
              { label: dict.common.no, value: "no", onClick: () => setSurvey((s) => ({ ...s, notificationsEnabled: false })) },
            ]}
            selected={survey.notificationsEnabled === null ? null : survey.notificationsEnabled ? "yes" : "no"}
          />
        )}

        {step === "analyzing" && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center animate-fade-in-up">
            <div className="h-14 w-14 animate-pulse rounded-full bg-primary-light" />
            <h2 className="text-xl font-bold text-text-primary">{dict.onboarding.analyzingTitle}</h2>
            <p className="text-text-secondary">{dict.onboarding.analyzingSubtitle}</p>
          </div>
        )}
      </div>

      {step !== "welcome" && step !== "analyzing" && (
        <div className="mt-8 flex items-center gap-3">
          {stepIndex > 0 && (
            <Button variant="ghost" onClick={goBack} disabled={submitting}>
              {dict.common.back}
            </Button>
          )}
          {step === "account_identifier" ? (
            <Button className="ml-auto" onClick={submitIdentifier} disabled={submitting || !canProceed()}>
              {dict.common.continueButton}
            </Button>
          ) : step === "privacy" ? (
            <Button className="ml-auto" onClick={goNext}>
              {dict.privacy.agreeButton}
            </Button>
          ) : (
            <Button className="ml-auto" onClick={goNext} disabled={!canProceed()}>
              {dict.common.next}
            </Button>
          )}
        </div>
      )}

      {step === "welcome" && (
        <div className="mt-8">
          <Button className="w-full !bg-white !text-primary-dark shadow-lg" onClick={goNext}>
            {dict.onboarding.startButton}
          </Button>
        </div>
      )}
    </div>
  );
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
    <div className="flex h-full flex-col justify-center gap-3">
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
