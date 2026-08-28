// Umumiy domen tiplari — CTO texnik hujjati §6 "Ma'lumotlar modeli"ga asoslangan.
// Ham backend (apps/web/src/server), ham ikkala frontend shu tiplardan foydalanadi.

export type Language = "uz" | "ru";

export type Goal = "cycle" | "pregnancy" | "checklist";

export interface User {
  id: string;
  phone: string | null;
  name: string | null;
  region: string | null;
  language: Language;
  fontScale: "normal" | "large";
  highContrast: boolean;
  createdAt: string;
}

export type CycleRegularity = "regular" | "irregular" | "unknown";

export interface OnboardingProfile {
  userId: string;
  age: number;
  isPregnant: boolean;
  cycleRegularity: CycleRegularity;
  familyHistory: boolean;
  lastCheckup: "recent" | "over_year" | "never" | "unknown";
  primaryGoal: Goal;
}

export type FlowLevel = "spotting" | "light" | "medium" | "heavy";
export type Mood = "happy" | "calm" | "tired" | "sad" | "irritable" | "anxious";
export type Symptom =
  | "cramps"
  | "headache"
  | "bloating"
  | "acne"
  | "back_pain"
  | "nausea"
  | "breast_tenderness"
  | "insomnia";

export interface CycleLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  flow: FlowLevel | null;
  mood: Mood | null;
  symptoms: Symptom[];
  createdAt: string;
}

export interface CycleSettings {
  userId: string;
  lastPeriodStart: string | null;
  averageCycleLength: number; // kun, standart 28
  averagePeriodLength: number; // kun, standart 5
}

export interface PregnancyProfile {
  userId: string;
  lastMenstrualPeriod: string | null; // YYYY-MM-DD — ikkalasidan biri bo'lishi kerak
  dueDate: string | null; // YYYY-MM-DD
}

export interface PregnancyVisitLog {
  id: string;
  userId: string;
  label: string;
  date: string;
  clinicName: string | null;
  note: string | null;
  createdAt: string;
}

export type ChecklistItemType =
  | "gyn_annual_checkup"
  | "pap_test"
  | "mammography_screening"
  | "free_mammography_45"
  | "cycle_irregularity_followup"
  | "pregnancy_first_visit"
  | "pregnancy_trimester_checkup";

export type ChecklistStatus = "pending" | "done" | "overdue";

export interface ChecklistItem {
  id: string;
  userId: string;
  type: ChecklistItemType;
  status: ChecklistStatus;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  region: string;
  lat: number;
  lng: number;
  phone: string;
  specialties: ClinicSpecialty[];
  freeScreening: boolean;
  /** Bu haqiqiy hamkorlik bazasi emas — namunaviy/seed yozuv ekanini belgilaydi. */
  isSeedData: true;
}

export type ClinicSpecialty = "gynecology" | "oncology" | "radiology" | "general";

export type ReferralAction = "view" | "call" | "directions";

export interface ReferralEvent {
  id: string;
  userId: string;
  clinicId: string;
  checklistItemId: string | null;
  action: ReferralAction;
  createdAt: string;
}
