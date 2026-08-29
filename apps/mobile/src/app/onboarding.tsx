import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Lock } from "lucide-react-native";
import clsx from "clsx";
import type {
  CycleRegularity,
  Goal,
  HealthCondition,
  HeardAboutUs,
  OnboardingProfile,
  PeriodAttitude,
  Symptom,
} from "@mammoai/shared";
import { ADULT_GOALS, MINOR_GOALS, goalToLandingTab, needsCycleInfo, needsHeightWeight, gradientStops, colors } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Button, IconChip, ProgressBar, TextField } from "@/components/ui";
import { WelcomeHero } from "@/components/WelcomeHero";

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

// Web versiyasi bilan bir xil (apps/web/src/app/onboarding/page.tsx) — har bir
// savol bosqichi uchun emoji ikona + rang.
const STEP_ICON: Partial<Record<Step, string>> = {
  language: "🌐",
  account_choice: "👤",
  account_identifier: "🔐",
  privacy: "🛡️",
  heard_about_us: "💬",
  name: "✍️",
  age: "🎂",
  goal: "🎯",
  cycle_regularity: "🔄",
  cycle_lengths: "📏",
  last_period: "🩸",
  typical_symptoms: "🤒",
  period_attitude: "💭",
  health_conditions: "🩺",
  family_history: "🧬",
  last_checkup: "🗓️",
  height_weight: "⚖️",
  notifications: "🔔",
};

const STEP_ICON_COLOR: Partial<Record<Step, string>> = {
  language: colors.secondary,
  account_choice: colors.secondary,
  account_identifier: colors.secondary,
  privacy: colors.secondary,
  heard_about_us: colors.secondary,
  name: colors.secondary,
  age: colors.secondary,
  goal: colors.primary,
  cycle_regularity: colors.primary,
  cycle_lengths: colors.primary,
  last_period: colors.primary,
  typical_symptoms: colors.primary,
  period_attitude: colors.primary,
  health_conditions: colors.accent,
  family_history: colors.accent,
  last_checkup: colors.accent,
  height_weight: colors.accent,
  notifications: colors.primary,
};

function landingPath(goal: Goal): "/(tabs)/tsikl" | "/(tabs)/homiladorlik" | "/(tabs)/tekshiruvlar" {
  const tab = goalToLandingTab(goal);
  return tab === "cycle" ? "/(tabs)/tsikl" : tab === "pregnancy" ? "/(tabs)/homiladorlik" : "/(tabs)/tekshiruvlar";
}

