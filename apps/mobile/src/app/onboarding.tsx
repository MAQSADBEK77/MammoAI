import { createElement, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, type NativeSyntheticEvent, type NativeScrollEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import clsx from "clsx";
import type {
  CycleRegularity,
  Goal,
  HealthCondition,
  HeardAboutUs,
  IllustrationSlotKey,
  OnboardingProfile,
  PeriodAttitude,
  Symptom,
} from "@mammoai/shared";
import {
  ADULT_GOALS,
  MINOR_GOALS,
  goalToLandingTab,
  needsCycleInfo,
  needsHeightWeight,
  gradientStops,
  colors,
  gradients,
  formatUzPhoneInput,
  extractUzPhoneDigits,
} from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useIllustrations } from "@/lib/illustrations";
import { api } from "@/lib/api";
import { Button, IconChip, ProgressBar, TextField } from "@/components/ui";
import { Emoji } from "@/components/Emoji";
import { WelcomeHero } from "@/components/WelcomeHero";
// unDraw illyustratsiyalari (litsenziyasiz-erkin, tijorat uchun ochiq) — web versiyasi
// bilan bir xil fayllar (apps/web/public/illustrations/), lekin bu yerda
// react-native-svg-transformer orqali to'g'ridan-to'g'ri komponent sifatida import
// qilinadi (Metro statik import talab qiladi, shuning uchun dinamik require yo'q).
import SecureLoginIllustration from "../../assets/illustrations/secure-login.svg";
import GoalIllustration from "../../assets/illustrations/goal.svg";
import CalendarIllustration from "../../assets/illustrations/calendar.svg";
import MedicineIllustration from "../../assets/illustrations/medicine.svg";
import DoctorIllustration from "../../assets/illustrations/doctor.svg";
import NotificationsIllustration from "../../assets/illustrations/notifications.svg";
import MeditationIllustration from "../../assets/illustrations/meditation.svg";

type Step =
  | "welcome"
  | "language"
  | "account_choice"
  | "account_identifier"
  | "privacy"
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
  /** Ommaviy oferta shartlariga rozilik — "privacy" bosqichidagi katakcha. */
  agreedToOffer: boolean;
  heardAboutUs: HeardAboutUs | null;
  name: string;
  /** Foydalanuvchi endi yosh emas, tug'ilgan yilni tanlaydi (wheel-picker) — yosh shundan hisoblanadi. */
  birthYear: number;
  primaryGoal: Goal | null;
  cycleRegularity: CycleRegularity | null;
  averageCycleLength: string;
  averagePeriodLength: string;
  lastPeriodDate: string;
  /** "Bilmayman" bosilganda true — sana kiritish shart emasligini bildiradi. */
  lastPeriodUnknown: boolean;
  typicalSymptoms: Symptom[];
  /** "Bilmayman" bosilganda true — typicalSymptoms bo'sh saqlanadi. */
  typicalSymptomsUnknown: boolean;
  periodAttitude: PeriodAttitude | null;
  healthConditions: HealthCondition[];
  healthConditionsOther: string;
  familyHistory: boolean | "unknown" | null;
  lastCheckup: OnboardingProfile["lastCheckup"] | null;
  heightCm: string;
  weightKg: string;
  /** Bo'y/vazn wheel-picker'i uchun birlik tizimi — true bo'lsa fut/dyuym/funt ko'rsatiladi. */
  useImperialUnits: boolean;
  /** Imperial rejimdagi qiymatlar — metrikdan mustaqil saqlanadi; birliklar
   * almashtirilganda bir martagina o'giriladi (bu holat + submit paytida). */
  heightFeet: number;
  heightInches: number;
  weightLb: number;
  notificationsEnabled: boolean | null;
}

const INITIAL_SURVEY: SurveyState = {
  accountChoice: null,
  identifier: "+998",
  agreedToOffer: false,
  heardAboutUs: null,
  name: "",
  birthYear: 2005,
  primaryGoal: null,
  cycleRegularity: null,
  averageCycleLength: "28",
  averagePeriodLength: "5",
  lastPeriodDate: "",
  lastPeriodUnknown: false,
  typicalSymptoms: [],
  typicalSymptomsUnknown: false,
  periodAttitude: null,
  healthConditions: [],
  healthConditionsOther: "",
  familyHistory: null,
  lastCheckup: null,
  heightCm: "165",
  weightKg: "60",
  useImperialUnits: false,
  heightFeet: 5,
  heightInches: 5,
  weightLb: 132,
  notificationsEnabled: null,
};

