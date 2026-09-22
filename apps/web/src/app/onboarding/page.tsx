"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  MIN_SANE_CYCLE_LENGTH,
  MAX_SANE_CYCLE_LENGTH,
  MIN_SANE_PERIOD_LENGTH,
  MAX_SANE_PERIOD_LENGTH,
  goalToLandingTab,
  needsCycleInfo,
  needsHeightWeight,
  needsPersonalHealthQuestions,
  colors,
  formatUzPhoneInput,
  extractUzPhoneDigits,
  ApiError,
} from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useIllustrations } from "@/lib/illustrations";
import { api } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { Button, IconChip, DateWheelPicker, WheelPicker } from "@/components/ui";
import { Emoji } from "@/components/Emoji";
import { Lottie } from "lottie-react";
import {
  LockOutlined,
  ShieldOutlined,
  EditOutlined,
  CakeOutlined,
  AutorenewOutlined,
  FamilyRestroomOutlined,
  MonitorWeightOutlined,
  SendOutlined,
  FavoriteBorderOutlined,
} from "@mui/icons-material";
import clsx from "clsx";

type StepIconComponent = typeof LockOutlined;

type Step =
  | "welcome"
  | "language"
  | "account_choice"
  | "account_identifier"
  | "phone_verify"
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
  | "sexually_active"
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
  /** "Bilmayman" bosilganda true — inputlar taxminiy standart (28/5) qiymatga qaytariladi va bloklanadi. */
  cycleLengthsUnknown: boolean;
  /** FIX-07: "Bilmayman" yoqilishidan OLDIN foydalanuvchi kiritgan qiymat —
   * o'chirilganda shu qaytariladi (aks holda "35" kabi kiritilgan qiymat
   * standart "28"ga almashtirilib, hech qachon qaytarilmasdi). */
  savedCycleLength: string;
  savedPeriodLength: string;
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
  // FIX-CHECKUPS: 15 yoshdan kichiklarga so'ralmaydi (steps useMemo'da
  // filtrlangan) — shu holatda `null` qoladi va submit paytida `false`ga
  // yig'iladi, xuddi familyHistory'ning "unknown" holati kabi.
  sexuallyActive: boolean | "unknown" | null;
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

/** VALIDATE-01: "cycle_lengths" bosqichidagi qo'lda kiritilgan qiymat —
 * bo'sh/NaN/manfiy yoki mantiqsiz kattalikni (masalan 280) o'tkazmaydi.
 * Chegaralar logic/cycle.ts bilan BIR MANBADAN olinadi. */
