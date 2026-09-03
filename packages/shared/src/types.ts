// Umumiy domen tiplari — CTO texnik hujjati §6 "Ma'lumotlar modeli"ga asoslangan.
// Ham backend (apps/web/src/server), ham ikkala frontend shu tiplardan foydalanadi.

export type Language = "uz" | "uz-cyrl" | "ru" | "en";

// App.pdf §5 — 18+ ayollar uchun 5 ta, 18 yoshgacha bo'lganlar uchun 3 ta maqsad.
export type Goal =
  | "cycle"
  | "pregnancy"
  | "planning_pregnancy"
  | "wellbeing"
  | "checkups"
  | "understand_body"
  | "skin";

export interface User {
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  region: string | null;
  language: Language;
  fontScale: "normal" | "large";
  highContrast: boolean;
  notificationsEnabled: boolean;
  createdAt: string;
  /** Foydalanuvchi yuklagan profil surati — kichik rasm sifatida base64 data URI. */
  avatarUrl: string | null;
}

export const BLOOD_TYPES = ["O(I) Rh+", "O(I) Rh-", "A(II) Rh+", "A(II) Rh-", "B(III) Rh+", "B(III) Rh-", "AB(IV) Rh+", "AB(IV) Rh-"] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

export type CycleRegularity = "regular" | "irregular" | "unknown";

// App.pdf §7 — hayzga munosabat.
export type PeriodAttitude = "uncomfortable" | "dislike" | "want_to_learn" | "comfortable";

// App.pdf §7 — kasalliklar tarixi (bir nechtasi tanlanishi mumkin).
export type HealthCondition =
  | "yeast_infection"
  | "uti"
  | "bacterial_vaginosis"
  | "pcos"
  | "endometriosis"
  | "fibroids"
  | "unknown"
  | "none";

// App.pdf §4 — "qayerdan eshitdingiz".
export type HeardAboutUs = "social_media" | "friend" | "doctor" | "app_store" | "other";