const CURRENT_YEAR = new Date().getFullYear();
// Yosh o'rniga tug'ilgan yil so'raladi (wheel-picker) — 13-100 yosh oralig'iga mos yillar.
const BIRTH_YEARS = Array.from({ length: 88 }, (_, i) => CURRENT_YEAR - 100 + i);

// Bo'y/vazn wheel-picker'lari uchun qiymatlar oralig'i.
const HEIGHT_CM_OPTIONS = Array.from({ length: 121 }, (_, i) => 100 + i); // 100–220 sm
const WEIGHT_KG_OPTIONS = Array.from({ length: 171 }, (_, i) => 30 + i); // 30–200 kg
const HEIGHT_FEET_OPTIONS = Array.from({ length: 5 }, (_, i) => 3 + i); // 3–7 fut
const HEIGHT_INCHES_OPTIONS = Array.from({ length: 12 }, (_, i) => i); // 0–11 dyuym
const WEIGHT_LB_OPTIONS = Array.from({ length: 375 }, (_, i) => 66 + i); // 66–440 funt

function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cm / 2.54);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}
function feetInchesToCm(feet: number, inches: number): number {
  return Math.round((feet * 12 + inches) * 2.54);
}
function kgToLb(kg: number): number {
  return Math.round(kg * 2.20462);
}
function lbToKg(lb: number): number {
  return Math.round(lb / 2.20462);
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

// Har bir alomat/holat chipiga tezkor vizual belgi ("juda quruq matn" fikridan keyin).
const SYMPTOM_ICON: Record<Symptom, string> = {
  cramps: "🤕",
  headache: "🤯",
  bloating: "🎈",
  acne: "🔴",
  back_pain: "🦴",
  nausea: "🤢",
  breast_tenderness: "💗",
  insomnia: "🌙",
  fatigue: "😴",
  irritability: "😠",
  difficulty_concentrating: "💭",
};

const HEALTH_CONDITION_ICON: Record<HealthCondition, string> = {
  yeast_infection: "🍄",
  uti: "💧",
  bacterial_vaginosis: "🦠",
  pcos: "⭕",
  endometriosis: "🔴",
  fibroids: "🟣",
  unknown: "🤷",
  none: "✅",
};

// "Hayzingiz haqida qanday fikrdasiz?" javoblari oldida — til tanlash tugmalaridagi
// bayroqlar kabi, har bir javobga mos emoji (foydalanuvchi so'rovi).
const PERIOD_ATTITUDE_ICON: Record<PeriodAttitude, string> = {
  uncomfortable: "😣",
  dislike: "😕",
  want_to_learn: "📖",
  comfortable: "😊",
};

// Web versiyasi bilan bir xil (apps/web/src/app/onboarding/page.tsx) — har bir
// savol bosqichi uchun ikona + rang. MaterialCommunityIcons nomlari (emoji emas —
// profil va boshqa ekranlar bilan bir xil, saytdagi MUI ikonlariga mos uslubda).
// To'liq illyustratsiyasi bor bosqichlar (STEP_ILLUSTRATION) bu yerga kiritilmagan.
const STEP_ICON: Partial<Record<Step, string>> = {
  account_choice: "account-outline",
  account_identifier: "lock-outline",
  privacy: "shield-check-outline",
  name: "pencil-outline",
  age: "cake-variant-outline",
  cycle_regularity: "autorenew",
  typical_symptoms: "thermometer",
  family_history: "account-group-outline",
  height_weight: "scale-bathroom",
};

// Web versiyasi bilan bir xil (apps/web/src/app/onboarding/page.tsx) — mavjud bo'lsa,
// kichik emoji doira o'rniga to'liq illyustratsiya ko'rsatiladi.
const STEP_ILLUSTRATION: Partial<Record<Step, React.ComponentType<{ width?: number; height?: number }>>> = {
  account_identifier: SecureLoginIllustration,
  goal: GoalIllustration,
  cycle_lengths: CalendarIllustration,
  last_period: CalendarIllustration,
  health_conditions: MedicineIllustration,
  last_checkup: DoctorIllustration,
  notifications: NotificationsIllustration,
  period_attitude: MeditationIllustration,
};

const STEP_ICON_COLOR: Partial<Record<Step, string>> = {
  account_choice: colors.secondary,
  account_identifier: colors.secondary,
  privacy: colors.secondary,
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

function landingPath(goal: Goal): "/(tabs)/asosiy" | "/(tabs)/tekshiruvlar" {
  const tab = goalToLandingTab(goal);
  return tab === "checkups" ? "/(tabs)/tekshiruvlar" : "/(tabs)/asosiy";
}

export default function OnboardingScreen() {
  const { dict, language, setLanguage } = useI18n();
  const { applyMeResponse } = useSession();
  const { resolve: resolveIllustration } = useIllustrations();

  const [survey, setSurvey] = useState<SurveyState>(INITIAL_SURVEY);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Web'dagi kabi — effekt qayta ishga tushib qolsa `finish()` ikki marta
  // chaqirilmasin (masalan tez-tez qayta render bo'lishi mumkin bo'lgan holatlarda).
  const finishStartedRef = useRef(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  const age = CURRENT_YEAR - survey.birthYear;
  const isMinor = age > 0 && age < 18;

  const steps = useMemo<Step[]>(() => {
    const base: Step[] = [
      "welcome",
      "language",
      "account_choice",
      "account_identifier",
      "privacy",
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
      const res = await api.auth.start({ identifier: extractUzPhoneDigits(survey.identifier) ?? survey.identifier.trim(), language });
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
    setFinishError(null);
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
        familyHistory: survey.familyHistory === true,
        lastCheckup: survey.lastCheckup ?? "unknown",
        primaryGoal: survey.primaryGoal!,
        heardAboutUs: survey.heardAboutUs ?? "other",
        typicalSymptoms: survey.typicalSymptoms,
        periodAttitude: survey.periodAttitude,
        healthConditions: survey.healthConditions,
        healthConditionsOther: survey.healthConditionsOther || null,
        heightCm: survey.useImperialUnits ? feetInchesToCm(survey.heightFeet, survey.heightInches) : Number(survey.heightCm) || null,
        weightKg: survey.useImperialUnits ? lbToKg(survey.weightLb) : Number(survey.weightKg) || null,
        bloodType: null,
        notificationsEnabled: !!survey.notificationsEnabled,
      });
      applyMeResponse(res);
      router.replace(landingPath(survey.primaryGoal!));
    } catch {
      finishStartedRef.current = false;
      setFinishError(dict.common.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (step !== "analyzing" || finishStartedRef.current) return;
    finishStartedRef.current = true;
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // "Ha" bosilganda haqiqiy OS ruxsat so'rovi (expo-notifications) chiqadi —
  // avvalgi versiyada bu shunchaki ichki belgi (survey holati) edi, haqiqiy
  // ruxsat so'ralmasdan. OS ruxsatni allaqachon rad etgan bo'lsa, dialog qayta
  // chiqmaydi (tizim xotirasi) — natija shunga qarab "Yo'q" tanlangandek ko'rinadi.
  async function requestNotificationPermission(wantsEnabled: boolean) {
    if (!wantsEnabled) {
      setSurvey((s) => ({ ...s, notificationsEnabled: false }));
      return;
    }
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setSurvey((s) => ({ ...s, notificationsEnabled: status === "granted" }));
    } catch {
      setSurvey((s) => ({ ...s, notificationsEnabled: false }));
    }
  }

  function canProceed(): boolean {
    switch (step) {
      case "account_choice":
        return survey.accountChoice !== null;
      case "account_identifier":
        return extractUzPhoneDigits(survey.identifier) !== null;
      case "name":
        return survey.name.trim().length > 0;
      case "age":
        return age >= 13 && age <= 100;
      case "goal":
        return survey.primaryGoal !== null;
      case "cycle_regularity":
        return survey.cycleRegularity !== null;
      case "last_period":
        return survey.lastPeriodDate.length > 0 || survey.lastPeriodUnknown;
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
    <View style={{ flex: 1 }}>
      {step === "welcome" && (
        <LinearGradient colors={gradients.cycle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      )}
      <SafeAreaView className={clsx("flex-1", step !== "welcome" && "bg-background")}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 px-6 py-4">
        {step !== "welcome" && step !== "analyzing" && (
          <View className="mb-6">
            <ProgressBar value={(stepIndex / (steps.length - 1)) * 100} />
          </View>
        )}

        {/* Savol bosqichlarida matn endi tepada (belgidan darhol keyin) turadi —
            "justify-center" o'rtaga cho'zib yuborar edi. "welcome"/"analyzing"
            o'zining maxsus markazlashgan ko'rinishini saqlab qoladi. */}
        <ScrollView
          className="flex-1"
          contentContainerClassName={clsx("flex-grow gap-4", step === "welcome" || step === "analyzing" ? "justify-center" : "justify-start")}
        >
          {STEP_ILLUSTRATION[step] ? (
            <Animated.View key={`illustration-${step}`} entering={FadeIn.duration(350)} className="mb-1 items-center">
              {
                // "last_period" — bir oz soddalashtirilgan (kichikroq) ko'rinish.
                createElement(
                  resolveIllustration(`onboarding.${step}` as IllustrationSlotKey),
                  step === "last_period" ? { width: 120, height: 87 } : { width: 180, height: 130 }
                )
              }
            </Animated.View>
          ) : (
            STEP_ICON[step] && (
              <Animated.View key={`icon-${step}`} entering={FadeIn.duration(350)} className="mb-1 items-center">
                <LinearGradient
                  colors={gradientStops(STEP_ICON_COLOR[step]!)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" }}
                >
                  <MaterialCommunityIcons name={STEP_ICON[step] as never} size={40} color="#FFFFFF" />
                </LinearGradient>
              </Animated.View>
            )
          )}

          <Animated.View key={`content-${step}`} entering={FadeInUp.duration(400)} className="gap-4">
            {step === "welcome" && (
              <View className="items-center gap-6">
                <WelcomeHero title={dict.onboarding.welcomeTitle} subtitle={dict.onboarding.welcomeSubtitle} />
              </View>
            )}

          {step === "language" && (
            <View className="items-center gap-4">
              <Text className="text-center mb-2 text-xl font-bold text-text-primary">{dict.onboarding.languageTitle}</Text>
              <LangOption flag="🇺🇿" label="O'zbekcha (lotin)" active={language === "uz"} onPress={() => setLanguage("uz")} />
              <LangOption flag="🇺🇿" label="Ўзбекча (кирилл)" active={language === "uz-cyrl"} onPress={() => setLanguage("uz-cyrl")} />
              <LangOption flag="🇷🇺" label="Русский" active={language === "ru"} onPress={() => setLanguage("ru")} />
              <LangOption flag="🇺🇸" label="English" active={language === "en"} onPress={() => setLanguage("en")} />
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
                onChangeText={(v) => setSurvey((s) => ({ ...s, identifier: formatUzPhoneInput(v) }))}
                placeholder={dict.auth.identifierPlaceholder}
                keyboardType="phone-pad"
                icon={<MaterialCommunityIcons name="lock-outline" size={18} color="#9CA3AF" />}
              />
              {errorMessage && <Text className="text-sm text-danger">{errorMessage}</Text>}
            </View>
          )}

          {step === "privacy" && (
            <View className="gap-4">
              <Text className="text-center text-xl font-bold text-text-primary">{dict.privacy.offerTitle}</Text>
              <Text className="leading-relaxed text-text-secondary">{dict.privacy.offerIntro}</Text>
              <View className="gap-4 rounded-2xl border border-border bg-surface p-4">
                {dict.privacy.offerSections.map((section) => (
                  <View key={section.title}>
                    <Text className="mb-1 text-sm font-bold text-text-primary">{section.title}</Text>
                    {section.body.split("\n").map((line, i) => (
                      <Text key={i} className="leading-relaxed text-text-secondary">
                        {line}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
              <Pressable
                onPress={() => setSurvey((s) => ({ ...s, agreedToOffer: !s.agreedToOffer }))}
                className={clsx(
                  "flex-row items-start gap-3 rounded-2xl border-2 px-4 py-3",
                  survey.agreedToOffer ? "border-primary bg-primary-light" : "border-border bg-surface"
                )}
              >
                <MaterialCommunityIcons
                  name={survey.agreedToOffer ? "checkbox-marked" : "checkbox-blank-outline"}
                  size={22}
                  color={survey.agreedToOffer ? colors.primaryDark : colors.textMuted}
                />
                <Text className="flex-1 text-sm font-medium text-text-primary">{dict.privacy.offerCheckboxLabel}</Text>
              </Pressable>
            </View>
          )}

          {step === "name" && (
            <View className="gap-4">
              <Text className="text-center text-xl font-bold text-text-primary">{dict.onboarding.nameQuestion}</Text>
              <TextField value={survey.name} onChangeText={(v) => setSurvey((s) => ({ ...s, name: v }))} placeholder={dict.onboarding.namePlaceholder} />
            </View>
          )}

          {step === "age" && (
            <View className="gap-4">
              <Text className="text-center text-xl font-bold text-text-primary">{dict.onboarding.birthYearLabel}</Text>
              <WheelPicker options={BIRTH_YEARS} value={survey.birthYear} onChange={(v) => setSurvey((s) => ({ ...s, birthYear: v }))} />
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
              <View style={{ opacity: survey.lastPeriodUnknown ? 0.5 : 1 }} pointerEvents={survey.lastPeriodUnknown ? "none" : "auto"}>
                <TextField value={survey.lastPeriodDate} onChangeText={(v) => setSurvey((s) => ({ ...s, lastPeriodDate: v }))} placeholder="YYYY-MM-DD" />
              </View>
              <Pressable
                onPress={() =>
                  setSurvey((s) => ({ ...s, lastPeriodUnknown: !s.lastPeriodUnknown, lastPeriodDate: s.lastPeriodUnknown ? s.lastPeriodDate : "" }))
                }
                className={clsx(
                  "min-h-[48px] w-full justify-center rounded-2xl border-2 px-5 py-3 active:scale-[0.98]",
                  survey.lastPeriodUnknown ? "border-primary bg-primary-light" : "border-border bg-surface"
                )}
              >
                <Text className={clsx("text-center text-base font-medium", survey.lastPeriodUnknown ? "text-primary-dark" : "text-text-primary")}>
                  {dict.common.dontKnow}
                </Text>
              </Pressable>
            </View>
          )}

          {step === "typical_symptoms" && (
            <View className="gap-4">
              <Text className="text-center text-xl font-bold text-text-primary">{dict.onboarding.typicalSymptomsQuestion}</Text>
              <View className="flex-row flex-wrap gap-2">
                {SYMPTOM_OPTIONS.map((sym) => (
                  <View key={sym} style={{ width: "48%" }}>
                    <IconChip
                      label={dict.cycle.symptoms[sym]}
                      icon={<Emoji e={SYMPTOM_ICON[sym]} />}
                      active={survey.typicalSymptoms.includes(sym)}
                      onPress={() =>
                        setSurvey((s) => ({ ...s, typicalSymptoms: toggleArrayValue(s.typicalSymptoms, sym), typicalSymptomsUnknown: false }))
                      }
                    />
                  </View>
                ))}
                <View style={{ width: "48%" }}>
                  <IconChip
                    label={dict.common.dontKnow}
                    icon={<Emoji e="🤷" />}
                    active={survey.typicalSymptomsUnknown}
                    onPress={() => setSurvey((s) => ({ ...s, typicalSymptomsUnknown: !s.typicalSymptomsUnknown, typicalSymptoms: [] }))}
                  />
                </View>
              </View>
            </View>
          )}

          {step === "period_attitude" && (
            <ChoiceStep
              title={dict.onboarding.periodAttitudeQuestion}
              options={(["uncomfortable", "dislike", "want_to_learn", "comfortable"] as PeriodAttitude[]).map((v) => ({
                label: dict.onboarding.periodAttitude[v],
                value: v,
                icon: PERIOD_ATTITUDE_ICON[v],
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
                  <View key={cond} style={{ width: "48%" }}>
                    <IconChip
                      label={dict.onboarding.healthConditions[cond]}
                      icon={<Emoji e={HEALTH_CONDITION_ICON[cond]} />}
                      active={survey.healthConditions.includes(cond)}
                      onPress={() => setSurvey((s) => ({ ...s, healthConditions: toggleArrayValue(s.healthConditions, cond) }))}
                    />
                  </View>
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
                { label: dict.common.dontKnow, value: "unknown", onPress: () => setSurvey((s) => ({ ...s, familyHistory: "unknown" })) },
              ]}
              selected={survey.familyHistory === null ? null : survey.familyHistory === "unknown" ? "unknown" : survey.familyHistory ? "yes" : "no"}
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
            <View className="gap-5">
              <Text className="text-center text-xl font-bold text-text-primary">{dict.onboarding.heightWeightTitle}</Text>

              {/* Metrik/Imperial birlik tanlovi — bosilganda joriy qiymat bir martagina
                  boshqa birlikka o'giriladi, keyin har bir tizim o'z holatini saqlaydi. */}
              <View className="flex-row self-center rounded-full border border-border bg-surface p-1">
                <Pressable
                  onPress={() =>
                    setSurvey((s) =>
                      s.useImperialUnits
                        ? { ...s, useImperialUnits: false, heightCm: String(feetInchesToCm(s.heightFeet, s.heightInches)), weightKg: String(lbToKg(s.weightLb)) }
                        : s
                    )
                  }
                  className={clsx("rounded-full px-4 py-1.5", !survey.useImperialUnits && "bg-primary")}
                >
                  <Text className={clsx("text-sm font-semibold", !survey.useImperialUnits ? "text-white" : "text-text-secondary")}>
                    {dict.onboarding.unitsMetric}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    setSurvey((s) => {
                      if (s.useImperialUnits) return s;
                      const { feet, inches } = cmToFeetInches(Number(s.heightCm) || 165);
                      return { ...s, useImperialUnits: true, heightFeet: feet, heightInches: inches, weightLb: kgToLb(Number(s.weightKg) || 60) };
                    })
                  }
                  className={clsx("rounded-full px-4 py-1.5", survey.useImperialUnits && "bg-primary")}
                >
                  <Text className={clsx("text-sm font-semibold", survey.useImperialUnits ? "text-white" : "text-text-secondary")}>
                    {dict.onboarding.unitsImperial}
                  </Text>
                </Pressable>
              </View>

              <View className="gap-2">
                <Text className="text-center text-sm font-semibold text-text-secondary">{dict.onboarding.heightLabel}</Text>
                {survey.useImperialUnits ? (
                  <View className="w-full max-w-xs flex-row gap-3 self-center">
                    <WheelPicker
                      compact
                      options={HEIGHT_FEET_OPTIONS}
                      value={survey.heightFeet}
                      suffix={dict.onboarding.unitFeet}
                      onChange={(feet) => setSurvey((s) => ({ ...s, heightFeet: feet }))}
                    />
                    <WheelPicker
                      compact
                      options={HEIGHT_INCHES_OPTIONS}
                      value={survey.heightInches}
                      suffix={dict.onboarding.unitInches}
                      onChange={(inches) => setSurvey((s) => ({ ...s, heightInches: inches }))}
                    />
                  </View>
                ) : (
                  <WheelPicker
                    options={HEIGHT_CM_OPTIONS}
                    value={Number(survey.heightCm) || 165}
                    suffix={dict.onboarding.unitCm}
                    onChange={(v) => setSurvey((s) => ({ ...s, heightCm: String(v) }))}
                  />
                )}
              </View>

              <View className="gap-2">
                <Text className="text-center text-sm font-semibold text-text-secondary">{dict.onboarding.weightLabel}</Text>
                {survey.useImperialUnits ? (
                  <WheelPicker
                    options={WEIGHT_LB_OPTIONS}
                    value={survey.weightLb}
                    suffix={dict.onboarding.unitLb}
                    onChange={(lb) => setSurvey((s) => ({ ...s, weightLb: lb }))}
                  />
                ) : (
                  <WheelPicker
                    options={WEIGHT_KG_OPTIONS}
                    value={Number(survey.weightKg) || 60}
                    suffix={dict.onboarding.unitKg}
                    onChange={(v) => setSurvey((s) => ({ ...s, weightKg: String(v) }))}
                  />
                )}
              </View>
            </View>
          )}

          {step === "notifications" && (
            <View className="gap-3">
              {/* Namunaviy bildirishnoma kartasi — "yoqilsa nima ko'rinadi" degan
                  aniq tasavvur berish uchun. */}
              <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-light/50">
                  <Emoji e="🔔" />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-[11px] font-semibold text-text-muted">{dict.common.appName}</Text>
                  <Text className="text-sm font-semibold text-text-primary" numberOfLines={1}>
                    {dict.onboarding.notificationsSamplePreview}
                  </Text>
                </View>
              </View>
              <ChoiceStep
                title={dict.onboarding.notificationsQuestion}
                description={dict.onboarding.notificationsImportance}
                options={[
                  { label: dict.common.yes, value: "yes", onPress: () => void requestNotificationPermission(true) },
                  { label: dict.common.no, value: "no", onPress: () => void requestNotificationPermission(false) },
                ]}
                selected={survey.notificationsEnabled === null ? null : survey.notificationsEnabled ? "yes" : "no"}
              />
            </View>
          )}

          {step === "analyzing" && (
            <View className="items-center gap-4">
              {createElement(resolveIllustration("onboarding.analyzing"), { width: 180, height: 130 })}
              {finishError ? (
                <>
                  <Text className="text-center text-xl font-bold text-text-primary">{finishError}</Text>
                  <Button
                    onPress={() => {
                      finishStartedRef.current = true;
                      finish();
                    }}
                  >
                    {dict.common.retryButton}
                  </Button>
                </>
              ) : (
                <>
                  <Text className="text-center text-xl font-bold text-text-primary">{dict.onboarding.analyzingTitle}</Text>
                  <Text className="text-center text-text-secondary">{dict.onboarding.analyzingSubtitle}</Text>
                </>
              )}
            </View>
          )}
          </Animated.View>
        </ScrollView>

        {step === "welcome" ? (
          // Button'ning "primary" varianti doim gradient (LinearGradient) chizadi —
          // className orqali bekor qilib bo'lmaydi, shuning uchun bu yerda alohida
          // toza oq tugma qo'lda quriladi.
          <Pressable
            onPress={goNext}
            className="min-h-[52px] w-full items-center justify-center rounded-full bg-white active:scale-[0.98]"
            style={{ shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 }}
          >
            <Text className="text-base font-bold text-primary-dark">{dict.onboarding.startButton}</Text>
          </Pressable>
        ) : step !== "analyzing" ? (
          <View className="mt-4 flex-row items-center justify-between gap-3">
            {stepIndex > 0 ? (
              <Button variant="ghost" onPress={goBack} disabled={submitting}>
                {dict.common.back}
              </Button>
            ) : (
              <View />
            )}
            {step === "account_identifier" ? (
              <Button onPress={submitIdentifier} disabled={submitting || !canProceed()}>
                {dict.common.continueButton}
              </Button>
            ) : step === "privacy" ? (
              <Button onPress={goNext} disabled={!survey.agreedToOffer}>
                {dict.privacy.agreeButton}
              </Button>
            ) : (
              <Button onPress={goNext} disabled={!canProceed()}>
                {dict.common.next}
              </Button>
            )}
          </View>
        ) : null}
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// "Tug'ilgan yil" uchun — iOS'dagi native "wheel" tanlagichga o'xshab, ScrollView'ning
// `snapToInterval`i orqali (qo'shimcha kutubxonasiz — RN buni o'zi qo'llab-quvvatlaydi).
const WHEEL_ITEM_HEIGHT = 48;
const WHEEL_VISIBLE_ROWS = 5;

function WheelPicker({
  options,
  value,
  onChange,
  suffix,
  compact,
}: {
  options: number[];
  value: number;
  onChange: (value: number) => void;
  /** Har bir qatorga qo'shiladigan birlik yorlig'i (masalan "sm", "kg", "fut"). */
  suffix?: string;
  /** Ikkita ustunni yonma-yon joylashtirish uchun (fut+dyuym) — markazlashtirilgan
   * `max-w-xs` o'rniga to'liq enini egallaydi, tashqi flex konteyner eni belgilaydi. */
  compact?: boolean;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const padCount = Math.floor(WHEEL_VISIBLE_ROWS / 2);

  // Faqat birinchi renderda — tashqi `value`ga mos qatorga scroll qilamiz.
  useEffect(() => {
    const idx = options.indexOf(value);
    if (idx === -1) return;
    const id = requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: idx * WHEEL_ITEM_HEIGHT, animated: false }));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.min(Math.max(Math.round(e.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT), 0), options.length - 1);
    const picked = options[idx];
    if (picked !== value) onChange(picked);
  }

  return (
    <View className={clsx("relative w-full self-center", !compact && "max-w-xs")} style={{ height: WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ROWS }}>
      {/* Markaziy tanlangan qatorni ko'rsatuvchi doimiy band — scroll ustida. */}
      <View
        pointerEvents="none"
        className="absolute inset-x-0 z-10 rounded-2xl border-2"
        style={{ height: WHEEL_ITEM_HEIGHT, top: (WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ROWS) / 2 - WHEEL_ITEM_HEIGHT / 2, borderColor: colors.primary, backgroundColor: `${colors.primaryLight}40` }}
      />
      {/* Yuqori/pastki xiralashish — iOS wheel'idagi kabi (LinearGradient, mask-image RN'da yo'q). */}
      <LinearGradient
        pointerEvents="none"
        colors={[colors.background, `${colors.background}00`]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: WHEEL_ITEM_HEIGHT * 1.5, zIndex: 5 }}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[`${colors.background}00`, colors.background]}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: WHEEL_ITEM_HEIGHT * 1.5, zIndex: 5 }}
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumEnd}
      >
        <View style={{ height: WHEEL_ITEM_HEIGHT * padCount }} />
        {options.map((opt) => (
          <View key={opt} style={{ height: WHEEL_ITEM_HEIGHT }} className="flex-row items-center justify-center gap-1">
            <Text className="text-lg font-semibold text-text-primary">{opt}</Text>
            {suffix && <Text className="text-sm font-normal text-text-muted">{suffix}</Text>}
          </View>
        ))}
        <View style={{ height: WHEEL_ITEM_HEIGHT * padCount }} />
      </ScrollView>
    </View>
  );
}

function LangOption({ flag, label, active, onPress }: { flag: string; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={clsx(
        "w-full max-w-xs flex-row items-center gap-3 rounded-3xl px-6 py-4 active:scale-[0.98]",
        active ? "bg-primary" : "bg-surface"
      )}
      style={
        active
          ? { shadowColor: "#F43F7F", shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 }
          : { shadowColor: "#1F2937", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 }
      }
    >
      <Emoji e={flag} size={22} />
      <Text className={clsx("text-lg font-semibold", active ? "text-white" : "text-text-primary")}>{label}</Text>
    </Pressable>
  );
}

function ChoiceStep({
  title,
  description,
  options,
  selected,
}: {
  title: string;
  /** Ixtiyoriy — savol nima uchun muhimligini tushuntiruvchi qo'shimcha matn. */
  description?: string;
  /** `icon` — ixtiyoriy emoji, til tanlash tugmalaridagi bayroq kabi yorliq oldida ko'rsatiladi. */
  options: { label: string; value: string; icon?: string; onPress: () => void }[];
  selected: string | null;
}) {
  return (
    <View className="gap-3">
      <Text className="mb-2 text-xl font-bold text-text-primary">{title}</Text>
      {description && <Text className="-mt-3 mb-1 text-sm leading-relaxed text-text-secondary">{description}</Text>}
      {options.map((opt) => {
        const active = selected === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={opt.onPress}
            className={clsx(
              "min-h-[48px] w-full flex-row items-center gap-3 rounded-3xl border-2 px-5 py-4 active:scale-[0.98]",
              active ? "border-primary bg-primary-light" : "border-border bg-surface"
            )}
            style={active ? { shadowColor: "#F43F7F", shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 } : undefined}
          >
            {opt.icon && <Emoji e={opt.icon} />}
            <Text className={clsx("flex-1 text-base font-medium", active ? "text-primary-dark" : "text-text-primary")}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
