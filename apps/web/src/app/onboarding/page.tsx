"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  colors,
  formatUzPhoneInput,
  extractUzPhoneDigits,
} from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useIllustrations } from "@/lib/illustrations";
import { api } from "@/lib/api";
import { Button, IconChip, ProgressBar } from "@/components/ui";
import { Emoji } from "@/components/Emoji";
import { Lottie } from "lottie-react";
import {
  LockOutlined,
  PersonOutlined,
  ShieldOutlined,
  EditOutlined,
  CakeOutlined,
  AutorenewOutlined,
  SickOutlined,
  FamilyRestroomOutlined,
  MonitorWeightOutlined,
} from "@mui/icons-material";
import clsx from "clsx";

type StepIconComponent = typeof LockOutlined;

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
  /** Ommaviy oferta shartlariga rozilik — "privacy" bosqichidagi katagcha. */
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
  /** Imperial rejimdagi qiymatlar — metrikdan mustaqil saqlanadi (har scroll'da
   * qayta-qayta o'girishdan kelib chiqadigan "sakrash"ning oldini olish uchun);
   * birliklar almashtirilganda bir martagina o'giriladi (bu holat + submit paytida). */
  heightFeet: number;
  heightInches: number;
  weightLb: number;
  notificationsEnabled: boolean | null;
}

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

// Har bir savol bosqichi uchun ikona + rang — "registratsiya juda quruq
// ko'rinadi" degan fikrdan keyin har bir ekranga bittadan vizual urg'u qo'shish
// uchun (welcome/analyzing o'zining maxsus ko'rinishiga ega, shu yerda kerak emas).
// MUI ikonlari ishlatiladi (emoji emas — platformalar orasida bir xil, saytning
// qolgan qismi bilan bir xil uslubda ko'rinadi). To'liq illyustratsiyasi bor
// bosqichlar (STEP_ILLUSTRATION) bu yerga kiritilmagan — ular ustunroq ko'rsatiladi.
const STEP_ICON: Partial<Record<Step, StepIconComponent>> = {
  account_choice: PersonOutlined,
  account_identifier: LockOutlined,
  privacy: ShieldOutlined,
  name: EditOutlined,
  age: CakeOutlined,
  cycle_regularity: AutorenewOutlined,
  typical_symptoms: SickOutlined,
  family_history: FamilyRestroomOutlined,
  height_weight: MonitorWeightOutlined,
};

