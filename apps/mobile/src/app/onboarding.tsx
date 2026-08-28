import { useState } from "react";
import { View, Text, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import clsx from "clsx";
import type { CycleRegularity, OnboardingProfile } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Button, ProgressBar, TextField } from "@/components/ui";

type Step = "welcome" | "language" | "age" | "pregnant" | "cycle" | "family" | "checkup";
const STEPS: Step[] = ["welcome", "language", "age", "pregnant", "cycle", "family", "checkup"];

interface SurveyState {
  age: string;
  isPregnant: boolean | null;
  cycleRegularity: CycleRegularity | null;
  familyHistory: boolean | null;
  lastCheckup: OnboardingProfile["lastCheckup"] | null;
}

export default function OnboardingScreen() {
  const { dict, language, setLanguage } = useI18n();
  const { applyMeResponse } = useSession();

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
      router.replace(isPregnant ? "/(tabs)/homiladorlik" : "/(tabs)/tsikl");
    } finally {
      setSubmitting(false);
    }
  }

  function canProceed(): boolean {
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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 px-6 py-4">
        {step !== "welcome" && (
          <View className="mb-6">
            <ProgressBar value={(stepIndex / (STEPS.length - 1)) * 100} />
          </View>
        )}

        <View className="flex-1 justify-center">
          {step === "welcome" && (
            <View className="items-center gap-6">
              {/* TODO: haqiqiy logotip — RN'da xom SVG'ni to'g'ridan-to'g'ri require
                  qilib bo'lmaydi (react-native-svg-transformer sozlanishi kerak).
                  Hozircha brend rangidagi belgi bilan almashtirildi. */}
              <View className="h-20 w-20 items-center justify-center rounded-full bg-primary">
                <Text className="text-3xl">🎗️</Text>
              </View>
              <Text className="text-center text-3xl font-extrabold text-text-primary">{dict.onboarding.welcomeTitle}</Text>
              <Text className="max-w-xs text-center text-text-secondary">{dict.onboarding.welcomeSubtitle}</Text>
            </View>
          )}

          {step === "language" && (
            <View className="items-center gap-4">
              <Text className="mb-2 text-xl font-bold text-text-primary">{dict.onboarding.languageTitle}</Text>
              <LangOption label="O'zbekcha" active={language === "uz"} onPress={() => setLanguage("uz")} />
              <LangOption label="Русский" active={language === "ru"} onPress={() => setLanguage("ru")} />
            </View>
          )}

          {step === "age" && (
            <View className="gap-4">
              <Text className="text-xl font-bold text-text-primary">{dict.onboarding.surveyTitle}</Text>
              <Text className="text-sm text-text-secondary">{dict.onboarding.surveyIntro}</Text>
              <Text className="mt-4 text-sm font-semibold text-text-secondary">{dict.onboarding.ageLabel}</Text>
              <TextField value={survey.age} onChangeText={(v) => setSurvey((s) => ({ ...s, age: v }))} keyboardType="numeric" placeholder="30" />
            </View>
          )}

          {step === "pregnant" && (
            <ChoiceStep
              title={dict.onboarding.pregnantQuestion}
              options={[
                { label: dict.common.yes, value: "yes", onPress: () => setSurvey((s) => ({ ...s, isPregnant: true })) },
                { label: dict.common.no, value: "no", onPress: () => setSurvey((s) => ({ ...s, isPregnant: false })) },
              ]}
              selected={survey.isPregnant === null ? null : survey.isPregnant ? "yes" : "no"}
            />
          )}

          {step === "cycle" && (
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

          {step === "family" && (
            <ChoiceStep
              title={dict.onboarding.familyHistoryQuestion}
              options={[
                { label: dict.common.yes, value: "yes", onPress: () => setSurvey((s) => ({ ...s, familyHistory: true })) },
                { label: dict.common.no, value: "no", onPress: () => setSurvey((s) => ({ ...s, familyHistory: false })) },
              ]}
              selected={survey.familyHistory === null ? null : survey.familyHistory ? "yes" : "no"}
            />
          )}

          {step === "checkup" && (
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
        </View>

        <View className="mt-8 flex-row items-center gap-3">
          {stepIndex > 0 && (
            <Button variant="ghost" onPress={goBack} disabled={submitting}>
              {dict.common.back}
            </Button>
          )}
          {step === "welcome" ? (
            <Button className="ml-auto" onPress={goNext}>
              {dict.onboarding.startButton}
            </Button>
          ) : step === "checkup" ? (
            <Button className="ml-auto" onPress={finish} disabled={submitting || !survey.lastCheckup}>
              {dict.onboarding.finishButton}
            </Button>
          ) : (
            <Button className="ml-auto" onPress={goNext} disabled={!canProceed()}>
              {dict.common.next}
            </Button>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function LangOption({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={clsx(
        "w-full max-w-xs rounded-2xl border-2 px-6 py-4",
        active ? "border-primary bg-primary-light" : "border-border bg-surface"
      )}
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
            "min-h-[48px] w-full justify-center rounded-2xl border-2 px-5 py-4",
            selected === opt.value ? "border-primary bg-primary-light" : "border-border bg-surface"
          )}
        >
          <Text className={clsx("text-base font-medium", selected === opt.value ? "text-primary-dark" : "text-text-primary")}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