export default function OnboardingScreen() {
  const { dict, language, setLanguage } = useI18n();
  const { applyMeResponse } = useSession();

  const [survey, setSurvey] = useState<SurveyState>(INITIAL_SURVEY);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const age = Number(survey.age);
  const isMinor = age > 0 && age < 18;

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
      tail.push("cycle_regularity", "cycle_lengths", "last_period", "typical_symptoms", "period_attitude", "health_conditions");
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
    <SafeAreaView className={clsx("flex-1", step === "welcome" ? "bg-primary" : "bg-background")}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 px-6 py-4">
        {step !== "welcome" && step !== "analyzing" && (
          <View className="mb-6">
            <ProgressBar value={(stepIndex / (steps.length - 1)) * 100} />
          </View>
        )}

        <ScrollView className="flex-1" contentContainerClassName="flex-grow justify-center gap-4">
          {STEP_ICON[step] && (
            <Animated.View key={`icon-${step}`} entering={FadeIn.duration(350)} className="mb-1 items-center">
              <LinearGradient
                colors={gradientStops(STEP_ICON_COLOR[step]!)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ fontSize: 30 }}>{STEP_ICON[step]}</Text>
              </LinearGradient>
            </Animated.View>
          )}

          <Animated.View key={`content-${step}`} entering={FadeInUp.duration(400)} className="gap-4">
            {step === "welcome" && <WelcomeHero title={dict.onboarding.welcomeTitle} subtitle={dict.onboarding.welcomeSubtitle} />}

          {step === "language" && (
            <View className="items-center gap-4">
              <Text className="text-center mb-2 text-xl font-bold text-text-primary">{dict.onboarding.languageTitle}</Text>
              <LangOption label="O'zbekcha" active={language === "uz"} onPress={() => setLanguage("uz")} />
              <LangOption label="Русский" active={language === "ru"} onPress={() => setLanguage("ru")} />
            </View>
          )}

          {step === "account_choice" && (
            <ChoiceStep
              title={dict.onboarding.surveyTitle}
              options={[
                { label: dict.auth.createAccount, value: "create", onPress: () => setSurvey((s) => ({ ...s, accountChoice: "create" })) },
                { label: dict.auth.haveAccount, value: "login", onPress: () => setSurvey((s) => ({ ...s, accountChoice: "login" })) },
              ]}
              selected={survey.accountChoice}
            />
          )}

          {step === "account_identifier" && (
            <View className="gap-4">
              <Text className="text-center text-xl font-bold text-text-primary">
                {survey.accountChoice === "login" ? dict.auth.loginIdentifierTitle : dict.auth.createIdentifierTitle}
              </Text>
              <TextField
                value={survey.identifier}
                onChangeText={(v) => setSurvey((s) => ({ ...s, identifier: v }))}
                placeholder={dict.auth.identifierPlaceholder}
                icon={<Lock size={18} color="#9CA3AF" />}
              />
              {errorMessage && <Text className="text-sm text-danger">{errorMessage}</Text>}
            </View>
          )}

          {step === "privacy" && (
            <View className="gap-4">
              <Text className="text-center text-xl font-bold text-text-primary">{dict.privacy.title}</Text>
              <Text className="leading-relaxed text-text-secondary">{dict.privacy.body}</Text>
            </View>
          )}

          {step === "heard_about_us" && (
            <ChoiceStep
              title={dict.onboarding.heardAboutUsTitle}
              options={(["social_media", "friend", "doctor", "app_store", "other"] as HeardAboutUs[]).map((v) => ({
                label: dict.onboarding.heardAboutUs[v],
                value: v,
                onPress: () => setSurvey((s) => ({ ...s, heardAboutUs: v })),
              }))}
              selected={survey.heardAboutUs}
            />
          )}

          {step === "name" && (
            <View className="gap-4">
              <Text className="text-center text-xl font-bold text-text-primary">{dict.onboarding.nameQuestion}</Text>
              <TextField value={survey.name} onChangeText={(v) => setSurvey((s) => ({ ...s, name: v }))} placeholder={dict.onboarding.namePlaceholder} />
            </View>
          )}

          {step === "age" && (
            <View className="gap-4">
              <Text className="text-center text-xl font-bold text-text-primary">{dict.onboarding.ageLabel}</Text>
              <TextField value={survey.age} onChangeText={(v) => setSurvey((s) => ({ ...s, age: v }))} keyboardType="numeric" placeholder="30" />
            </View>
          )}

          {step === "goal" && (
            <ChoiceStep
              title={dict.onboarding.goalTitle}
              options={goalOptions.map((g) => ({
                label: dict.onboarding.goals[g],
                value: g,
                onPress: () => setSurvey((s) => ({ ...s, primaryGoal: g })),
              }))}
              selected={survey.primaryGoal}
            />
          )}

          {step === "cycle_regularity" && (
            <ChoiceStep
              title={dict.onboarding.cycleRegularityQuestion}
              options={[
                { label: dict.onboarding.cycleRegular, value: "regular", onPress: () => setSurvey((s) => ({ ...s, cycleRegularity: "regular" })) },
                { label: dict.onboarding.cycleIrregular, value: "irregular", onPress: () => setSurvey((s) => ({ ...s, cycleRegularity: "irregular" })) },
                { label: dict.common.dontKnow, value: "unknown", onPress: () => setSurvey((s) => ({ ...s, cycleRegularity: "unknown" })) },
              ]}
              selected={survey.cycleRegularity}
            />
          )}

          {step === "cycle_lengths" && (
            <View className="gap-4">
              <Text className="text-center text-xl font-bold text-text-primary">{dict.onboarding.averageCycleLengthQuestion}</Text>
              <TextField value={survey.averageCycleLength} onChangeText={(v) => setSurvey((s) => ({ ...s, averageCycleLength: v }))} keyboardType="numeric" />
              <Text className="text-center mt-4 text-xl font-bold text-text-primary">{dict.onboarding.averagePeriodLengthQuestion}</Text>
              <TextField value={survey.averagePeriodLength} onChangeText={(v) => setSurvey((s) => ({ ...s, averagePeriodLength: v }))} keyboardType="numeric" />
            </View>
          )}

          {step === "last_period" && (
            <View className="gap-4">
              <Text className="text-center text-xl font-bold text-text-primary">{dict.onboarding.lastPeriodQuestion}</Text>
              <TextField value={survey.lastPeriodDate} onChangeText={(v) => setSurvey((s) => ({ ...s, lastPeriodDate: v }))} placeholder="YYYY-MM-DD" />
            </View>
          )}

          {step === "typical_symptoms" && (
            <View className="gap-4">
              <Text className="text-center text-xl font-bold text-text-primary">{dict.onboarding.typicalSymptomsQuestion}</Text>
              <View className="flex-row flex-wrap gap-2">
                {SYMPTOM_OPTIONS.map((sym) => (
                  <IconChip
                    key={sym}
                    label={dict.cycle.symptoms[sym]}
                    active={survey.typicalSymptoms.includes(sym)}
                    onPress={() => setSurvey((s) => ({ ...s, typicalSymptoms: toggleArrayValue(s.typicalSymptoms, sym) }))}
                  />
                ))}
              </View>
            </View>
          )}

          {step === "period_attitude" && (
            <ChoiceStep
              title={dict.onboarding.periodAttitudeQuestion}
              options={(["uncomfortable", "dislike", "want_to_learn", "comfortable"] as PeriodAttitude[]).map((v) => ({
                label: dict.onboarding.periodAttitude[v],
                value: v,
                onPress: () => setSurvey((s) => ({ ...s, periodAttitude: v })),
              }))}
              selected={survey.periodAttitude}
            />
          )}

          {step === "health_conditions" && (
            <View className="gap-4">
              <Text className="text-center text-xl font-bold text-text-primary">{dict.onboarding.healthConditionsQuestion}</Text>
              <View className="flex-row flex-wrap gap-2">
                {HEALTH_CONDITION_OPTIONS.map((cond) => (
                  <IconChip
                    key={cond}
                    label={dict.onboarding.healthConditions[cond]}
                    active={survey.healthConditions.includes(cond)}
                    onPress={() => setSurvey((s) => ({ ...s, healthConditions: toggleArrayValue(s.healthConditions, cond) }))}
                  />
                ))}
              </View>
              {survey.healthConditions.includes("none") && (
                <TextField
                  value={survey.healthConditionsOther}
                  onChangeText={(v) => setSurvey((s) => ({ ...s, healthConditionsOther: v }))}
                  placeholder={dict.onboarding.healthConditionsOtherPlaceholder}
                />
              )}
            </View>
          )}

          {step === "family_history" && (
            <ChoiceStep
              title={dict.onboarding.familyHistoryQuestion}
              options={[
                { label: dict.common.yes, value: "yes", onPress: () => setSurvey((s) => ({ ...s, familyHistory: true })) },
                { label: dict.common.no, value: "no", onPress: () => setSurvey((s) => ({ ...s, familyHistory: false })) },
              ]}
              selected={survey.familyHistory === null ? null : survey.familyHistory ? "yes" : "no"}
            />
          )}

          {step === "last_checkup" && (
            <ChoiceStep
              title={dict.onboarding.lastCheckupQuestion}
              options={[
                { label: dict.onboarding.checkupRecent, value: "recent", onPress: () => setSurvey((s) => ({ ...s, lastCheckup: "recent" })) },
                { label: dict.onboarding.checkupOverYear, value: "over_year", onPress: () => setSurvey((s) => ({ ...s, lastCheckup: "over_year" })) },
                { label: dict.onboarding.checkupNever, value: "never", onPress: () => setSurvey((s) => ({ ...s, lastCheckup: "never" })) },
                { label: dict.common.dontKnow, value: "unknown", onPress: () => setSurvey((s) => ({ ...s, lastCheckup: "unknown" })) },
              ]}
              selected={survey.lastCheckup}
            />
          )}

          {step === "height_weight" && (
            <View className="gap-4">
              <Text className="text-center text-xl font-bold text-text-primary">{dict.onboarding.heightWeightTitle}</Text>
              <Text className="text-sm font-semibold text-text-secondary">{dict.onboarding.heightLabel}</Text>
              <TextField value={survey.heightCm} onChangeText={(v) => setSurvey((s) => ({ ...s, heightCm: v }))} keyboardType="numeric" />
              <Text className="text-sm font-semibold text-text-secondary">{dict.onboarding.weightLabel}</Text>
              <TextField value={survey.weightKg} onChangeText={(v) => setSurvey((s) => ({ ...s, weightKg: v }))} keyboardType="numeric" />
            </View>
          )}

          {step === "notifications" && (
            <ChoiceStep
              title={dict.onboarding.notificationsQuestion}
              options={[
                { label: dict.common.yes, value: "yes", onPress: () => setSurvey((s) => ({ ...s, notificationsEnabled: true })) },
                { label: dict.common.no, value: "no", onPress: () => setSurvey((s) => ({ ...s, notificationsEnabled: false })) },
              ]}
              selected={survey.notificationsEnabled === null ? null : survey.notificationsEnabled ? "yes" : "no"}
            />
          )}

          {step === "analyzing" && (
            <View className="items-center gap-4">
              <View className="h-14 w-14 rounded-full bg-primary-light" />
              <Text className="text-center text-xl font-bold text-text-primary">{dict.onboarding.analyzingTitle}</Text>
              <Text className="text-center text-text-secondary">{dict.onboarding.analyzingSubtitle}</Text>
            </View>
          )}
          </Animated.View>
        </ScrollView>

        {step === "welcome" ? (
          <Button onPress={goNext} className="!bg-white shadow-lg">
            <Text className="text-base font-semibold text-primary-dark">{dict.onboarding.startButton}</Text>
          </Button>
        ) : step !== "analyzing" ? (
          <View className="mt-4 flex-row items-center gap-3">
            {stepIndex > 0 && (
              <Button variant="ghost" onPress={goBack} disabled={submitting}>
                {dict.common.back}
              </Button>
            )}
            <View className="ml-auto">
              {step === "account_identifier" ? (
                <Button onPress={submitIdentifier} disabled={submitting || !canProceed()}>
                  {dict.common.continueButton}
                </Button>
              ) : step === "privacy" ? (
                <Button onPress={goNext}>{dict.privacy.agreeButton}</Button>
              ) : (
                <Button onPress={goNext} disabled={!canProceed()}>
                  {dict.common.next}
                </Button>
              )}
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function LangOption({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={clsx("w-full max-w-xs rounded-2xl border-2 px-6 py-4", active ? "border-primary bg-primary-light" : "border-border bg-surface")}
    >
      <Text className={clsx("text-center text-lg font-semibold", active ? "text-primary-dark" : "text-text-primary")}>{label}</Text>
    </Pressable>
  );
}

function ChoiceStep({
  title,
  options,
  selected,
}: {
  title: string;
  options: { label: string; value: string; onPress: () => void }[];
  selected: string | null;
}) {
  return (
    <View className="gap-3">
      <Text className="mb-2 text-xl font-bold text-text-primary">{title}</Text>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={opt.onPress}
          className={clsx(
            "min-h-[48px] w-full justify-center rounded-2xl border-2 px-5 py-4 active:scale-[0.98]",
            selected === opt.value ? "border-primary bg-primary-light" : "border-border bg-surface"
          )}
        >
          <Text className={clsx("text-base font-medium", selected === opt.value ? "text-primary-dark" : "text-text-primary")}>{opt.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
