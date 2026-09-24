"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
  predictCycle,
  getCyclePhase,
  formatDateDisplay,
  colors,
  formatUzPhoneInput,
  extractUzPhoneDigits,
  ApiError,
  resolveRestoreStep,
} from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useTelegram } from "@/lib/telegram";
import { LogoBadge } from "@/components/LogoMark";
import { useAbVariant } from "@/lib/ab";
import { useTelegramStartLink } from "@/lib/telegram-link";
import { useSession } from "@/lib/session";
import { useIllustrations } from "@/lib/illustrations";
import { api } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { Button, IconChip, DateWheelPicker, WheelPicker } from "@/components/ui";
import { Emoji } from "@/components/Emoji";
import { OnboardingIcon, type OnboardingIconName } from "@/components/onboarding/OnboardingIcon";
import { Lottie } from "lottie-react";
import {
  LockOutlined,
  SendOutlined,
} from "@mui/icons-material";
import clsx from "clsx";

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
  | "preview"
  | "typical_symptoms"
  | "period_attitude"
  | "health_conditions"
  | "family_history"
  | "sexually_active"
  | "last_checkup"
  | "height_weight"
  | "notifications"
  | "analyzing";

/** ONB-LANG-01: barcha qadamlar KANONIK tartibda — shartlarsiz, filtrsiz.
 * Haqiqiy ro'yxat (`steps`) bundan qisqaroq bo'ladi: maqsad, yosh va
 * Telegram orqali kirish ba'zi qadamlarni olib tashlaydi. Bu ro'yxat
 * faqat bitta narsa uchun kerak — qoralamadan tiklashda saqlangan qadam
 * endi ko'rsatilmasa, uning o'rnini bilib, undan KEYINGI qadamga o'tish.
 * Yangi qadam qo'shsangiz, uni shu yerga ham qo'shing. */
const CANONICAL_STEPS: Step[] = [
  "welcome",
  "language",
  "account_choice",
  "account_identifier",
  "phone_verify",
  "privacy",
  "name",
  "age",
  "goal",
  "cycle_regularity",
  "cycle_lengths",
  "last_period",
  "preview",
  "typical_symptoms",
  "period_attitude",
  "health_conditions",
  "family_history",
  "sexually_active",
  "last_checkup",
  "height_weight",
  "notifications",
  "analyzing",
];

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
/** ONB-02: bugungi sana modul yuklanganda BIR MARTA hisoblanadi.
 * Render ichida `Date.now()` chaqirish mumkin emas (toza bo'lmagan funksiya —
 * eslint `react-hooks` qoidasi), va u baribir kerak emas: onboarding bir
 * seansda tugaydi, sana o'rtada o'zgarmaydi. `CURRENT_YEAR` bilan bir xil naqsh. */
const TODAY_MS = Date.now();
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
 *
 * Ilgari bu bosqich `canProceed()`da UMUMAN yo'q edi (`default: return true`
 * shoxiga tushardi) va inputlarda `min`/`max` ham qo'yilmagandi. Qiymat
 * keyin ham hech qayerda ushlanmaydi: /api/cycle/settings uni tekshirmaydi,
 * repo.ts shundayligicha bazaga yozadi, `predictCycle` esa faqat
 * `|| DEFAULT_CYCLE_LENGTH` bilan himoyalangan — bu 0/NaN'ni tutadi, lekin
 * 999 yoki -5 ni EMAS. Mavjud MIN/MAX_SANE_* chegaralari esa faqat
 * LOG'LARDAN hisoblangan yo'lga qo'llanilardi, yangi foydalanuvchida log
 * yo'q, ya'ni u yo'l hech qachon ishga tushmaydi.
 *
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

// ONB-07 — har bir savol bosqichi uchun BIZNING belgimiz.
//
// Tarix: MUI tizim ikonkalari (rasmiy, ba'zilari kontekstga mos emas) →
// Twemoji emoji (iliq, lekin bizning emas, har ilovada bor) → o'z to'plamimiz.
// Batafsil: components/onboarding/OnboardingIcon.tsx
//
// Belgilar `currentColor`da chizilgani uchun bo'lim rangini (binafsha /
// pushti / turkuaz) O'ZI oladi — emoji bilan bunday qilib bo'lmasdi.
const STEP_ICON_NAME: Partial<Record<Step, OnboardingIconName>> = {
  // ONB-CHROME-01: `account_choice` bu yerdan OLIB TASHLANDI. Kirish
  // ekranida brend belgisining O'ZI (LogoMark) vizual markaz vazifasini
  // bajaradi — ikkinchi, binafsha halqali ikonka uning ustida turib,
  // ekranda ikkita raqobatlashuvchi markaz hosil qilardi.
  privacy: "privacy",
  name: "name",
  age: "age",
  cycle_regularity: "cycle",
  typical_symptoms: "symptoms",
  family_history: "family",
  sexually_active: "intimacy",
  height_weight: "measure",
};

// Har bir bosqich uchun to'liq illyustratsiya (unDraw, litsenziyasiz-erkin, tijorat
// uchun ochiq — https://undraw.co) — mavjud bo'lsa, kichik emoji doira o'rniga shu
// ko'rsatiladi. Haqiqiy odam fotosurati emas (roziliksiz/litsenziyasiz muammo
// bo'lardi), lekin "quruq matn" o'rniga chizilgan sifatli vizual taassurot beradi.
const STEP_ILLUSTRATION: Partial<Record<Step, string>> = {
  account_identifier: "secure-login",
  phone_verify: "secure-login",
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
  notifications: colors.primary,
};