// Har bir bosqich uchun to'liq illyustratsiya (unDraw, litsenziyasiz-erkin, tijorat
// uchun ochiq — https://undraw.co) — mavjud bo'lsa, kichik emoji doira o'rniga shu
// ko'rsatiladi. Haqiqiy odam fotosurati emas (roziliksiz/litsenziyasiz muammo
// bo'lardi), lekin "quruq matn" o'rniga chizilgan sifatli vizual taassurot beradi.
const STEP_ILLUSTRATION: Partial<Record<Step, string>> = {
  account_identifier: "secure-login",
  goal: "goal",
  cycle_lengths: "calendar",
  last_period: "calendar",
  health_conditions: "medicine",
  last_checkup: "doctor",
  notifications: "notifications",
  period_attitude: "meditation",
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

/** STEP_ICON_COLOR'dagi rang qiymatini public/animations/aura-*.json fayl nomiga o'giradi. */
function auraName(color: string): "primary" | "secondary" | "accent" {
  if (color === colors.secondary) return "secondary";
  if (color === colors.accent) return "accent";
  return "primary";
}

function landingPath(goal: Goal): string {
  const tab = goalToLandingTab(goal);
  return tab === "checkups" ? "/tekshiruvlar" : "/asosiy";
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

export default function OnboardingPage() {
  const { dict, language, setLanguage } = useI18n();
  const { applyMeResponse } = useSession();
  const { resolve: resolveIllustration } = useIllustrations();
  const router = useRouter();

  const [survey, setSurvey] = useState<SurveyState>(INITIAL_SURVEY);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // "Analyzing" effekti React StrictMode'da (dev rejimida) ataylab ikki marta
  // ishga tushirilishi mumkin — bu ref shu tufayli `finish()` ikki marta (parallel
  // ravishda) chaqirilib, onboarding ikki marta yuborilishi va natijada redirect
  // "yarim yo'lda" osilib qolishining oldini oladi ("tahlil qilinmoqda"da abadiy
  // qolib ketish xatosi shundan edi).
  const finishStartedRef = useRef(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  const age = CURRENT_YEAR - survey.birthYear;
  const isMinor = age > 0 && age < 18;

  // Bosqichlar ro'yxati maqsad/yoshga qarab dinamik shakllanadi (App.pdf §7-10).
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
      // Xatolik bo'lsa foydalanuvchi "tahlil qilinmoqda" ekranida abadiy
      // osilib qolmasin — xato ko'rsatiladi va qayta urinish imkoni beriladi.
      finishStartedRef.current = false;
      setFinishError(dict.common.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  // "Tahlil qilinmoqda" bosqichiga yetganda avtomatik yakunlaymiz — bu "mount'da
  // fetch" naqshi emas, balki foydalanuvchi shu bosqichga yetganda bir martalik
  // yakunlovchi amal, shuning uchun ataylab qoldirilgan.
  useEffect(() => {
    if (step !== "analyzing" || finishStartedRef.current) return;
    finishStartedRef.current = true;
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // "Ha" bosilganda haqiqiy brauzer ruxsat so'rovi (Notification.requestPermission)
  // chiqadi — avvalgi versiyada bu shunchaki ichki belgi (survey holati) edi,
  // haqiqiy OS/brauzer ruxsati so'ralmasdan. Brauzer ruxsatni allaqachon rad etgan
  // bo'lsa, dialog qayta chiqmaydi (brauzer xotirasi) — natija shunga qarab kelib,
  // "Yo'q" tanlangandek ko'rinadi (implicit signal, alohida xabar shart emas).
  async function requestNotificationPermission(wantsEnabled: boolean) {
    if (!wantsEnabled || typeof window === "undefined" || !("Notification" in window)) {
      setSurvey((s) => ({ ...s, notificationsEnabled: false }));
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setSurvey((s) => ({ ...s, notificationsEnabled: permission === "granted" }));
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
    <div
      className={clsx(
        "mx-auto flex max-w-md flex-col px-6 pt-8",
        // Pastki masofa avvalgi py-8'dan (32px) ATAYLAB kattaroq — mobil brauzerning
        // pastki asboblar paneli (Safari/Chrome) Orqaga/Keyingi tugmasiga "yopishib"
        // qolmasligi uchun. env(safe-area-inset-bottom) PWA/notch'li qurilmada
        // qo'shimcha real bo'shliq beradi, oddiy brauzerda 0 bo'lib, 3rem'ning o'zi qoladi.
        "pb-[calc(env(safe-area-inset-bottom)+3rem)]",
        // Balandlik hamma bosqichda (shu jumladan "welcome"da ham) viewport'ga QATʼIY
        // tenglashtiriladi (h-dvh), ichkarida flex-1 orqali taqsimlanadi — shu orqali
        // "Boshlaymiz"/"Keyingi" tugmasi doim ekranning eng pastida, ilova bo'ylab
        // hamma joydagi kabi "yopishgan" holda qoladi (avval min-h-dvh + justify-center
        // tugmani logo/sarlavha bilan bitta ustunga markazlashtirib, ekran o'rtasiga
        // olib chiqib qo'yardi).
        step === "welcome" ? "h-dvh bg-aurora-cycle" : "h-dvh bg-background"
      )}
    >
      {step !== "welcome" && step !== "analyzing" && (
        <div className="mb-6 shrink-0">
          <ProgressBar value={(stepIndex / (steps.length - 1)) * 100} />
        </div>
      )}

      <div key={step} className={clsx("animate-fade-in-up flex flex-1 flex-col", step !== "welcome" && "overflow-y-auto")}>
        {STEP_ILLUSTRATION[step] ? (
          <div className="mb-4 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG, next/image optimizatsiyasi kerak emas */}
            <img
              src={resolveIllustration(`onboarding.${step}` as IllustrationSlotKey)}
              alt=""
              className={clsx("w-auto", step === "last_period" ? "h-24" : "h-36")}
            />
          </div>
        ) : (
          STEP_ICON[step] && (
            <div className="mb-5 flex justify-center">
              <div className="relative flex h-44 w-44 items-center justify-center">
                {/* O'zimiz yasagan Lottie ("nafas olayotgan" halqa-animatsiya) —
                    uchinchi tomon fayl emas, generatori: apps/web/scripts/
                    generate-onboarding-animations.py. Rang STEP_ICON_COLOR'ga mos. */}
                {/* MUHIM: `className="absolute inset-0"` emas — lottie-react o'zining
                    ".lottie-display{position:relative}" qoidasini Tailwind'ning
                    ".absolute"idan KEYIN yuklaydi va uni bekor qiladi, natijada bu
                    flex ichida ODDIY qatorga aylanib, ikonkani chetga surib yuborardi.
                    Inline `style` har doim g'olib chiqadi — shuning uchun shu yerda. */}
                <Lottie
                  src={`/animations/aura-${auraName(STEP_ICON_COLOR[step]!)}.json`}
                  loop
                  autoplay
                  style={{ position: "absolute", inset: 0 }}
                />
                {(() => {
                  const StepIcon = STEP_ICON[step]!;
                  return <StepIcon sx={{ fontSize: 42, color: "#fff", position: "relative" }} />;
                })()}
              </div>
            </div>
          )
        )}
        {step === "welcome" && (
          // Tugma endi logo/sarlavha bilan bitta markazlashgan ustunda emas — tepadagi
          // guruh flex-1 bilan qolgan bo'sh joyni egallab, o'zini o'rtaga tekislaydi,
          // tugma esa doim ekranning pastki qismida (hisoblab) qoladi.
          <div className="flex flex-1 flex-col items-center">
            <div className="relative isolate flex flex-1 flex-col items-center justify-center gap-6 text-center">
              {/* Yasama illyustratsiya olib tashlandi — logo atrofidagi yumshoq nur
                  halqasi (glow) o'rniga chuqurlik beradi, boshqa hech narsaga
                  xalaqit qilmaydi. */}
              <div className="pointer-events-none absolute -top-4 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-white/20 blur-3xl" />
              {/* logo.svg — shaffof fonli belgi, hech qanday karta/soya/animatsiyasiz,
                  shunchaki fon gradienti ustida turadi. */}
              <Image src="/logo.svg" alt="Logo" width={220} height={123} priority className="animate-hero-badge" />
              <h1 className="animate-hero-title text-3xl font-extrabold text-white">{dict.onboarding.welcomeTitle}</h1>
              <p className="animate-hero-subtitle max-w-xs text-white/85">{dict.onboarding.welcomeSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={goNext}
              className="animate-fade-in-up tap-target w-full max-w-xs shrink-0 rounded-full bg-white text-base font-bold text-primary-dark shadow-lg transition hover:brightness-95 active:scale-[0.98]"
              style={{ animationDelay: "0.6s" }}
            >
              {dict.onboarding.startButton}
            </button>
          </div>
        )}

        {step === "language" && (
          <div className="flex flex-1 flex-col items-center justify-start gap-4">
            <h2 className="text-center mb-2 text-xl font-bold text-text-primary">{dict.onboarding.languageTitle}</h2>
            <LangOption flag="🇺🇿" label="O'zbekcha (lotin)" active={language === "uz"} onClick={() => setLanguage("uz")} />
            <LangOption flag="🇺🇿" label="Ўзбекча (кирилл)" active={language === "uz-cyrl"} onClick={() => setLanguage("uz-cyrl")} />
            <LangOption flag="🇷🇺" label="Русский" active={language === "ru"} onClick={() => setLanguage("ru")} />
            <LangOption flag="🇺🇸" label="English" active={language === "en"} onClick={() => setLanguage("en")} />
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
          <div className="flex flex-1 flex-col justify-start gap-4">
            <h2 className="text-center text-xl font-bold text-text-primary">
              {survey.accountChoice === "login" ? dict.auth.loginIdentifierTitle : dict.auth.createIdentifierTitle}
            </h2>
            <div className="relative">
              <LockOutlined sx={{ fontSize: 18 }} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="tel"
                inputMode="tel"
                value={survey.identifier}
                onChange={(e) => setSurvey((s) => ({ ...s, identifier: formatUzPhoneInput(e.target.value) }))}
                placeholder={dict.auth.identifierPlaceholder}
                className="tap-target w-full rounded-2xl border border-border bg-surface pl-11 pr-4 text-lg text-text-primary outline-none focus:border-primary"
              />
            </div>
            {errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}
          </div>
        )}

        {step === "privacy" && (
          <div className="flex flex-1 flex-col justify-start gap-4">
            <h2 className="text-center text-xl font-bold text-text-primary">{dict.privacy.offerTitle}</h2>
            <p className="text-sm leading-relaxed text-text-secondary">{dict.privacy.offerIntro}</p>
            <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
              {dict.privacy.offerSections.map((section) => (
                <div key={section.title}>
                  <p className="mb-1 text-sm font-bold text-text-primary">{section.title}</p>
                  {section.body.split("\n").map((line, i) => (
                    <p key={i} className="text-sm leading-relaxed text-text-secondary">
                      {line}
                    </p>
                  ))}
                </div>
              ))}
            </div>
            <label className="tap-target flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-border bg-surface px-4 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary-light/30">
              <input
                type="checkbox"
                checked={survey.agreedToOffer}
                onChange={(e) => setSurvey((s) => ({ ...s, agreedToOffer: e.target.checked }))}
                className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
              />
              <span className="text-sm font-medium text-text-primary">{dict.privacy.offerCheckboxLabel}</span>
            </label>
          </div>
        )}

        {step === "name" && (
          <div className="flex flex-1 flex-col justify-start gap-4">
            <h2 className="text-center text-xl font-bold text-text-primary">{dict.onboarding.nameQuestion}</h2>
            <input
              value={survey.name}
              onChange={(e) => setSurvey((s) => ({ ...s, name: e.target.value }))}
              placeholder={dict.onboarding.namePlaceholder}
              className="tap-target rounded-2xl border border-border bg-surface px-4 text-lg text-text-primary outline-none focus:border-primary"
            />
          </div>
        )}

        {step === "age" && (
          <div className="flex flex-1 flex-col justify-start gap-4">
            <h2 className="text-center text-xl font-bold text-text-primary">{dict.onboarding.birthYearLabel}</h2>
            <WheelPicker options={BIRTH_YEARS} value={survey.birthYear} onChange={(v) => setSurvey((s) => ({ ...s, birthYear: v }))} />
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
          <div className="flex flex-1 flex-col justify-start gap-4">
            <h2 className="text-center text-xl font-bold text-text-primary">{dict.onboarding.averageCycleLengthQuestion}</h2>
            <input
              type="number"
              value={survey.averageCycleLength}
              onChange={(e) => setSurvey((s) => ({ ...s, averageCycleLength: e.target.value }))}
              className="tap-target rounded-2xl border border-border bg-surface px-4 text-lg text-text-primary outline-none focus:border-primary"
            />
            <h2 className="text-center mt-4 text-xl font-bold text-text-primary">{dict.onboarding.averagePeriodLengthQuestion}</h2>
            <input
              type="number"
              value={survey.averagePeriodLength}
              onChange={(e) => setSurvey((s) => ({ ...s, averagePeriodLength: e.target.value }))}
              className="tap-target rounded-2xl border border-border bg-surface px-4 text-lg text-text-primary outline-none focus:border-primary"
            />
          </div>
        )}

        {step === "last_period" && (
          <div className="flex flex-1 flex-col justify-start gap-4">
            <h2 className="text-center text-xl font-bold text-text-primary">{dict.onboarding.lastPeriodQuestion}</h2>
            <input
              type="date"
              value={survey.lastPeriodDate}
              disabled={survey.lastPeriodUnknown}
              onChange={(e) => setSurvey((s) => ({ ...s, lastPeriodDate: e.target.value }))}
              className="tap-target rounded-2xl border border-border bg-surface px-4 text-lg text-text-primary outline-none focus:border-primary disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() =>
                setSurvey((s) => ({ ...s, lastPeriodUnknown: !s.lastPeriodUnknown, lastPeriodDate: s.lastPeriodUnknown ? s.lastPeriodDate : "" }))
              }
              className={clsx(
                "tap-target w-full rounded-2xl border-2 px-5 py-3 text-center text-base font-medium transition",
                survey.lastPeriodUnknown ? "border-primary bg-primary-light text-primary-dark" : "border-border bg-surface text-text-primary"
              )}
            >
              {dict.common.dontKnow}
            </button>
          </div>
        )}

        {step === "typical_symptoms" && (
          <div className="flex flex-1 flex-col justify-start gap-4">
            <h2 className="text-center text-xl font-bold text-text-primary">{dict.onboarding.typicalSymptomsQuestion}</h2>
            <div className="grid grid-cols-2 gap-2">
              {SYMPTOM_OPTIONS.map((sym) => (
                <IconChip
                  key={sym}
                  label={dict.cycle.symptoms[sym]}
                  icon={<Emoji e={SYMPTOM_ICON[sym]} />}
                  active={survey.typicalSymptoms.includes(sym)}
                  onClick={() =>
                    setSurvey((s) => ({ ...s, typicalSymptoms: toggleArrayValue(s.typicalSymptoms, sym), typicalSymptomsUnknown: false }))
                  }
                />
              ))}
              <IconChip
                label={dict.common.dontKnow}
                icon={<Emoji e="🤷" />}
                active={survey.typicalSymptomsUnknown}
                onClick={() => setSurvey((s) => ({ ...s, typicalSymptomsUnknown: !s.typicalSymptomsUnknown, typicalSymptoms: [] }))}
              />
            </div>
          </div>
        )}

        {step === "period_attitude" && (
          <ChoiceStep
            title={dict.onboarding.periodAttitudeQuestion}
            options={(["uncomfortable", "dislike", "want_to_learn", "comfortable"] as PeriodAttitude[]).map((v) => ({
              label: dict.onboarding.periodAttitude[v],
              value: v,
              icon: PERIOD_ATTITUDE_ICON[v],
              onClick: () => setSurvey((s) => ({ ...s, periodAttitude: v })),
            }))}
            selected={survey.periodAttitude}
          />
        )}

        {step === "health_conditions" && (
          <div className="flex flex-1 flex-col justify-start gap-4">
            <h2 className="text-center text-xl font-bold text-text-primary">{dict.onboarding.healthConditionsQuestion}</h2>
            <div className="grid grid-cols-2 gap-2">
              {HEALTH_CONDITION_OPTIONS.map((cond) => (
                <IconChip
                  key={cond}
                  label={dict.onboarding.healthConditions[cond]}
                  icon={<Emoji e={HEALTH_CONDITION_ICON[cond]} />}
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
              { label: dict.common.dontKnow, value: "unknown", onClick: () => setSurvey((s) => ({ ...s, familyHistory: "unknown" })) },
            ]}
            selected={survey.familyHistory === null ? null : survey.familyHistory === "unknown" ? "unknown" : survey.familyHistory ? "yes" : "no"}
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
          <div className="flex flex-1 flex-col justify-start gap-5">
            <h2 className="text-center text-xl font-bold text-text-primary">{dict.onboarding.heightWeightTitle}</h2>

            {/* Metrik/Imperial birlik tanlovi — bosilganda joriy qiymat bir martagina
                boshqa birlikka o'giriladi, keyin har bir tizim o'z holatini saqlaydi. */}
            <div className="mx-auto flex rounded-full border border-border bg-surface p-1">
              <button
                type="button"
                onClick={() =>
                  setSurvey((s) =>
                    s.useImperialUnits
                      ? { ...s, useImperialUnits: false, heightCm: String(feetInchesToCm(s.heightFeet, s.heightInches)), weightKg: String(lbToKg(s.weightLb)) }
                      : s
                  )
                }
                className={clsx(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  !survey.useImperialUnits ? "bg-primary text-white" : "text-text-secondary"
                )}
              >
                {dict.onboarding.unitsMetric}
              </button>
              <button
                type="button"
                onClick={() =>
                  setSurvey((s) => {
                    if (s.useImperialUnits) return s;
                    const { feet, inches } = cmToFeetInches(Number(s.heightCm) || 165);
                    return { ...s, useImperialUnits: true, heightFeet: feet, heightInches: inches, weightLb: kgToLb(Number(s.weightKg) || 60) };
                  })
                }
                className={clsx(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  survey.useImperialUnits ? "bg-primary text-white" : "text-text-secondary"
                )}
              >
                {dict.onboarding.unitsImperial}
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-center text-sm font-semibold text-text-secondary">{dict.onboarding.heightLabel}</p>
              {survey.useImperialUnits ? (
                <div className="mx-auto flex w-full max-w-xs gap-3">
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
                </div>
              ) : (
                <WheelPicker
                  options={HEIGHT_CM_OPTIONS}
                  value={Number(survey.heightCm) || 165}
                  suffix={dict.onboarding.unitCm}
                  onChange={(v) => setSurvey((s) => ({ ...s, heightCm: String(v) }))}
                />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-center text-sm font-semibold text-text-secondary">{dict.onboarding.weightLabel}</p>
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
            </div>
          </div>
        )}

        {step === "notifications" && (
          <div className="flex flex-1 flex-col justify-start gap-3">
            {/* Namunaviy bildirishnoma kartasi — "bildirishnoma yoqilsa nima ko'rinadi"
                degan aniq tasavvur berish uchun (App.pdf'dan tashqari, foydalanuvchi
                so'roviga ko'ra: "qanchalik muhimligini takidla"). */}
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-md shadow-text-primary/5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light/50">
                <Emoji e="🔔" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-text-muted">{dict.common.appName}</p>
                <p className="truncate text-sm font-semibold text-text-primary">{dict.onboarding.notificationsSamplePreview}</p>
              </div>
            </div>
            <ChoiceStep
              title={dict.onboarding.notificationsQuestion}
              description={dict.onboarding.notificationsImportance}
              options={[
                { label: dict.common.yes, value: "yes", onClick: () => void requestNotificationPermission(true) },
                { label: dict.common.no, value: "no", onClick: () => void requestNotificationPermission(false) },
              ]}
              selected={survey.notificationsEnabled === null ? null : survey.notificationsEnabled ? "yes" : "no"}
            />
          </div>
        )}

        {step === "analyzing" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center animate-fade-in-up">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG, next/image optimizatsiyasi kerak emas */}
            <img src={resolveIllustration("onboarding.analyzing")} alt="" className={clsx("h-40 w-auto", !finishError && "animate-pulse")} />
            {finishError ? (
              <>
                <h2 className="text-xl font-bold text-text-primary">{finishError}</h2>
                <Button
                  onClick={() => {
                    finishStartedRef.current = true;
                    finish();
                  }}
                >
                  {dict.common.retryButton}
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-text-primary">{dict.onboarding.analyzingTitle}</h2>
                <p className="text-text-secondary">{dict.onboarding.analyzingSubtitle}</p>
              </>
            )}
          </div>
        )}
      </div>

      {step !== "welcome" && step !== "analyzing" && (
        <div className="mt-8 flex shrink-0 items-center justify-between gap-3">
          {stepIndex > 0 ? (
            <Button variant="ghost" onClick={goBack} disabled={submitting}>
              {dict.common.back}
            </Button>
          ) : (
            <span />
          )}
          {step === "account_identifier" ? (
            <Button onClick={submitIdentifier} disabled={submitting || !canProceed()}>
              {dict.common.continueButton}
            </Button>
          ) : step === "privacy" ? (
            <Button onClick={goNext} disabled={!survey.agreedToOffer}>
              {dict.privacy.agreeButton}
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!canProceed()}>
              {dict.common.next}
            </Button>
          )}
        </div>
      )}

    </div>
  );
}

// "Tug'ilgan yil" uchun — iOS'dagi "wheel" pastga-tepaga varaqlanadigan tanlagichga
// o'xshab, scroll-snap orqali. Uchinchi tomon kutubxonasiz — CSS scroll-snap +
// scroll tugagach markazdagi qatorni aniqlash orqali ishlaydi.
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
  const containerRef = useRef<HTMLDivElement>(null);
  const settleTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const padCount = Math.floor(WHEEL_VISIBLE_ROWS / 2);

  // Faqat birinchi renderda — tashqi `value`ga mos qatorga scroll qilamiz
  // (keyingi o'zgarishlar esa foydalanuvchining o'zi scroll qilishidan keladi).
  useEffect(() => {
    const idx = options.indexOf(value);
    if (idx === -1 || !containerRef.current) return;
    containerRef.current.scrollTop = idx * WHEEL_ITEM_HEIGHT;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function settle() {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.min(Math.max(Math.round(el.scrollTop / WHEEL_ITEM_HEIGHT), 0), options.length - 1);
    el.scrollTo({ top: idx * WHEEL_ITEM_HEIGHT, behavior: "smooth" });
    const picked = options[idx];
    if (picked !== value) onChange(picked);
  }

  function handleScroll() {
    if (settleTimeout.current) clearTimeout(settleTimeout.current);
    settleTimeout.current = setTimeout(settle, 120);
  }

  // Zamonaviy brauzerlarda `scrollend` — debounce'dan aniqroq va tezroq.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !("onscrollend" in window)) return;
    el.addEventListener("scrollend", settle);
    return () => el.removeEventListener("scrollend", settle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={clsx("relative w-full", !compact && "mx-auto max-w-xs")} style={{ height: WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ROWS }}>
      {/* Markaziy tanlangan qatorni ko'rsatuvchi doimiy band — scroll ustida. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 rounded-2xl border-2 border-primary bg-primary-light/15"
        style={{ height: WHEEL_ITEM_HEIGHT }}
      />
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="tap-target h-full overflow-y-auto scroll-smooth"
        style={{
          scrollSnapType: "y mandatory",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
          maskImage: "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
        }}
      >
        <div style={{ height: WHEEL_ITEM_HEIGHT * padCount }} />
        {options.map((opt) => (
          <div
            key={opt}
            className="flex items-center justify-center text-lg font-semibold text-text-primary"
            style={{ height: WHEEL_ITEM_HEIGHT, scrollSnapAlign: "center" }}
          >
            {opt}
            {suffix && <span className="ml-1 text-sm font-normal text-text-muted">{suffix}</span>}
          </div>
        ))}
        <div style={{ height: WHEEL_ITEM_HEIGHT * padCount }} />
      </div>
    </div>
  );
}

function LangOption({ flag, label, active, onClick }: { flag: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "tap-target flex w-full max-w-xs items-center gap-3 rounded-3xl px-6 py-4 text-lg font-semibold transition active:scale-[0.98]",
        active ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-surface text-text-primary shadow-md shadow-text-primary/5 hover:bg-surface-muted"
      )}
    >
      <Emoji e={flag} size={22} />
      {label}
    </button>
  );
}

function ChoiceStep({
  title,
  description,
  options,
  selected,
}: {
  title: string;
  /** Ixtiyoriy — savol nima uchun muhimligini tushuntiruvchi qo'shimcha matn (masalan bildirishnomalar bosqichida). */
  description?: string;
  /** `icon` — ixtiyoriy emoji, til tanlash tugmalaridagi bayroq kabi yorliq oldida ko'rsatiladi. */
  options: { label: string; value: string; icon?: string; onClick: () => void }[];
  selected: string | null;
}) {
  return (
    <div className="flex flex-1 flex-col justify-start gap-3">
      <h2 className="mb-2 text-xl font-bold text-text-primary">{title}</h2>
      {description && <p className="-mt-1 mb-1 text-sm leading-relaxed text-text-secondary">{description}</p>}
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={opt.onClick}
          className={clsx(
            "tap-target flex w-full items-center gap-3 rounded-3xl border-2 px-5 py-4 text-left text-base font-medium transition active:scale-[0.98]",
            selected === opt.value
              ? "border-primary bg-primary-light text-primary-dark shadow-lg shadow-primary/20"
              : "border-border bg-surface text-text-primary hover:border-primary-light"
          )}
        >
          {opt.icon && <Emoji e={opt.icon} />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