function isSaneCycleLengths(cycleLength: string, periodLength: string): boolean {
  const c = Number(cycleLength);
  const p = Number(periodLength);
  if (!Number.isInteger(c) || !Number.isInteger(p)) return false;
  if (c < MIN_SANE_CYCLE_LENGTH || c > MAX_SANE_CYCLE_LENGTH) return false;
  if (p < MIN_SANE_PERIOD_LENGTH || p > MAX_SANE_PERIOD_LENGTH) return false;
  // Hayz davri siklning o'zidan uzun bo'la olmaydi.
  return p <= c;
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
  cycleLengthsUnknown: false,
  savedCycleLength: "28",
  savedPeriodLength: "5",
  lastPeriodDate: "",
  lastPeriodUnknown: false,
  typicalSymptoms: [],
  typicalSymptomsUnknown: false,
  periodAttitude: null,
  healthConditions: [],
  healthConditionsOther: "",
  familyHistory: null,
  sexuallyActive: null,
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
/** SECTION-01: 21 ta bosqich uchta nomlangan bo'limga guruhlanadi. Sabablari:
 *  1) 21 ta qadamli bitta uzun chiziq psixologik jihatdan "cheksiz" ko'rinadi;
 *     uchta bo'lim esa boshqarsa bo'ladigan bosqichlarga bo'ladi;
 *  2) progress ORQAGA qaytmasligi kafolatlanadi — "about" bo'limi HAR DOIM
 *     bir xil uzunlikda (maqsaddan qat'i nazar), "cycle"/"health" bo'limlariga
 *     esa faqat maqsad TANLANGANDAN KEYIN kiriladi, ya'ni ularga kirilgan
 *     paytda uzunligi allaqachon ma'lum.
 *  Har bir yo'l uchun bo'limlar ketma-ket (contiguous) ekanligi tekshirilgan. */
const SECTION_IDS = ["about", "cycle", "health"] as const;
type SectionId = (typeof SECTION_IDS)[number];

const STEP_SECTION: Partial<Record<Step, SectionId>> = {
  language: "about",
  account_choice: "about",
  account_identifier: "about",
  phone_verify: "about",
  privacy: "about",
  name: "about",
  age: "about",
  // `goal` ATAYLAB 1-bo'limning OXIRI — u tanlangach qolgan ikki bo'limning
  // uzunligi aniq bo'ladi, shuning uchun ularda sakrash bo'lishi mumkin emas.
  goal: "about",
  cycle_regularity: "cycle",
  cycle_lengths: "cycle",
  last_period: "cycle",
  typical_symptoms: "cycle",
  period_attitude: "cycle",
  health_conditions: "health",
  family_history: "health",
  sexually_active: "health",
  last_checkup: "health",
  height_weight: "health",
  notifications: "health",
};

/** Bo'lim rangi — STEP_ICON_COLOR bilan bir xil uchlik, shunda chiziqdagi rang
 * va ekrandagi ikonka rangi bir-biriga mos tushadi (rang zonalari ko'rinadi). */
const SECTION_TONE: Record<SectionId, "secondary" | "primary" | "accent"> = {
  about: "secondary",
  cycle: "primary",
  health: "accent",
};

/** LAYOUT-01: har bir bosqichdagi vizual blokning yagona, qat'iy balandligi. */
const STEP_VISUAL_HEIGHT = "h-36";

const STEP_ICON: Partial<Record<Step, StepIconComponent>> = {
  // LAYOUT-01: `account_identifier` bu yerdan olib tashlandi — u
  // STEP_ILLUSTRATION'da ham bor, render'da esa illyustratsiya ustun
  // keladi, ya'ni bu LockOutlined hech qachon chizilmasdi (o'lik sozlama).
  privacy: ShieldOutlined,
  name: EditOutlined,
  age: CakeOutlined,
  cycle_regularity: AutorenewOutlined,
  family_history: FamilyRestroomOutlined,
  sexually_active: FavoriteBorderOutlined,
  height_weight: MonitorWeightOutlined,
};

// Har bir bosqich uchun to'liq illyustratsiya (unDraw, litsenziyasiz-erkin, tijorat
// uchun ochiq — https://undraw.co) — mavjud bo'lsa, kichik emoji doira o'rniga shu
// ko'rsatiladi. Haqiqiy odam fotosurati emas (roziliksiz/litsenziyasiz muammo
// bo'lardi), lekin "quruq matn" o'rniga chizilgan sifatli vizual taassurot beradi.
const STEP_ILLUSTRATION: Partial<Record<Step, string>> = {
  language: "language",
  account_choice: "account-choice",
  account_identifier: "secure-login",
  phone_verify: "secure-login",
  goal: "goal",
  cycle_lengths: "calendar",
  last_period: "calendar",
  health_conditions: "medicine",
  last_checkup: "doctor",
  notifications: "notifications",
  period_attitude: "meditation",
  // BRAND-02: endi o'z rasmimiz bor — ilgari bu bosqich faqat MUI ikonkasi edi.
  typical_symptoms: "symptoms",
};

const STEP_ICON_COLOR: Partial<Record<Step, string>> = {
  language: colors.secondary,
  account_choice: colors.secondary,
  account_identifier: colors.secondary,
  phone_verify: colors.secondary,
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
  sexually_active: colors.accent,
  last_checkup: colors.accent,
  height_weight: colors.accent,
  // SECTION-01: ilgari `primary` edi — lekin u "health" bo'limining oxirgi
  // qadami, shuning uchun rang zonasi bo'lim bilan mos kelmasdi.
  notifications: colors.accent,
};

/** STEP_ICON_COLOR'dagi rang qiymatini public/animations/aura-*.json fayl nomiga o'giradi. */
function auraName(color: string): "primary" | "secondary" | "accent" {
  if (color === colors.secondary) return "secondary";
  if (color === colors.accent) return "accent";
  return "primary";
}

function landingPath(goal: Goal): string {
  const tab = goalToLandingTab(goal);
  if (tab === "checkups") return "/tekshiruvlar";
  if (tab === "partner") return "/hamkor";
  return "/asosiy";
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
  hot_flashes: "🥵",
  night_sweats: "💦",
  ovulation_pain: "🌸", // CYCLE-ALGO-05 — bu onboarding ro'yxatida ko'rsatilmaydi, faqat Record to'liqligi uchun
  cervical_mucus_change: "💧", // CYCLE-ALGO-12 — xuddi shu sabab
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

// `useSearchParams()` (fromTelegram=1 aniqlash uchun) Next.js'ning statik
// prerender qilishiga to'sqinlik qiladi — Suspense chegarasi shart (bug fixi:
// apps/web/src/app/baholash/page.tsxdagi bilan bir xil sabab).
/** Bosqichlar ro'yxati maqsad/yoshga qarab dinamik shakllanadi (App.pdf §7-10).
 * Komponentdan TASHQARIDA — chunki ProgressBar maxraji uchun bu xuddi shu
 * qurilish mantig'i "agar maqsad X bo'lsa" deb OLDINDAN ham chaqiriladi
 * (pastdagi `projectedSteps`ga qarang). */
function buildSteps(primaryGoal: Goal | null, isFromTelegram: boolean, age: number): Step[] {
  const base: Step[] = [
    "welcome",
    "language",
    "account_choice",
    "account_identifier",
    "phone_verify",
    "privacy",
    "name",
    "age",
    "goal",
  ];
  const list = isFromTelegram
    ? base.filter((s) => !["welcome", "account_choice", "account_identifier", "phone_verify"].includes(s))
    : base;
  if (!primaryGoal) return [...list, "analyzing"];
  const tail: Step[] = [];
  if (primaryGoal === "perimenopause") {
    // Sikl bashorati (regularity/lengths/last_period) va hayzga munosabat
    // savollari (period_attitude) SO'RALMAYDI — bashorat endi ma'noli
    // emas. Simptom va ma'lum sog'liq holatlari savollari esa AYNAN shu
    // rejim uchun eng muhimi, shuning uchun alohida qoldiriladi.
    tail.push("typical_symptoms", "health_conditions");
  } else if (needsCycleInfo(primaryGoal)) {
    tail.push(
      "cycle_regularity",
      "cycle_lengths",
      "last_period",
      "typical_symptoms",
      "period_attitude",
      "health_conditions"
    );
  }
  if (needsPersonalHealthQuestions(primaryGoal)) {
    tail.push("family_history");
    // FIX-CHECKUPS: 15 yoshdan kichiklarga so'ralmaydi.
    if (age >= 15) tail.push("sexually_active");
    tail.push("last_checkup");
  }
  if (needsHeightWeight(primaryGoal)) tail.push("height_weight");
  tail.push("notifications", "analyzing");
  return [...list, ...tail];
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <OnboardingPageInner />
    </Suspense>
  );
}

function OnboardingPageInner() {
  const { dict, language, setLanguage } = useI18n();
  const { applyMeResponse, user } = useSession();
  const searchParams = useSearchParams();
  const { resolve: resolveIllustration } = useIllustrations();
  const router = useRouter();

  const [survey, setSurvey] = useState<SurveyState>(INITIAL_SURVEY);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Telegram orqali telefon tasdiqlash — account_identifier'da yaratilgan
  // vaqtinchalik token/havola, "phone_verify" bosqichida ishlatiladi.
  const [phoneToken, setPhoneToken] = useState<string | null>(null);
  const [phoneDeepLink, setPhoneDeepLink] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  // "Analyzing" effekti React StrictMode'da (dev rejimida) ataylab ikki marta
  // ishga tushirilishi mumkin — bu ref shu tufayli `finish()` ikki marta (parallel
  // ravishda) chaqirilib, onboarding ikki marta yuborilishi va natijada redirect
  // "yarim yo'lda" osilib qolishining oldini oladi ("tahlil qilinmoqda"da abadiy
  // qolib ketish xatosi shundan edi).
  const finishStartedRef = useRef(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  const age = CURRENT_YEAR - survey.birthYear;
  const isMinor = age > 0 && age < 18;

  // FIX-07 — apps/mobile/src/app/onboarding.tsx bilan bir xil, izoh o'sha yerda.
  // setState effekt ichida sinxron chaqirilmaydi (kaskadli render'larni
  // oldini olish uchun — profil sahifasidagi bilan bir xil naqsh).
  useEffect(() => {
    const timeout = setTimeout(() => {
      const options = isMinor ? MINOR_GOALS : ADULT_GOALS;
      setSurvey((s) => (s.primaryGoal && !options.includes(s.primaryGoal) ? { ...s, primaryGoal: null } : s));
    }, 0);
    return () => clearTimeout(timeout);
  }, [isMinor]);

  // Telegram Mini App orqali kirgan (telefon Telegram'ning o'zi orqali
  // tasdiqlangan) foydalanuvchi — akkaunt/telefon-tasdiqlash qadamlari
  // ("welcome", "account_choice", "account_identifier", "phone_verify")
  // butunlay ortiqcha, Mini App'ni ochishning o'zi "welcome", tasdiqlash esa
  // Telegram orqali allaqachon bo'lgan. LEKIN "language" qadami ATAYLAB
  // saqlanadi — avval bu ham o'tkazib yuborilib, o'rniga hisob Telegram
  // klientining o'z tilidan (`language_code`) yaratilardi (foydalanuvchi
  // so'roviga ko'ra bekor qilindi, /api/auth/telegram-miniapp/finish endi
  // doim "uz" bilan yaratadi) — foydalanuvchi tilni O'ZI, shu qadamda tanlaydi.
  const isFromTelegram = searchParams.get("fromTelegram") === "1" && !!user?.phone;

  const steps = useMemo<Step[]>(
    () => buildSteps(survey.primaryGoal, isFromTelegram, age),
    [survey.primaryGoal, isFromTelegram, age]
  );

  // PROGRESS-01: ProgressBar maxraji `steps.length` bo'lganda, maqsad
  // tanlanishidan OLDIN ro'yxat qisqa ("…goal" + "analyzing") bo'lgani uchun
  // "goal" bosqichida progress ~89% ko'rinardi va maqsad tanlangan zahoti
  // ro'yxat uzayib, ~42%ga QAYTIB TUSHARDI. Maqsad tanlanmaguncha maxraj
  // sifatida joriy (yosh bo'yicha) ro'yxatdagi ENG UZUN yo'l olinadi — u
  // ta'rifi bo'yicha tanlanishi mumkin bo'lgan har qanday yo'ldan qisqa
  // emas, shuning uchun ko'rsatkich hech qachon orqaga qaytmaydi.
  const projectedSteps = useMemo<Step[]>(() => {
    if (survey.primaryGoal) return steps;
    return (isMinor ? MINOR_GOALS : ADULT_GOALS)
      .map((g) => buildSteps(g, isFromTelegram, age))
      .reduce((longest, cur) => (cur.length > longest.length ? cur : longest));
  }, [survey.primaryGoal, steps, isMinor, isFromTelegram, age]);

  /** SECTION-01: har bir bo'lim uchun to'ldirilganlik ulushi (0..1). Uchala
   * bo'lim HAR DOIM chiziladi — hatto bosqichi yo'q bo'lsa ham (masalan
   * homiladorlikda "cycle" savollari so'ralmaydi) — shunda maqsad tanlanganda
   * segmentlar eni o'zgarib "sakramaydi"; bo'sh bo'lim shunchaki o'tilgach
   * to'la ko'rinadi. Uzunlik uchun `projectedSteps` ishlatiladi, chunki maqsad
   * tanlanmaguncha haqiqiy ro'yxat hali qisqa. */
  const sections = useMemo(() => {
    const currentStep = steps[stepIndex];
    const currentSection = currentStep ? STEP_SECTION[currentStep] : undefined;
    // "welcome" va "analyzing" hech qaysi bo'limga tegishli emas (ikkalasida ham
    // chiziq ko'rsatilmaydi). Baribir aniq qiymat beramiz: welcome'da HECH NARSA
    // o'tilmagan (0), analyzing'da esa HAMMASI o'tilgan.
    const currentIndex = currentSection
      ? SECTION_IDS.indexOf(currentSection)
      : currentStep === "analyzing"
        ? SECTION_IDS.length
        : 0;
    return SECTION_IDS.map((id) => {
      const stepsHere = projectedSteps.filter((st) => STEP_SECTION[st] === id);
      const doneHere = steps.slice(0, stepIndex).filter((st) => STEP_SECTION[st] === id).length;
      const passed = SECTION_IDS.indexOf(id) < currentIndex;
      const fill = stepsHere.length === 0 ? (passed ? 1 : 0) : Math.min(1, doneHere / stepsHere.length);
      return { id, fill: passed ? 1 : fill, active: id === currentSection };
    });
  }, [steps, stepIndex, projectedSteps]);

  const overallPercent = Math.round((sections.reduce((sum, sec) => sum + sec.fill, 0) / SECTION_IDS.length) * 100);

  const step = steps[stepIndex];
  const goNext = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  // Har bir bosqichga kirilganda — Traction Dashboard (admin/traction) shu
  // orqali onboarding'ning qaysi bosqichida ko'p tashlab ketishayotganini
  // hisoblaydi ("most abandoned screen"). Tugagach onboarding_profiles paydo
  // bo'ladi, shuning uchun bu hodisa faqat TUGATMAGANLAR uchun ma'noli bo'ladi.
  useEffect(() => {
    trackEvent(`onboarding_step:${step}`);
  }, [step]);

  function toggleArrayValue<T>(arr: T[], value: T): T[] {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  }

  /** RESEND-01: ilgari bu funksiya OXIRIDA shartsiz `goNext()` chaqirardi va
   * "phone_verify" bosqichidagi "qayta yuborish" havolasi ham AYNAN shuni
   * chaqirardi — natijada qayta yuborishni bosgan foydalanuvchi telefonini
   * TASDIQLAMASDAN keyingi bosqichga (privacy) o'tib ketardi. U butun so'rovnomani
   * to'ldirib, faqat eng oxirida — `analyzing`da, /api/onboarding avtorizatsiya
   * talab qilganda — xatoga urilardi. Endi bosqichni surish MAS'ULIYATI
   * chaqiruvchida: funksiya faqat muvaffaqiyat/muvaffaqiyatsizlikni qaytaradi. */
  async function startPhoneCode(): Promise<boolean> {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const identifier = extractUzPhoneDigits(survey.identifier) ?? survey.identifier.trim();
      const res = await api.auth.phoneCodeStart({ identifier, language });
      setPhoneToken(res.token);
      setPhoneDeepLink(res.deepLink);
      setCodeSent(false);
      setVerifyCode("");
      return true;
    } catch (error) {
      // Server haqiqatan formatni rad etsa — o'zining aniq xabari (ApiError.message)
      // ko'rsatiladi. `fetch` tarmoq xatosida (internet yo'q va h.k.) oddiy Error
      // uloqtiradi — bu holatda "raqamingiz noto'g'ri" degan noto'g'ri xulosaga
      // kelmaslik uchun alohida, to'g'ri xabar ko'rsatiladi.
      setErrorMessage(error instanceof ApiError ? error.message : dict.auth.identifierNetworkError);
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  // "phone_verify" bosqichida — foydalanuvchi Telegram botda "Start" bosganini
  // (kod yuborilganini) davriy tekshiradi, shundagina kod kiritish maydonini ko'rsatadi.
  useEffect(() => {
    if (step !== "phone_verify" || !phoneToken || codeSent) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.auth.phoneCodeStatus(phoneToken);
        if (res.sent) setCodeSent(true);
      } catch {
        // Tarmoq xatosi — keyingi urinishda davom etamiz.
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [step, phoneToken, codeSent]);

  async function submitVerifyCode() {
    if (!phoneToken) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await api.auth.phoneCodeVerify({ token: phoneToken, code: verifyCode.trim() });
      applyMeResponse(res);
      if (res.onboardingProfile) {
        router.replace(landingPath(res.onboardingProfile.primaryGoal));
        return;
      }
      goNext();
    } catch {
      setErrorMessage(dict.auth.invalidCode);
    } finally {
      setSubmitting(false);
    }
  }

  /** QR-funnel (`/baholash`) orqali kelgan foydalanuvchi ro'yxatdan o'tgan
   * bo'lsa — sessionStorage'dagi test javoblari endi haqiqiy akkauntga
   * yoziladi va manba (`?src=`) analitikada belgilanadi. Ikkinchi darajali
   * qadam — muvaffaqiyatsiz bo'lsa ham onboarding davom etadi. */
  async function submitPendingQuizAnswersIfAny() {
    try {
      const raw = sessionStorage.getItem("mammoai_qr_answers");
      if (!raw) return;
      const src = sessionStorage.getItem("mammoai_qr_src") ?? "direct";
      await api.riskQuiz.submit(JSON.parse(raw));
      trackEvent(`signup_from_qr:${src}`);
      sessionStorage.removeItem("mammoai_qr_answers");
      sessionStorage.removeItem("mammoai_qr_src");
    } catch {
      // Muvaffaqiyatsiz bo'lsa ham onboarding davom etishi kerak — ikkinchi darajali qadam.
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
        sexuallyActive: survey.sexuallyActive === true,
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
      await submitPendingQuizAnswersIfAny();
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
      case "phone_verify":
        return codeSent && verifyCode.trim().length === 6;
      case "name":
        return survey.name.trim().length > 0;
      case "age":
        return age >= 13 && age <= 100;
      case "goal":
        // FIX-07: shunchaki null emasligini emas, joriy (yosh bo'yicha
        // to'g'ri) ro'yxatda haqiqatan mavjudligini tekshiradi.
        return survey.primaryGoal !== null && goalOptions.includes(survey.primaryGoal);
      case "cycle_regularity":
        return survey.cycleRegularity !== null;
      case "cycle_lengths":
        // "Bilmayman" yoqilgan bo'lsa qiymatlar standartga (28/5) majburlab
        // qo'yiladi — alohida tekshiruv shart emas.
        return survey.cycleLengthsUnknown || isSaneCycleLengths(survey.averageCycleLength, survey.averagePeriodLength);
      case "last_period":
        return survey.lastPeriodDate.length > 0 || survey.lastPeriodUnknown;
      case "period_attitude":
        return survey.periodAttitude !== null;
      case "family_history":
        return survey.familyHistory !== null;
      case "sexually_active":
        return survey.sexuallyActive !== null;
      case "last_checkup":
        return survey.lastCheckup !== null;
      case "height_weight":
        return survey.heightCm.length > 0 && survey.weightKg.length > 0;
      case "notifications":
        // Endi majburiy tanlov emas — "Yoqish" tugmasi ixtiyoriy, pastdagi
        // "Keyingisi" bilan har doim davom etish mumkin (Flo/Clue uslubidagi
        // bitta CTA'li bildirishnoma ekrani, "Ha/Yo'q" emas).
        return true;
      default:
        return true;
    }
  }

  const goalOptions = isMinor ? MINOR_GOALS : ADULT_GOALS;
  // Perimenopauzaning eng xarakterli belgilari umumiy ro'yxatda yo'q — faqat
  // shu rejim tanlanganda qo'shiladi (boshqalar uchun ro'yxatni cheklamaslik).
  const symptomOptions = survey.primaryGoal === "perimenopause" ? [...SYMPTOM_OPTIONS, "hot_flashes" as const, "night_sweats" as const] : SYMPTOM_OPTIONS;

  return (
    <div
      className={clsx(
        "mx-auto flex max-w-md flex-col px-6",
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
      // Telegram Mini App'da fullscreen sarlavha paneli shaffof holda tepada
      // qoladi (lib/telegram.ts) — oddiy brauzerda --tg-safe-area-top 0px.
      style={{ paddingTop: "calc(var(--tg-safe-area-top) + 2rem)" }}
    >
      {step !== "welcome" && step !== "analyzing" && (
        <div className="mb-6 shrink-0">
          <SectionProgress
            sections={sections}
            percent={overallPercent}
            label={
              sections.find((sec) => sec.active)?.id === "cycle"
                ? dict.onboarding.sectionCycle
                : sections.find((sec) => sec.active)?.id === "health"
                  ? dict.onboarding.sectionHealth
                  : dict.onboarding.sectionAbout
            }
          />
        </div>
      )}

      <div key={step} className={clsx("animate-fade-in-up flex flex-1 flex-col", step !== "welcome" && "overflow-y-auto")}>
        {/* LAYOUT-01: vizual blok endi QAT'IY balandlikda (STEP_VISUAL_HEIGHT) —
            ilgari illyustratsiya h-36 (`last_period`da h-24), ikonka h-44, pastki
            masofa esa mb-4/mb-5 edi, `language`da umuman vizual yo'q edi. Natijada
            sarlavha har bosqichda boshqa balandlikdan boshlanib, bosqichdan
            bosqichga "sakrab" turardi. */}
        {(STEP_ILLUSTRATION[step] || STEP_ICON[step]) && (
          <div className={clsx("mb-5 flex shrink-0 items-center justify-center", STEP_VISUAL_HEIGHT)}>
            {STEP_ILLUSTRATION[step] ? (
              /* eslint-disable-next-line @next/next/no-img-element -- SVG, next/image optimizatsiyasi kerak emas */
              <img src={resolveIllustration(`onboarding.${step}` as IllustrationSlotKey)} alt="" className="max-h-full w-auto" />
            ) : (
              <div className="relative flex h-full w-36 items-center justify-center">
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
            )}
          </div>
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
          <div className="flex flex-1 flex-col justify-start gap-4">
            <StepTitle>{dict.onboarding.languageTitle}</StepTitle>
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
            <StepTitle>{survey.accountChoice === "login" ? dict.auth.loginIdentifierTitle : dict.auth.createIdentifierTitle}</StepTitle>
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

        {step === "phone_verify" && (
          <div className="flex flex-1 flex-col justify-start gap-4">
            <StepTitle>{dict.auth.phoneVerifyTitle}</StepTitle>
            <p className="text-center text-sm leading-relaxed text-text-secondary">{dict.auth.phoneVerifyIntro}</p>
            {phoneDeepLink && (
              <a
                href={phoneDeepLink}
                target="_blank"
                rel="noreferrer"
                className="tap-target flex w-full items-center justify-center gap-2 rounded-2xl bg-[#26A5E4] text-base font-bold text-white transition hover:brightness-95"
              >
                <SendOutlined sx={{ fontSize: 20 }} />
                {dict.auth.openTelegramButton}
              </a>
            )}
            {!codeSent ? (
              <p className="text-center text-sm text-text-secondary">{dict.auth.waitingForCode}</p>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-center text-sm font-semibold text-success">{dict.auth.codeSentHint}</p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                  placeholder={dict.auth.codePlaceholder}
                  className="tap-target w-full rounded-2xl border border-border bg-surface px-4 text-center text-2xl font-bold tracking-[0.5em] text-text-primary outline-none focus:border-primary"
                />
              </div>
            )}
            {errorMessage && <p className="text-center text-sm text-danger">{errorMessage}</p>}
            <button
              type="button"
              onClick={() => void startPhoneCode()}
              disabled={submitting}
              className="text-center text-sm font-semibold text-primary-dark underline-offset-2 hover:underline disabled:opacity-50"
            >
              {dict.auth.resendLink}
            </button>
          </div>
        )}

        {step === "privacy" && (
          <div className="flex flex-1 flex-col justify-start gap-4">
            <StepTitle>{dict.privacy.offerTitle}</StepTitle>
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
            <StepTitle>{dict.onboarding.nameQuestion}</StepTitle>
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
            <StepTitle>{dict.onboarding.birthYearLabel}</StepTitle>
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
            <div className={clsx(survey.cycleLengthsUnknown && "pointer-events-none opacity-50")}>
              <StepTitle>{dict.onboarding.averageCycleLengthQuestion}</StepTitle>
              <input
                type="number"
                inputMode="numeric"
                min={MIN_SANE_CYCLE_LENGTH}
                max={MAX_SANE_CYCLE_LENGTH}
                value={survey.averageCycleLength}
                onChange={(e) => setSurvey((s) => ({ ...s, averageCycleLength: e.target.value }))}
                className="tap-target mt-4 w-full rounded-2xl border border-border bg-surface px-4 text-lg text-text-primary outline-none focus:border-primary"
              />
              <StepTitle>{dict.onboarding.averagePeriodLengthQuestion}</StepTitle>
              <input
                type="number"
                inputMode="numeric"
                min={MIN_SANE_PERIOD_LENGTH}
                max={MAX_SANE_PERIOD_LENGTH}
                value={survey.averagePeriodLength}
                onChange={(e) => setSurvey((s) => ({ ...s, averagePeriodLength: e.target.value }))}
                className="tap-target mt-4 w-full rounded-2xl border border-border bg-surface px-4 text-lg text-text-primary outline-none focus:border-primary"
              />
            </div>
            {/* VALIDATE-01: "Keyingi" o'chirilganda SABABI ko'rinib tursin —
                aks holda tugma shunchaki "ishlamayotgan"dek tuyuladi. */}
            {!survey.cycleLengthsUnknown && !isSaneCycleLengths(survey.averageCycleLength, survey.averagePeriodLength) && (
              <p className="text-sm text-danger">
                {dict.onboarding.cycleLengthsRangeHint(
                  MIN_SANE_CYCLE_LENGTH,
                  MAX_SANE_CYCLE_LENGTH,
                  MIN_SANE_PERIOD_LENGTH,
                  MAX_SANE_PERIOD_LENGTH
                )}
              </p>
            )}
            <button
              type="button"
              onClick={() =>
                setSurvey((s) =>
                  s.cycleLengthsUnknown
                    ? // FIX-07: o'chirilmoqda — foydalanuvchi avval kiritgan qiymatni qaytaramiz
                      // (ilgari bu yerda standart "28"/"5" qolib ketardi, asl qiymat yo'qolardi).
                      { ...s, cycleLengthsUnknown: false, averageCycleLength: s.savedCycleLength, averagePeriodLength: s.savedPeriodLength }
                    : // Yoqilmoqda — joriy qiymatni saqlab, standart (populyatsiya o'rtachasi)
                      // qiymatga tushiramiz. CycleScreen'da bu "taxminiy" (cyclesAnalyzed: 0)
                      // sifatida ko'rsatiladi, haqiqiy shaxsiy ma'lumot sifatida emas.
                      {
                        ...s,
                        cycleLengthsUnknown: true,
                        savedCycleLength: s.averageCycleLength,
                        savedPeriodLength: s.averagePeriodLength,
                        averageCycleLength: "28",
                        averagePeriodLength: "5",
                      }
                )
              }
              className={clsx(
                "tap-target w-full rounded-2xl border-2 px-5 py-3 text-center text-base font-medium transition",
                survey.cycleLengthsUnknown ? "border-primary bg-primary-light text-primary-dark" : "border-border bg-surface text-text-primary"
              )}
            >
              {dict.common.dontKnow}
            </button>
          </div>
        )}

        {step === "last_period" && (
          <div className="flex flex-1 flex-col justify-start gap-4">
            <StepTitle>{dict.onboarding.lastPeriodQuestion}</StepTitle>
            <div className={clsx(survey.lastPeriodUnknown && "pointer-events-none opacity-50")}>
              <DateWheelPicker
                value={survey.lastPeriodDate}
                onChange={(v) => setSurvey((s) => ({ ...s, lastPeriodDate: v }))}
                monthLabels={dict.common.months}
                minYear={CURRENT_YEAR - 1}
                maxYear={CURRENT_YEAR}
              />
            </div>
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
            <StepTitle>{dict.onboarding.typicalSymptomsQuestion}</StepTitle>
            <div className="grid grid-cols-2 gap-2">
              {symptomOptions.map((sym) => (
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
            <StepTitle>{dict.onboarding.healthConditionsQuestion}</StepTitle>
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

        {step === "sexually_active" && (
          <ChoiceStep
            title={dict.onboarding.sexuallyActiveQuestion}
            options={[
              { label: dict.common.yes, value: "yes", onClick: () => setSurvey((s) => ({ ...s, sexuallyActive: true })) },
              { label: dict.common.no, value: "no", onClick: () => setSurvey((s) => ({ ...s, sexuallyActive: false })) },
              { label: dict.common.dontKnow, value: "unknown", onClick: () => setSurvey((s) => ({ ...s, sexuallyActive: "unknown" })) },
            ]}
            selected={survey.sexuallyActive === null ? null : survey.sexuallyActive === "unknown" ? "unknown" : survey.sexuallyActive ? "yes" : "no"}
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
          <div className="flex flex-1 flex-col justify-start gap-4">
            <StepTitle>{dict.onboarding.heightWeightTitle}</StepTitle>

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
          <div className="flex flex-1 flex-col items-center justify-center gap-7 text-center">
            {/* Haqiqiy bildirishnoma qanday ko'rinishini aniq tasavvur berish uchun —
                Flo/Clue uslubidagi qulflangan ekran bannerining nusxasi (foydalanuvchi
                so'roviga ko'ra: "shu usulda bo'lsin, ha/yo'q deb so'ramasin"). */}
            <div className="w-full max-w-xs rounded-3xl border border-border bg-surface p-4 text-left shadow-xl shadow-text-primary/10">
              <div className="flex items-center gap-2">
                <div className="bg-aurora-cycle flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
                  {/* eslint-disable-next-line @next/next/no-img-element -- SVG, next/image optimizatsiyasi kerak emas */}
                  <img src="/logo.svg" alt="" className="h-3.5 w-3.5" />
                </div>
                <p className="flex-1 truncate text-xs font-semibold text-text-muted">
                  {dict.common.appName} <span className="text-text-muted/70">· {dict.onboarding.notificationsNowLabel}</span>
                </p>
                <Emoji e="🔔" size={13} />
              </div>
              <p className="mt-2 text-sm font-semibold leading-snug text-text-primary">{dict.onboarding.notificationsSamplePreview}</p>
            </div>

            <StepTitle>{dict.onboarding.notificationsQuestion}</StepTitle>

            <Button
              className="w-full max-w-xs"
              onClick={async () => {
                await requestNotificationPermission(true);
                goNext();
              }}
            >
              {dict.onboarding.notificationsTurnOnButton}
            </Button>
          </div>
        )}

        {step === "analyzing" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center animate-fade-in-up">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG, next/image optimizatsiyasi kerak emas */}
            <img src={resolveIllustration("onboarding.analyzing")} alt="" className={clsx("h-40 w-auto", !finishError && "animate-pulse")} />
            {finishError ? (
              <>
                <StepTitle>{finishError}</StepTitle>
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
                <StepTitle>{dict.onboarding.analyzingTitle}</StepTitle>
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
            <Button
              onClick={async () => {
                if (await startPhoneCode()) goNext();
              }}
              disabled={submitting || !canProceed()}
            >
              {dict.common.continueButton}
            </Button>
          ) : step === "phone_verify" ? (
            <Button onClick={submitVerifyCode} disabled={submitting || !canProceed()}>
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

// WheelPicker (yosh/bo'y/vazn/sana uchun) — @/components/ui.tsx'ga ko'chirildi,
// shunda PregnancyScreen kabi boshqa fayllar ham (masalan DateWheelPicker
// orqali) qayta ishlatishi mumkin.

/** LAYOUT-01: BARCHA bosqich sarlavhalari uchun yagona ko'rinish — chapga
 * tekislangan. Ilgari 11 ta bosqich `text-center`, 8 tasi (ChoiceStep orqali)
 * chapga tekislangan edi, shuning uchun bosqichdan bosqichga o'tganda sarlavha
 * yon tomonga "sakrardi" (eng ko'zga tashlanadigani — hisob yaratish oqimi:
 * account_choice chapda, account_identifier/phone_verify/privacy markazda). */
/** SECTION-01: bitta uzun chiziq o'rniga uchta segment + bo'lim nomi va umumiy
 * foiz. Foiz ATAYLAB ko'rsatiladi (mahsulot talabi) — bu faqat progress endi
 * hech qachon orqaga qaytmagani uchun xavfsiz. */
function SectionProgress({
  sections,
  percent,
  label,
}: {
  sections: { id: SectionId; fill: number; active: boolean }[];
  percent: number;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        <p className="text-sm font-semibold tabular-nums text-text-secondary">{percent}%</p>
      </div>
      <div className="flex gap-1.5" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        {sections.map((sec) => (
          <div key={sec.id} className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
            <div
              className={clsx(
                "h-full rounded-full transition-[width] duration-500 ease-out",
                SECTION_TONE[sec.id] === "secondary" && "bg-secondary",
                SECTION_TONE[sec.id] === "primary" && "bg-primary",
                SECTION_TONE[sec.id] === "accent" && "bg-accent"
              )}
              style={{ width: `${Math.round(sec.fill * 100)}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function StepTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-bold leading-snug text-text-primary">{children}</h2>;
}

function LangOption({ flag, label, active, onClick }: { flag: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "tap-target flex w-full items-center gap-3 rounded-3xl px-6 py-4 text-lg font-semibold transition active:scale-[0.98]",
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
    <div className="flex flex-1 flex-col justify-start gap-4">
      <StepTitle>{title}</StepTitle>
      {description && <p className="-mt-2 text-sm leading-relaxed text-text-secondary">{description}</p>}
      {/* LAYOUT-01: tanlovlar o'z ichida zichroq (gap-3) turadi, tashqi masofa esa
          boshqa bosqichlar bilan bir xil (gap-4) bo'lishi uchun alohida ro'yxat. */}
      <div className="flex flex-col gap-3">
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
    </div>
  );
}