export interface OnboardingProfile {
  userId: string;
  name: string | null;
  age: number;
  isPregnant: boolean;
  cycleRegularity: CycleRegularity;
  familyHistory: boolean;
  lastCheckup: "recent" | "over_year" | "never" | "unknown";
  primaryGoal: Goal;
  heardAboutUs: HeardAboutUs | null;
  typicalSymptoms: Symptom[];
  periodAttitude: PeriodAttitude | null;
  healthConditions: HealthCondition[];
  healthConditionsOther: string | null;
  heightCm: number | null;
  weightKg: number | null;
  /** Ixtiyoriy — foydalanuvchi o'zi kiritadi, tibbiy tashxis manbai emas. */
  bloodType: BloodType | null;
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
  | "insomnia"
  | "fatigue"
  | "irritability"
  | "difficulty_concentrating";

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

// "Sog'liq ko'rsatkichlari" — foydalanuvchi o'zi qayd etadigan tezkor-jurnal
// (yurak urishi, qon bosimi, vazn, harorat). E'TIBOR: bu tibbiy asbob/sensordan
// emas, foydalanuvchi qo'lda kiritgan qiymat — shuning uchun UI'da har doim
// "o'zingiz kiritgan" ekanligi va tibbiy maslahat emasligi ta'kidlanadi.
export type VitalType = "heart_rate" | "blood_pressure" | "weight" | "temperature";

export interface PregnancyVitalLog {
  id: string;
  userId: string;
  type: VitalType;
  /** Ko'pchilik turlar uchun oddiy son ("85", "36.7"); qon bosimi uchun "115/75". */
  value: string;
  recordedAt: string; // YYYY-MM-DD
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
  /** App.pdf §16 — bepul (davlat dasturi/poliklinika) yoki pullik ekanini ko'rsatadi. */
  isFree: boolean;
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

export type ClinicSpecialty =
  | "gynecology"
  | "oncology"
  | "radiology"
  | "general"
  | "endocrinology"
  | "reproductology"
  | "laparoscopy";

export type ReferralAction = "view" | "call" | "directions";

export interface ReferralEvent {
  id: string;
  userId: string;
  clinicId: string;
  checklistItemId: string | null;
  action: ReferralAction;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Xavf-testi (self-check) — App.pdf §19. E'TIBOR: tibbiy tashxis EMAS, faqat
// umumiy xavf omillariga asoslangan yo'naltiruvchi savolnoma.
// ---------------------------------------------------------------------------

export type RiskQuizQuestionId =
  | "age"
  | "family_history"
  | "personal_history"
  | "early_period"
  | "no_children_or_late_pregnancy"
  | "hormone_therapy"
  | "smoking_alcohol";

export type RiskQuizAnswers = Record<RiskQuizQuestionId, boolean>;

export type RiskLevel = "low" | "medium" | "high";

export interface RiskQuizResult {
  userId: string;
  answers: RiskQuizAnswers;
  score: number;
  level: RiskLevel;
  completedAt: string;
}

// ---------------------------------------------------------------------------
// Maqolalar — App.pdf §20. Namunaviy ta'limiy kontent (seed skript orqali).
// ---------------------------------------------------------------------------

export type ArticleCategory = "cycle" | "pregnancy" | "checkups";

export interface Article {
  id: string;
  slug: string;
  category: ArticleCategory;
  title: string;
  excerpt: string;
  body: string;
  /** Bu haqiqiy tibbiy kontent manbai emas — namunaviy/seed yozuv. */
  isSeedData: true;
}

// ---------------------------------------------------------------------------
// Jamiyat (Community) — foydalanuvchilar bir-biri bilan tajriba almashadigan
// post-lenta. Har bir post xohlagan mavzuga ("tag") tegishli bo'ladi va
// muallif xohlasa anonim sifatida joylashi mumkin (sog'liq mavzusi nozik
// bo'lgani uchun — Flo/Clue kabi ilovalarda ham bu odatiy amaliyot).
// ---------------------------------------------------------------------------

export type CommunityTag = "cycle" | "pregnancy" | "checkups" | "general";

export interface CommunityPost {
  id: string;
  tag: CommunityTag;
  body: string;
  isAnonymous: boolean;
  /** Anonim post yoki ismi kiritilmagan foydalanuvchi uchun `null`. */
  authorName: string | null;
  likesCount: number;
  commentsCount: number;
  /** Joriy foydalanuvchi shu postni allaqachon yoqtirganmi. */
  viewerLiked: boolean;
  /** Joriy foydalanuvchi shu postning muallifimi (o'chirish tugmasini ko'rsatish uchun). */
  isOwn: boolean;
  createdAt: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  body: string;
  isAnonymous: boolean;
  authorName: string | null;
  isOwn: boolean;
  createdAt: string;
}

export interface CommunityStats {
  totalMembers: number;
  totalPosts: number;
  postsToday: number;
}

// ---------------------------------------------------------------------------
// Bildirishnomalar — hozircha faqat "postingizga izoh qoldirildi" turi.
// ---------------------------------------------------------------------------

export type NotificationType = "comment_on_post" | "partner_message";

export interface AppNotification {
  id: string;
  type: NotificationType;
  /** Anonim izoh bo'lsa `null` — jamoat lentasidagi kabi anonimlik shu yerda ham hurmat qilinadi. */
  actorName: string | null;
  postId: string | null;
  /** Kontekst uchun — postning qisqartirilgan matni ("comment_on_post" uchun). */
  postExcerpt: string | null;
  /** Hamkordan kelgan erkin matnli xabar ("partner_message" uchun). */
  message: string | null;
  isRead: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Hamkor (Partner) — kod orqali ikkita akkauntni bog'lash, har biri o'z
// ulashish sozlamalarini mustaqil boshqaradi (Figma referens: "Hamkor" bo'limi).
// ---------------------------------------------------------------------------

export interface PartnerShareSettings {
  pregnancy: boolean;
  checkups: boolean;
  mood: boolean;
  period: boolean;
}

export interface PartnerSharedData {
  pregnancyWeek: number | null;
  /** `type` — checklist elementi turi, mijoz tomonda dict.checklist.items[type] orqali sarlavha topiladi. */
  nextCheckup: { type: ChecklistItemType; date: string } | null;
  todayMood: Mood | null;
  cycleDay: number | null;
}

export interface PartnerStatusResponse {
  linked: boolean;
  partner: { id: string; name: string | null; avatarUrl: string | null } | null;
  /** Joriy foydalanuvchining hamkoriga ulashayotgan sozlamalari. */
  mySharing: PartnerShareSettings | null;
  /** Hamkorning ulashgan (ruxsat berilgan) ma'lumotlari — faqat ulanган bo'lsa. */
  partnerData: PartnerSharedData | null;
  /** Ulanish sanasi — "N kun oldin ulandingiz" kabi ko'rsatish uchun (mijoz i18n bilan formatlaydi). */
  linkedSince: string | null;
  /** Hali ulanmagan bo'lsa va kod so'ralgan bo'lsa — shu foydalanuvchi ulashishi mumkin bo'lgan kod. */
  myInviteCode: string | null;
}