/**
 * ONB-04 — so'rovnomaning UCHTA BO'LIMI.
 *
 * Nega kerak: ilgari progress bitta uzun chiziq edi va u ikki muammoga ega:
 *   1) `steps.length` maqsad tanlanganda o'zgarib, foiz ORQAGA sakrardi
 *      (80% → 27%, ONB-03'da qisman tuzatildi);
 *   2) 21 ta qadam "cheksiz ro'yxat" bo'lib ko'rinardi.
 * Bo'limlarga bo'linganda ikkalasi ham yechiladi: foydalanuvchi "3 tadan
 * 2-bo'limda, 4 tadan 2-qadamda" degan ANIQ va QISQA holatni ko'radi.
 *
 * Bo'limlar `STEP_ICON_COLOR`dagi MAVJUD rang zonalariga mos — ya'ni yangi
 * dizayn tizimi o'ylab topilmadi, allaqachon borini ko'rinadigan qildik.
 * Yagona farq: `notifications` uchinchi bo'limga o'tdi (rangi pushti bo'lsa
 * ham) — u mantiqan oxirgi rozilik, siklga tegishli savol emas.
 *
 * `welcome`, `preview` va `analyzing` hech qaysi bo'limga kirmaydi: birinchisi
 * so'rovnomadan oldin, qolgan ikkitasi — natija ekranlari.
 */
const SECTIONS = [
  { key: "about", color: colors.secondary },
  { key: "cycle", color: colors.primary },
  { key: "health", color: colors.accent },
] as const;

const STEP_SECTION: Partial<Record<Step, 0 | 1 | 2>> = {
  language: 0,
  // ONB-CHROME-01: kirish/tasdiqlash qadamlari ATAYLAB hech qaysi bo'limga
  // kirmaydi ("welcome" va natija ekranlari kabi). Ular so'rovnoma emas —
  // eshik. Ilgari ular "Siz haqingizda" bo'limiga kiritilgani uchun kirish
  // ekranida "Siz haqingizda 2/7" progressi va BINAFSHA bo'lim rangi
  // chiqardi. Natijada bitta ekranda uchta bog'liq bo'lmagan rang
  // to'qnashardi: binafsha (bo'lim), pushti (brend belgisi), ko'k
  // (Telegram). Foydalanuvchi buni "rang va dizayn chalkash" deb ko'rsatdi.
  //
  // Ustiga bu MANTIQAN ham noto'g'ri edi: hali tizimga kirmagan odamga
  // "Siz haqingizda, 2/7" deb aytish — u hali hech qanday savolga javob
  // bermagan.
  privacy: 0,
  name: 0,
  age: 0,

  goal: 1,
  cycle_regularity: 1,
  cycle_lengths: 1,
  last_period: 1,
  typical_symptoms: 1,
  period_attitude: 1,

  health_conditions: 2,
  family_history: 2,
  sexually_active: 2,
  last_checkup: 2,
  height_weight: 2,
  notifications: 2,
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
/**
 * ONB-DRAFT-01 — onboarding javoblarini qurilmada vaqtincha saqlash.
 *
 * Muammo: javoblar faqat React holatida yashardi. Sahifa qayta yuklansa,
 * Telegram Mini App webview'i qayta ishga tushsa (bu tez-tez bo'ladi —
 * tizim uni xotiradan chiqarib yuboradi), yoki ayol boshqa ilovaga o'tib
 * qaytsa — O'N BESHTA javob ham yo'qolib, u birinchi qadamdan boshlardi.
 *
 * Production'da 155 foydalanuvchidan 36 tasi onboardingni tugatmagan.
 * Buning qanchasi shu sabab ekanini aniq bilmaymiz, lekin yo'qotishning
 * bu turi butunlay keraksiz.
 *
 * Saqlanadigan narsa ayolning o'zi hozir kiritayotgan va bir necha
 * daqiqadan keyin bizga yuboradigan javoblari — ular faqat SHU qurilmada
 * qoladi va onboarding tugashi bilan O'CHIRILADI. Bir kundan eski
 * qoralama ham o'chiriladi: yarim tashlangan javoblarni keyinroq
 * qaytarish chalkash bo'lardi.
 */
const DRAFT_KEY = "mammoai_onboarding_draft";
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface OnboardingDraft {
  survey: SurveyState;
  step: Step;
  savedAt: number;
}

function readOnboardingDraft(): OnboardingDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as OnboardingDraft;
    if (!draft?.survey || !draft.step || Date.now() - draft.savedAt > DRAFT_MAX_AGE_MS) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return draft;
  } catch {
    // Buzuq yoki o'qib bo'lmaydigan qoralama — shunchaki e'tiborsiz.
    return null;
  }
}

function clearOnboardingDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Xotira bloklangan — saqlanmagan ham bo'lishi mumkin.
  }
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
  // ONB-DRAFT-01: javoblar tiklanguncha saqlashni boshlamaymiz (pastdagi
  // izohga qarang) — aks holda bo'sh boshlang'ich holat qoralamani
  // o'chirib yuborardi.
  const draftRestoredRef = useRef(false);
  /** ONB-LANG-01: eng oxirgi `steps` ro'yxati. Qoralamani tiklash ikki
   * bosqichda ketadi (avval javoblar, keyin qadam) va ikkinchi bosqichda
   * ro'yxat allaqachon YANGILANGAN bo'lishi shart — closure'dagi eski
   * nusxa emas. */
  const stepsRef = useRef<Step[]>([]);
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

  // Bosqichlar ro'yxati maqsad/yoshga qarab dinamik shakllanadi (App.pdf §7-10).
  // ONB-02 / AB-01: so'rovnoma O'RTASIDA dastlabki bashoratni ko'rsatish
  // tajribasi. Ikkala yo'l ham saqlanadi va o'lchanadi (foydalanuvchi so'rovi):
  //   "off" — hozirgi yo'l (nazorat varianti)
  //   "on"  — `last_period`dan keyin bashorat ekrani qo'shiladi
  // ONB-05: botga olib boradigan havola — LandingPage'dagi bilan AYNAN bir
  // xil manba (`useTelegramStartLink`), ya'ni bot username'i ikki joyda
  // alohida saqlanmaydi va hech qachon bo'sh qaytmaydi.
  const telegramLink = useTelegramStartLink();

  const previewVariant = useAbVariant("onboarding_preview");
  const showPreviewStep = previewVariant === "on";

  /** Shu paytgacha yig'ilgan javoblardan hisoblangan bashorat. Sof funksiya —
   * server so'rovi YO'Q, hammasi brauzerda (shuning uchun akkaunt ham,
   * tarmoq ham kerak emas). Sana kiritilmagan bo'lsa `null`. */
  const previewPrediction = useMemo(() => {
    if (!survey.lastPeriodDate || survey.lastPeriodUnknown) return null;
    const cycleLength = Number(survey.averageCycleLength) || 28;
    const periodLength = Number(survey.averagePeriodLength) || 5;
    const prediction = predictCycle({
      lastPeriodStart: survey.lastPeriodDate,
      averageCycleLength: cycleLength,
      averagePeriodLength: periodLength,
    });
    if (!prediction) return null;
    // Sikldagi hozirgi kun — faza uchun.
    const diff = Math.round((TODAY_MS - new Date(survey.lastPeriodDate).getTime()) / 86400000);
    const dayInCycle = (((diff % cycleLength) + cycleLength) % cycleLength) + 1;
    return { prediction, phase: getCyclePhase(dayInCycle, cycleLength, periodLength) };
  }, [survey.lastPeriodDate, survey.lastPeriodUnknown, survey.averageCycleLength, survey.averagePeriodLength]);

  const steps = useMemo<Step[]>(() => {
    const base: Step[] = [
      "welcome",
      "language",
      "account_choice",
      // ONB-PHONE-01: `account_identifier` va `phone_verify` ro'yxatdan
      // olib tashlandi — kirish ekranida telefon varianti yo'q, ya'ni bu
      // ikki qadamga boradigan yo'l qolmagan. Ro'yxatda qoldirilsa, ular
      // "Orqaga" orqali tushib qolish mumkin bo'lgan o'lik ekranga
      // aylanardi. Ekranlarning KODI va backend o'z joyida qoladi —
      // telefon bilan kirish qayta yoqilsa, faqat shu ikki qatorni
      // qaytarish kifoya.
      "privacy",
      "name",
      "age",
      "goal",
    ];
    // ONB-03 (xato tuzatildi): progress chizig'i ORQAGA sakrar edi.
    //
    // Sabab: maqsad tanlanmaguncha ro'yxat qisqa bo'lardi (`[...list,
    // "analyzing"]`), tanlangandan keyin esa 11 ta qadam qo'shilardi. Telegram
    // oqimida bu shunday ko'rinardi:
    //     maqsad qadamida, hali tanlanmagan → 4/5  = 80%
    //     maqsad tanlandi                   → 4/15 = 27%
    // Ya'ni foydalanuvchi 80% ko'rib, keyin 27% ga tushardi — va aynan eng
    // muhim qadamda. Progress foizi qo'shilgandan keyin bu ochiq ko'rinib
    // qoldi.
    //
    // Yechim: maqsad hali tanlanmagan bo'lsa, uzunlikni ENG KO'P UCHRAYDIGAN
    // yo'l ("cycle") bo'yicha hisoblaymiz. Shunda maxraj boshidan barqaror
    // bo'ladi va progress faqat OLDINGA yuradi. Foydalanuvchi boshqa maqsad
    // tanlasa uzunlik biroz o'zgaradi, lekin bu 1-2 qadamlik farq — 80%→27%
    // kabi sakrash emas.
    const withTail = (list: Step[]): Step[] => {
      if (!survey.primaryGoal) return withTailForGoal(list, "cycle");
      return withTailForGoal(list, survey.primaryGoal);
    };

    /** Berilgan maqsad uchun to'liq qadamlar ro'yxati. Ataylab `survey`ga
     * emas, PARAMETRGA tayanadi — shu orqali maqsad hali tanlanmaganda ham
     * uzunlikni oldindan hisoblash mumkin (yuqoridagi ONB-03 izohiga qarang). */
    function withTailForGoal(list: Step[], goal: Goal): Step[] {
      const tail: Step[] = [];
      if (goal === "perimenopause") {
        // Sikl bashorati (regularity/lengths/last_period) va hayzga munosabat
        // savollari (period_attitude) SO'RALMAYDI — bashorat endi ma'noli
        // emas. Simptom va ma'lum sog'liq holatlari savollari esa AYNAN shu
        // rejim uchun eng muhimi, shuning uchun alohida qoldiriladi.
        tail.push("typical_symptoms", "health_conditions");
      } else if (needsCycleInfo(goal)) {
        tail.push("cycle_regularity", "cycle_lengths", "last_period");
        // Bashorat ekrani AYNAN shu yerda: `last_period`dan keyin yetarli
        // ma'lumot yig'ilgan (sikl uzunligi + oxirgi sana), qolgan savollar
        // esa hali oldinda — ya'ni qiymat ularni to'ldirishga undaydi.
        // Sana kiritilmagan bo'lsa bashorat hisoblanmaydi, shuning uchun
        // qadam ham qo'shilmaydi (bo'sh ekran ko'rsatmaymiz).
        if (showPreviewStep && previewPrediction) tail.push("preview");
        // ONB-TRIM-01: `period_attitude` ("hayzga munosabatingiz") ro'yxatdan
        // OLIB TASHLANDI. Audit natijasi: javob bazaga yoziladi, lekin
        // HECH QAYERDA ishlatilmaydi — na kontent tanlashda, na bashoratda,
        // na admin panelda. Ya'ni ayoldan bitta qadam vaqt olinardi va
        // evaziga hech narsa berilmasdi.
        //
        // Production'da 112 ayol javob bergan (noqulay 41, qulay 30,
        // o'rganmoqchi 23, yoqtirmayman 18) — bu qimmatli signal, lekin u
        // hozir hech narsaga ulanmagan. Ustun va mavjud javoblar
        // SAQLANADI: kelajakda kontent ohangini moslash uchun ishlatilsa,
        // savol PROFILE-01 naqshi bo'yicha — foydasi ko'rinib turgan
        // joyda — qayta so'raladi, onboardingda emas.
        tail.push("typical_symptoms", "health_conditions");
      }
      if (needsPersonalHealthQuestions(goal)) {
        tail.push("family_history");
        // FIX-CHECKUPS: 15 yoshdan kichiklarga so'ralmaydi.
        if (age >= 15) tail.push("sexually_active");
        tail.push("last_checkup");
      }
      if (needsHeightWeight(goal)) tail.push("height_weight");
      tail.push("notifications", "analyzing");
      return [...list, ...tail];
    }
    const filtered = isFromTelegram ? base.filter((s) => !["welcome", "account_choice"].includes(s)) : base;
    return withTail(filtered);
  }, [survey.primaryGoal, isFromTelegram, age, showPreviewStep, previewPrediction]);

  const step = steps[stepIndex];

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  // ONB-DRAFT-01 (tiklash) — mount'da BIR MARTA. Qadam INDEKS bilan emas,
  // NOMI bilan tiklanadi: qadamlar ro'yxati maqsad va yoshga qarab
  // o'zgaradi, ya'ni saqlangan indeks boshqa savolga to'g'ri kelib qolishi
  // mumkin edi.
  //
  // ONB-LANG-01: tiklash IKKI bosqichda. Avval javoblar, keyin — alohida
  // navbatda — qadam. Sababi: qadamlar ro'yxati javoblarga bog'liq, ya'ni
  // javoblar qo'yilmasdan turib to'g'ri ro'yxat yo'q. Ilgari ikkalasi bir
  // vaqtda bo'lardi va `steps` eskicha qolardi: Telegramdan qaytgan
  // ayolning saqlangan qadami (`account_choice`) ro'yxatda topilmasdi →
  // 0-indeks → TIL savoli IKKINCHI marta chiqardi. Aynan shu xato
  // xabar qilingan.
  useEffect(() => {
    const draft = readOnboardingDraft();
    draftRestoredRef.current = true;
    if (!draft) return;
    let inner: ReturnType<typeof setTimeout> | undefined;
    const outer = setTimeout(() => {
      setSurvey(draft.survey);
      inner = setTimeout(() => {
        const list = stepsRef.current;
        const restored = resolveRestoreStep(draft.step, list, CANONICAL_STEPS);
        if (restored) setStepIndex(list.indexOf(restored));
      }, 0);
    }, 0);
    return () => {
      clearTimeout(outer);
      if (inner) clearTimeout(inner);
    };
  }, []);

  // ONB-DRAFT-01 (saqlash) — har javob o'zgarganda. "analyzing" bosqichida
  // saqlamaymiz: u yerda yuborish allaqachon boshlangan va muvaffaqiyatli
  // tugasa qoralama baribir o'chiriladi.
  useEffect(() => {
    if (!draftRestoredRef.current || step === "analyzing") return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ survey, step, savedAt: Date.now() }));
    } catch {
      // Xotira bloklangan (xususiy rejim) — qoralamasiz davom etamiz.
    }
  }, [survey, step]);

  /** ONB-04: joriy bo'lim va shu bo'lim ICHIDAGI o'rin. Hisob `steps`
   * massividan olinadi — ya'ni shartli qadamlar (masalan `sexually_active`
   * faqat 15+ uchun) avtomatik hisobga olinadi va "4 tadan 3-qadam" doim
   * to'g'ri chiqadi. Bo'limga kirmaydigan ekranlarda (`welcome`, `preview`,
   * `analyzing`) `null` — progress umuman ko'rsatilmaydi. */
  const sectionProgress = useMemo(() => {
    const sectionIndex = STEP_SECTION[step];
    if (sectionIndex === undefined) return null;
    const inSection = steps.filter((st) => STEP_SECTION[st] === sectionIndex);
    return {
      sectionIndex,
      current: inSection.indexOf(step) + 1,
      total: inSection.length,
    };
  }, [step, steps]);
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
   * TASDIQLAMASDAN keyingi bosqichga o'tib ketardi.
   *
   * Bu jim xato emas edi, oqibati eng oxirida chiqardi: ayol butun
   * so'rovnomani (15+ savol) to'ldirib, "tahlil qilinmoqda" ekraniga
   * yetganda /api/onboarding avtorizatsiya talab qilib, hammasi xatoga
   * urilardi. Ya'ni butun mehnat behuda ketardi.
   *
   * Voronka o'lchovi buni tasdiqladi: onboarding'ni tugatmaganlarning eng
   * katta guruhi — 17 kishi — aynan `phone_verify` bosqichida qotib qolgan.
   *
   * Yechim: bosqichni surish MAS'ULIYATI chaqiruvchida. Funksiya faqat
   * muvaffaqiyat/muvaffaqiyatsizlikni qaytaradi. */
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
        // GATE-01: "bilmayman" endi `null` — u "yo'q" bilan bir xil emas.
        familyHistory: survey.familyHistory === "unknown" ? null : survey.familyHistory,
        sexuallyActive: survey.sexuallyActive === "unknown" ? null : survey.sexuallyActive,
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
      clearOnboardingDraft();
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

  /**
   * NOTIF-01: eslatmalarni yoqish.
   *
   * ILGARIGI XATO: rozilik brauzerning `Notification.requestPermission()`
   * natijasiga bog'langan edi. Lekin kunlik eslatmalar brauzer push'i
   * orqali EMAS — TELEGRAM BOTI orqali yuboriladi
   * (server/daily-reminders.ts), unga hech qanday brauzer ruxsati kerak
   * emas.
   *
   * Telegram Mini App webview'ida `Notification` API ko'pincha UMUMAN
   * mavjud emas yoki ruxsat so'rovi bloklanadi. Natijada ayol "Yoqish"ni
   * bosardi, brauzer tarafi yiqilardi va u jimgina
   * `notificationsEnabled = false` bo'lib qolardi — garchi haqiqiy
   * yetkazish kanali (Telegram) mukammal ishlab tursa ham.
   *
   * O'lchandi: 140 ayolning Telegram'i bog'langan, lekin atigi 47 tasida
   * bildirishnoma yoqilgan.
   *
   * Endi: "Yoqish" bosilishining O'ZI rozilik. Brauzer ruxsati esa
   * qo'shimcha kanal — so'raladi, lekin uning natijasi foydalanuvchining
   * aniq tanlovini BEKOR QILMAYDI.
   */
  async function requestNotificationPermission(wantsEnabled: boolean) {
    if (!wantsEnabled) {
      setSurvey((s) => ({ ...s, notificationsEnabled: false }));
      return;
    }
    setSurvey((s) => ({ ...s, notificationsEnabled: true }));
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        await Notification.requestPermission();
      }
    } catch {
      // Brauzer push'i ishlamadi — Telegram kanali baribir ishlaydi.
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
      case "cycle_lengths":
        // "Bilmayman" yoqilgan bo'lsa qiymatlar standartga (28/5) majburlab
        // qo'yiladi — alohida tekshiruv shart emas.
        return survey.cycleLengthsUnknown || isSaneCycleLengths(survey.averageCycleLength, survey.averagePeriodLength);
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
      case "last_period":
        return survey.lastPeriodDate.length > 0 || survey.lastPeriodUnknown;
      // Bashorat ekrani — faqat ko'rish uchun, hech narsa tanlanmaydi.
      case "preview":
        return true;
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
      {sectionProgress && (
        <div className="mb-6 shrink-0">
          <SectionProgress {...sectionProgress} />
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
          STEP_ICON_NAME[step] && (
            <div className="mb-5 flex justify-center">
              <div className="relative flex h-44 w-44 items-center justify-center">
                {/* O'zimiz yasagan Lottie ("nafas olayotgan" halqa) —
                    generatori: apps/web/scripts/generate-onboarding-animations.py.
                    Rang STEP_ICON_COLOR'ga mos. */}
                {/* MUHIM: `className="absolute inset-0"` emas — lottie-react o'zining
                    ".lottie-display{position:relative}" qoidasini Tailwind'ning
                    ".absolute"idan KEYIN yuklaydi va uni bekor qiladi, natijada bu
                    flex ichida ODDIY qatorga aylanib, belgini chetga surib yuborardi.
                    Inline `style` har doim g'olib chiqadi — shuning uchun shu yerda. */}
                <Lottie
                  src={`/animations/aura-${auraName(STEP_ICON_COLOR[step]!)}.json`}
                  loop
                  autoplay
                  style={{ position: "absolute", inset: 0 }}
                />
                {/* ONB-07: belgi oq doira ichida, bo'lim rangida. Aura
                    radiatsiyasi tashqarida ko'rinib turadi — shu ikkisi
                    birgalikda "nafas olayotgan" ta'sir beradi. */}
                <span
                  className="relative flex h-24 w-24 items-center justify-center rounded-full bg-surface shadow-lg"
                  style={{ color: STEP_ICON_COLOR[step] }}
                >
                  <OnboardingIcon name={STEP_ICON_NAME[step]!} />
                </span>
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
          // ONB-05: yagona kirish ekrani (referens dizayn). Ilgari bu yerda
          // faqat "Akkaunt yarataman / Menda akkaunt bor" tanlovi bor edi —
          // ya'ni foydalanuvchi hali hech narsa qilmasdan turib, o'zi haqida
          // savolga javob berishga majbur bo'lardi. Aslida bu farq KERAK EMAS:
          // server telefon bo'yicha o'zi aniqlaydi (`isNewAccount`) va mavjud
          // akkaunt bo'lsa to'g'ridan-to'g'ri ilovaga kiritadi.
          <LoginStep telegramHref={telegramLink} />
        )}

        {step === "account_identifier" && (
          <div className="flex flex-1 flex-col justify-start gap-4">
            {/* ONB-05: ilgari sarlavha "yarataman/kirish" tanloviga qarab
                o'zgarardi. Endi u tanlov yo'q (server o'zi aniqlaydi), shuning
                uchun sarlavha ham NEYTRAL — bu zamonaviy amaliyot: bitta
                maydon, tizim yangi yoki mavjud ekanini o'zi hal qiladi. */}
            <h2 className="text-center text-xl font-bold text-text-primary">{dict.auth.identifierTitle}</h2>
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
            <h2 className="text-center text-xl font-bold text-text-primary">{dict.auth.phoneVerifyTitle}</h2>
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
            <div className={clsx(survey.cycleLengthsUnknown && "pointer-events-none opacity-50")}>
              <h2 className="text-center text-xl font-bold text-text-primary">{dict.onboarding.averageCycleLengthQuestion}</h2>
              <input
                type="number"
                inputMode="numeric"
                min={MIN_SANE_CYCLE_LENGTH}
                max={MAX_SANE_CYCLE_LENGTH}
                value={survey.averageCycleLength}
                onChange={(e) => setSurvey((s) => ({ ...s, averageCycleLength: e.target.value }))}
                className="tap-target mt-4 w-full rounded-2xl border border-border bg-surface px-4 text-lg text-text-primary outline-none focus:border-primary"
              />
              <h2 className="text-center mt-4 text-xl font-bold text-text-primary">{dict.onboarding.averagePeriodLengthQuestion}</h2>
              <input
                type="number"
                inputMode="numeric"
                min={MIN_SANE_PERIOD_LENGTH}
                max={MAX_SANE_PERIOD_LENGTH}
                value={survey.averagePeriodLength}
                onChange={(e) => setSurvey((s) => ({ ...s, averagePeriodLength: e.target.value }))}
                className="tap-target mt-4 w-full rounded-2xl border border-border bg-surface px-4 text-lg text-text-primary outline-none focus:border-primary"
              />
              {/* VALIDATE-01: tugma o'chiq bo'lsa NEGA o'chiqligi aytiladi —
                  aks holda foydalanuvchi sababini bilmay qotib qoladi. */}
              {!survey.cycleLengthsUnknown &&
                !isSaneCycleLengths(survey.averageCycleLength, survey.averagePeriodLength) && (
                  <p className="mt-3 text-center text-sm text-text-secondary">
                    {dict.onboarding.cycleLengthsRangeHint(
                      MIN_SANE_CYCLE_LENGTH,
                      MAX_SANE_CYCLE_LENGTH,
                      MIN_SANE_PERIOD_LENGTH,
                      MAX_SANE_PERIOD_LENGTH
                    )}
                  </p>
                )}
            </div>
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
            {survey.cycleLengthsUnknown && <ReassureCard text={dict.onboarding.reassureCycleLengths} />}
          </div>
        )}

        {step === "last_period" && (
          <div className="flex flex-1 flex-col justify-start gap-4">
            <h2 className="text-center text-xl font-bold text-text-primary">{dict.onboarding.lastPeriodQuestion}</h2>
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
            {survey.lastPeriodUnknown && <ReassureCard text={dict.onboarding.reassureLastPeriod} />}
          </div>
        )}

        {step === "preview" && previewPrediction && (
          <div className="flex flex-1 flex-col justify-center gap-5">
            <div className="text-center">
              <Emoji e="🌸" size={44} />
              <h2 className="mt-3 text-xl font-bold text-text-primary">{dict.onboarding.previewTitle}</h2>
            </div>

            <div className="space-y-2.5">
              <PreviewRow
                label={dict.onboarding.previewNextPeriod}
                value={formatDateDisplay(previewPrediction.prediction.nextPeriodStart)}
              />
              {previewPrediction.phase && (
                <PreviewRow
                  label={dict.onboarding.previewPhase}
                  value={dict.cyclePhase[previewPrediction.phase].name}
                />
              )}
              <PreviewRow
                label={dict.onboarding.previewFertile}
                value={`${formatDateDisplay(previewPrediction.prediction.fertileWindowStart)} – ${formatDateDisplay(
                  previewPrediction.prediction.fertileWindowEnd
                )}`}
              />
            </div>

            {/* Halollik: bu bitta sikl asosidagi taxmin. Uni aniq sana
                sifatida ko'rsatish tibbiy mazmundagi ilovada noto'g'ri
                bo'lardi — shuning uchun izoh MAJBURIY. */}
            <p className="text-center text-sm text-text-secondary">{dict.onboarding.previewNote}</p>
          </div>
        )}

        {step === "typical_symptoms" && (
          <div className="flex flex-1 flex-col justify-start gap-4">
            <h2 className="text-center text-xl font-bold text-text-primary">{dict.onboarding.typicalSymptomsQuestion}</h2>
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

            <h2 className="max-w-xs text-xl font-bold leading-snug text-text-primary">{dict.onboarding.notificationsQuestion}</h2>

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
          {/* Kirish ekranida pastdagi umumiy tugma KERAK EMAS — har bir usul
              o'z tugmasiga ega va bosilgan zahoti harakat qiladi. */}
          {step === "account_choice" ? (
            <span />
          ) : step === "account_identifier" ? (
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

/**
 * ONB-01 — "bilmayman" tanlanganda chiqadigan dalda beruvchi karta.
 *
 * Foydalanuvchi so'rovi: bilmaslikni normallashtirish ("ooo that is okey")
 * va nima bo'lishini aytish.
 *
 * MUHIM QAROR: matnda RAQAM (masalan "ayollarning 40%i bilmaydi") ATAYLAB
 * YO'Q. Bunday foizni o'ylab topish mumkin emas — bizda unga manba yo'q, va
 * tibbiy mazmundagi ilovada soxta statistika ishonchni buzadi. Normallashtirish
 * raqamsiz ham ishlaydi. Haqiqiy raqam kerak bo'lsa, uni O'Z bazamizdan
 * hisoblash mumkin (qancha foydalanuvchi "bilmayman" tanlagan) — shunda u
 * haqiqat bo'ladi.
 */
function ReassureCard({ text }: { text: string }) {
  const { dict } = useI18n();
  return (
    <div className="animate-fade-in-up flex items-start gap-3 rounded-2xl bg-primary-light/25 p-4">
      <Emoji e="🌸" size={22} />
      <div className="min-w-0">
        <p className="text-sm font-bold text-text-primary">{dict.onboarding.reassureTitle}</p>
        <p className="mt-0.5 text-sm text-text-secondary">{text}</p>
      </div>
    </div>
  );
}

/** ONB-02: bashorat ekranidagi bitta qator — yorliq va qiymat. */
function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3.5 shadow-sm">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-right text-base font-bold text-text-primary">{value}</span>
    </div>
  );
}

/**
 * ONB-04 — uch bo'limli progress ko'rsatgichi.
 *
 * Yuqorida uchta segment: o'tilgan va joriy bo'lim to'ldirilgan, keyingilari
 * bo'sh. Ostida bo'lim nomi va undagi o'rin ("Siklingiz · 2/6").
 *
 * Rang joriy bo'limga tegishli (`SECTIONS[i].color`) — shu orqali bo'limdan
 * bo'limga o'tganda foydalanuvchi RANG o'zgarishini sezadi. Rang tizimi
 * loyihada allaqachon bor edi (`STEP_ICON_COLOR`), lekin faqat Lottie auraga
 * qo'llanardi, ya'ni ko'rinmasdi.
 */
function SectionProgress({
  sectionIndex,
  current,
  total,
}: {
  sectionIndex: 0 | 1 | 2;
  current: number;
  total: number;
}) {
  const { dict } = useI18n();
  const color = SECTIONS[sectionIndex].color;
  const names = [dict.onboarding.sectionAbout, dict.onboarding.sectionCycle, dict.onboarding.sectionHealth];

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {SECTIONS.map((section, i) => {
          // O'tilgan bo'lim — to'liq; joriy — shu bo'lim ichidagi nisbat;
          // keyingilari — bo'sh.
          const fill = i < sectionIndex ? 100 : i === sectionIndex ? (current / total) * 100 : 0;
          return (
            <div key={section.key} className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${fill}%`, backgroundColor: color, transitionTimingFunction: "var(--motion-ease-brand)" }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-bold" style={{ color }}>
          {names[sectionIndex]}
        </p>
        <p className="text-xs font-semibold text-text-muted">{dict.onboarding.sectionProgress(current, total)}</p>
      </div>
    </div>
  );
}

/**
 * ONB-05 — yagona kirish ekrani (foydalanuvchi bergan referens dizayn).
 *
 * Nega bitta ekran: ilgari kirish uchta qadam edi — tanlov ("yarataman"/
 * "akkauntim bor") → telefon raqam → Telegram'dan kod. Ya'ni oltita amal.
 * Telegram tugmasi esa hammasini bitta bosishga siqadi: bot raqamni O'ZI
 * ulashadi (`request_contact`), kod terish kerak emas.
 *
 * Google — hozircha O'CHIRILGAN, chunki loyihada OAuth infratuzilmasi YO'Q
 * (tekshirildi: `google` izlari faqat shrift, Search Console va Gemini
 * hujjatiga tegishli). Tugma ko'rinadi va "Tez kunda" deb belgilanadi —
 * shunda foydalanuvchi kelajakda nima bo'lishini biladi, biz esa yo'q
 * imkoniyatni bor qilib ko'rsatmaymiz.
 *
 * SMS o'rniga "Telefon raqam bilan kirish" — u MAVJUD oqimga olib boradi
 * (raqam → Telegram bot kodi). Haqiqiy SMS provayderi hozircha yo'q va u
 * har xabar uchun pul talab qiladi, shuning uchun nomi ham "SMS" emas.
 */
function LoginStep({ telegramHref }: { telegramHref: string }) {
  const { dict } = useI18n();
  // ONB-TG-01: Mini App ICHIDA ekanimizni aniqlaymiz. Bu `?fromTelegram=1`
  // parametriga tayanmaydi — parametr qayta yuklashda yoki ichki
  // navigatsiyada YO'QOLADI, va aynan shundan keyin ayol Telegram ichida
  // "Telegram'da ochish" tugmasini ko'rib qolardi.
  const { isTelegram, status: telegramStatus } = useTelegram();

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        {/* LOGO-02: ilovaning o'z ikonkasi bilan bir xil to'liq belgi —
            pushti doira ichida krem "m". */}
        <LogoBadge className="animate-hero-badge h-28 w-28" />
        <h1 className="animate-hero-title mt-2 text-3xl font-extrabold text-text-primary">{dict.auth.loginTitle}</h1>
        <p className="animate-hero-subtitle text-text-secondary">{dict.auth.loginSubtitle}</p>

        <div className="animate-fade-in-up mt-8 w-full space-y-3" style={{ animationDelay: "0.25s" }}>
          {/* ONB-TG-01: Telegram Mini App ICHIDA "Telegram'da ochish"
              havolasi ma'nosiz — ayol allaqachon Telegram ichida va bu uni
              ilovadan CHIQARIB yuborardi. Bunday holatda kirish shu yerda,
              /tg orqali tugallanadi (Mini App autentifikatsiya sahifasi).
              Telegram aniqlanmaguncha tugma o'chirilgan turadi — noto'g'ri
              yo'lni ko'rsatib qo'ymaslik uchun. */}
          {isTelegram ? (
            <Link
              href="/tg"
              className="tap-target flex w-full items-center justify-center gap-2.5 rounded-full bg-[#229ED9] px-6 py-4 text-base font-bold text-white transition active:scale-[0.98]"
            >
              <TelegramIcon />
              {dict.auth.continueInTelegram}
            </Link>
          ) : (
            <a
              href={telegramHref}
              aria-disabled={telegramStatus === "checking"}
              className="tap-target flex w-full items-center justify-center gap-2.5 rounded-full bg-[#229ED9] px-6 py-4 text-base font-bold text-white transition active:scale-[0.98] aria-disabled:pointer-events-none aria-disabled:opacity-60"
            >
              <TelegramIcon />
              {dict.auth.telegramLogin}
            </a>
          )}

          <button
            type="button"
            disabled
            className="tap-target flex w-full items-center justify-center gap-2.5 rounded-full bg-surface-muted px-6 py-4 text-base font-semibold text-text-muted"
          >
            <GoogleIcon />
            {dict.auth.googleLogin}
            <span className="rounded-full bg-border px-2 py-0.5 text-[10px] font-bold uppercase">
              {dict.auth.comingSoon}
            </span>
          </button>

          {/* ONB-PHONE-01: "Telefon raqami bilan kirish" olib tashlandi —
              bu yo'l hali tayyor emas edi, lekin ekranda to'liq ishlaydigan
              variant kabi turardi. Ishlamaydigan yo'lni taklif qilgandan
              ko'ra ko'rsatmaslik to'g'riroq. Backend (SMS kod) o'z joyida
              qoladi, faqat kirish ekranida taklif qilinmaydi. */}
        </div>
      </div>

      {/* Huquqiy eslatma. DIQQAT: bu aniq rozilikni ALMASHTIRMAYDI —
          `privacy` qadamidagi belgilash (checkbox) o'z joyida qoladi.
          Sog'liq ma'lumoti uchun passiv "bosish orqali rozi bo'ldingiz"
          yetarli emas. */}
      <p className="shrink-0 pt-6 text-center text-xs leading-relaxed text-text-muted">
        {dict.auth.legalNoticePrefix}
        <Link href="/maxfiylik" className="underline">
          {dict.auth.legalNoticeLink}
        </Link>
        {dict.auth.legalNoticeSuffix}
      </p>
    </div>
  );
}

/** Telegram logotipi — MUI to'plamida yo'q, shuning uchun inline SVG. */
function TelegramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21.9 4.3 18.9 19c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.2.2-.5.4-.9.4l.3-4.7 8.6-7.8c.4-.3-.1-.5-.6-.2L7.3 13.4l-4.5-1.4c-1-.3-1-1 .2-1.4l17.5-6.7c.8-.3 1.5.2 1.4 1z" />
    </svg>
  );
}

/** Google "G" — rasmiy to'rt rangli belgi. */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-2.8-.4-4.1H24v8.4h12.5c-.3 2.1-1.6 5.2-4.6 7.3l7.6 5.9c4.5-4.2 6.6-10.3 6.6-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C1 16.3 0 20 0 24s1 7.7 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.5-5.9l-7.6-5.9c-2 1.4-4.7 2.4-7.9 2.4-6.4 0-11.7-3.7-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}
