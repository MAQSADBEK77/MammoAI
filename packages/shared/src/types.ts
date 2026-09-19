// Umumiy domen tiplari — CTO texnik hujjati §6 "Ma'lumotlar modeli"ga asoslangan.
// Ham backend (apps/web/src/server), ham ikkala frontend shu tiplardan foydalanadi.

export type Language = "uz" | "uz-cyrl" | "ru" | "en";

// App.pdf §5 — 18+ ayollar uchun 5 ta, 18 yoshgacha bo'lganlar uchun 3 ta maqsad.
// `partner_tracking` — erkaklar (yoki shaxsan hayz ko'rmaydigan har qanday
// foydalanuvchi) uchun 6-chi (faqat 18+) maqsad: o'zining emas, Hamkor orqali
// ulangan ayolining ma'lumotlarini kuzatish — shaxsiy sikl/homiladorlik
// savollari butunlay o'tkazib yuboriladi (packages/shared/src/logic/goal.ts).
export type Goal =
  | "cycle"
  | "pregnancy"
  | "planning_pregnancy"
  | "wellbeing"
  | "checkups"
  | "understand_body"
  | "skin"
  | "partner_tracking"
  // 40+ yosh ayollar uchun (roadmap) — sikl bashorati endi ma'noli emas
  // (tabiiy ravishda tartibsizlashadi/to'xtaydi), shuning uchun bashorat/
  // kalendar-bashorat o'rniga simptom kuzatuviga urg'u beriladi.
  | "perimenopause";

export interface User {
  id: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  region: string | null;
  language: Language;
  fontScale: "normal" | "large";
  /** Yorug'/Qorong'u/Tizim bo'yicha avtomatik — "system" bo'lsa qurilma/brauzer
   * `prefers-color-scheme`iga qarab hal qilinadi (har ikkala ilovada). */
  theme: "light" | "dark" | "system";
  notificationsEnabled: boolean;
  createdAt: string;
  /** Foydalanuvchi yuklagan profil surati — kichik rasm sifatida base64 data URI. */
  avatarUrl: string | null;
  /** Admin panel — moderatsiya uchun bloklangan bo'lsa true (API kirishi rad etiladi). */
  isBlocked: boolean;
  /** OVERNIGHT-18: Klinikalar bo'limidagi "eng yaqinlarini topish" uchun brauzer
   * geolokatsiyasidan (foydalanuvchi ruxsat bergandagina) olingan oxirgi
   * koordinata — admin panelda ham ko'rinadi (qaysi hududda ekanini bilish uchun). */
  lastLocationLat: number | null;
  lastLocationLng: number | null;
  lastLocationAt: string | null;
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

// CYCLE-ALGO-13 (kelajakka tayyorgarlik eslatmasi, hozircha bug EMAS):
// hozircha bu yerda gormonal kontratseptsiya (tabletka, spiral va h.k.)
// maydoni YO'Q — shuning uchun bu hozircha muammo yaratmaydi. LEKIN agar
// kelajakda shunday maydon qo'shilsa: gormonal kontratseptsiya
// ishlatuvchi foydalanuvchida "hayz" aslida dori sxemasiga bog'liq
// chekinish qonashi, tabiiy ovulyatsiya YO'Q — bunday foydalanuvchiga
// unumdor oyna/ovulyatsiya kuni ko'rsatish TIBBIY JIHATDAN CHALG'ITUVCHI
// (homiladorlikdan himoya haqida noto'g'ri xotirjamlik berishi mumkin).
// SHU MAYDON QO'SHILGANDA: `cycle.ts#predictCycle`ga shart qo'shish
// UNUTILMASIN — kontratseptsiya ishlatuvchilarga fertileWindowStart/End
// va ovulationDay ko'rsatilmasligi (yoki aniq ogohlantirish bilan
// ko'rsatilishi) kerak.
export interface OnboardingProfile {
  userId: string;
  name: string | null;
  age: number;
  isPregnant: boolean;
  cycleRegularity: CycleRegularity;
  familyHistory: boolean;
  /** FIX-CHECKUPS: JYYI/kontratseptsiya/bachadon bo'yni skrininggi kabi bir
   * nechta yangi tekshiruv turi shunga bog'liq. 15 yoshgacha so'ralmaydi
   * (avtomatik `false`). `familyHistory` bilan bir xil naqsh — onboarding
   * so'rovnomasida "bilmayman" varianti ham bor, lekin saqlashda `false`ga
   * yig'iladi (xuddi familyHistory kabi). */
  sexuallyActive: boolean;
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
  | "difficulty_concentrating"
  // Perimenopauza rejimi uchun qo'shildi (roadmap) — bu ikkalasi perimenopauzaning
  // eng xarakterli belgilari, mavjud ro'yxatdagi hech biri ularni qamramaydi.
  // Boshqa rejimlardagi foydalanuvchilar ham xohlasa qayd etishi mumkin.
  | "hot_flashes"
  | "night_sweats"
  // CYCLE-ALGO-05: mittelschmerz (ovulyatsiya og'rig'i) — ikki-fazali lyuteal
  // modelning ovulyatsiya SIGNALI sifatida ishlatiladi (cycle.ts#detectOvulationSignals).
  | "ovulation_pain"
  // CYCLE-ALGO-12: bachadon bo'yni shilliq qavati o'zgarishi (Billings/
  // servikal shilliq usuli) — ayollarning ~20% ichida his qilinadigan
  // "ovulation_pain"dan farqli, ANCHA KENG TARQALGAN va ishonchli
  // ovulyatsiya signali. `detectOvulationSignals` ikkalasini ham hisobga
  // oladi. ESLATMA: aniq nom/tavsif tibbiy maslahatchi bilan
  // aniqlashtirilishi kerak — hozircha ishchi nom sifatida qo'llanildi.
  // Kelajakda BBT (bazal tana harorati)/LH-test natijalari alohida,
  // kattaroq bosqich sifatida rejalashtirilgan (CYCLE-ALGO-13 eslatmasiga
  // qarang — hozircha kiritilmagan).
  | "cervical_mucus_change";

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

/** Homiladorlik albomi — foydalanuvchi o'zi yuklagan qorin/chaqaloq rasmi,
 * haftaga bog'langan. `photoUrl` — bizning o'z serverimizdagi proksi yo'l
 * (`/api/pregnancy/album/:id/photo`), rasmning o'zi Vercel Blob'da (private) —
 * shuning uchun har doim sessiya orqali autentifikatsiyadan o'tadi, hech qachon
 * ommaviy/taxmin qilib topiladigan URL emas. Bezakli "frame" rasmga
 * PISHIRILMAGAN — UI'da chizib ko'rsatiladi (dizayn o'zgarsa qayta yuklash
 * shart emas). */
export interface PregnancyAlbumPhoto {
  id: string;
  pregnancyWeek: number | null;
  photoUrl: string;
  note: string | null;
  createdAt: string;
}

// CONTENT-001 — homiladorlikning har bir haftasi uchun admin-tahrirlanadigan
// matn (chaqaloq rivojlanishi + onaning o'zgarishlari). Ilgari faqat statik
// meva-o'lcham qiyoslash bor edi (i18n'da qattiq yozilgan) — endi bazadan,
// admin panel orqali, ilova relizisiz yangilanadi.
export interface PregnancyWeekContent {
  week: number; // 1-42
  sizeLabel: string;
  /** Tashxis/tibbiy maslahat EMAS — umumiy, ma'lumot beruvchi tavsif. */
  babyDevelopment: string;
  motherChanges: string;
  updatedAt: string;
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

// "Sog'liqni nazorat qilish" (wellbeing) rejimi uchun kunlik suv/kaloriya
// jurnali — bir foydalanuvchi, bir kun uchun bitta qator (repo.ts'da
// pregnancy_kicks bilan bir xil "upsert + increment" naqsh).
export interface WellnessLog {
  date: string; // YYYY-MM-DD
  waterMl: number;
  calories: number;
}

// FIX-CHECKUPS: eski 7 ta tur — endi generateChecklist() ULARNI ISHLAB
// CHIQARMAYDI (o'rniga pastdagi boyroq turlar keladi), lekin haqiqiy
// foydalanuvchilarning eski `done` tarixini saqlab qolish uchun tur
// sifatida O'CHIRILMAYDI (loyihaning "hech qachon o'chirma, faqat
// yozishni to'xtat" konvensiyasi — masalan `high_contrast` ustuni kabi).
export type ChecklistItemType =
  | "gyn_annual_checkup"
  | "pap_test"
  | "mammography_screening"
  | "free_mammography_45"
  | "cycle_irregularity_followup"
  | "pregnancy_first_visit"
  | "pregnancy_trimester_checkup"
  // --- Quyidagilar yangi, real manba (SSV/uzaig.uz milliy protokollari +
  // xususiy klinika amaliyoti + JSSST) asosida qo'shildi ---
  | "annual_preventive_exam"
  | "first_gyn_visit"
  | "hpv_vaccination"
  | "pelvic_exam_speculum"
  | "flora_smear"
  | "cervical_cancer_screening"
  | "pelvic_ultrasound"
  | "breast_self_exam"
  | "clinical_breast_exam"
  | "breast_cancer_screening_mammography"
  | "sti_panel"
  | "contraception_counseling"
  | "preconception_checkup"
  | "prenatal_screening_stage1"
  | "prenatal_screening_stage1b"
  | "prenatal_screening_stage1c"
  // FIX3-04: manbadagi "prenatal_screening_stage2" ("faqat 1-bosqichdan
  // keyin 'xavf guruhi' deb belgilangan homiladorlik uchun") shu yerdan
  // ATAYLAB OLIB TASHLANDI — bunga kerak bo'ladigan "haqiqiy klinik xavf
  // guruhi belgisi" (masalan doktor tomonidan UTT natijasi bo'yicha
  // qo'lda belgilangan) hech qayerda saqlanmaydi. Mavjud "xavf-testi"
  // (RiskQuizResult) BUTUNLAY BOSHQA narsa — umumiy saraton xavfi, homila
  // skrininggi natijasi emas — shunga bog'lab qo'yish tibbiy jihatdan
  // noto'g'ri bo'lardi. Production'da hech qachon ishlab chiqarilmagan
  // (nol qator), shuning uchun to'liq olib tashlash xavfsiz.
  | "pregnancy_patronage_visit"
  | "postpartum_home_visit"
  | "menopause_checkup"
  | "torch_panel"
  | "group_b_strep_screening"
  | "bv_targeted_screening";

/** Tekshiruv ekranida bo'limlarga guruhlash uchun — statik, har bir
 * ChecklistItemType uchun CHECKUP_CATEGORY (checklist-rules.ts)da beriladi. */
export type ChecklistCategory = "screening" | "vaccination" | "lab" | "imaging" | "consultation" | "self_exam" | "pregnancy" | "postpartum";

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

export interface ChecklistResponse {
  items: ChecklistItem[];
  /** "Hamkorimni kuzataman" maqsadidagi foydalanuvchi uchun true — bu
   * o'zining emas, ulangan hamkorining ro'yxati (bajarilgan deb belgilash/
   * klinika topish tugmalari ko'rsatilmaydi, faqat ko'rish uchun). */
  readOnly: boolean;
  /** `readOnly` true-yu, lekin `items` bo'sh bo'lganda — sababi: hamkor
   * hali ulanmaganmi, yoki ulangan-u lekin tekshiruv ma'lumotini
   * ulashmaganmi (Hamkor sozlamalaridagi "checkups" o'chirilgan). */
  emptyReason: "not_linked" | "not_shared" | null;
  /** `readOnly` true bo'lganda — kimning ro'yxati ekanini ko'rsatish uchun. */
  partnerName: string | null;
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
  /** Anonim post uchun `null` — authorName bilan bir xil mantiq. */
  authorAvatarUrl: string | null;
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
  authorAvatarUrl: string | null;
  isOwn: boolean;
  createdAt: string;
}

// COMM-001 — jamiyat moderatsiyasi: shikoyat + bloklash.
export type CommunityReportTargetType = "post" | "comment";
export type CommunityReportReason = "spam" | "harassment" | "misinformation" | "medical_emergency" | "other";
export type CommunityReportStatus = "open" | "resolved" | "dismissed";

/** Admin moderatsiya navbatida ko'rsatiladigan — postning/izohning o'zi bilan
 * birga (moderator qaror qabul qilishi uchun kontekst kerak). */
export interface CommunityReportAdmin {
  id: string;
  targetType: CommunityReportTargetType;
  /** FIX3-19: post o'chirilgan bo'lsa null (endi SET NULL, CASCADE emas —
   * hisobot audit izi sifatida saqlanadi). */
  postId: string | null;
  commentId: string | null;
  reason: CommunityReportReason;
  note: string | null;
  status: CommunityReportStatus;
  createdAt: string;
  reporterName: string | null;
  /** Shikoyat qilingan matnning o'zi — post yoki izoh, kontekst uchun. */
  targetBody: string;
  targetAuthorName: string | null;
  /** Shikoyat qilingan mazmun hali mavjudmi (o'chirilmaganmi). */
  targetExists: boolean;
}

/** Foydalanuvchining o'zi bloklagan hisoblar ro'yxati (profil/jamiyatda
 * "bloklangan foydalanuvchilar"ni boshqarish uchun). */
export interface BlockedUserEntry {
  userId: string;
  /** Bloklangan payt anonim bo'lgan bo'lsa yoki ismi kiritilmagan bo'lsa `null`. */
  name: string | null;
  blockedAt: string;
}

/** Hamkor bilan haqiqiy (ikki tomonlama) suhbat xabari. */
export interface PartnerChatMessage {
  id: string;
  body: string;
  /** Joriy foydalanuvchi yuborganmi (chap/o'ng pufakcha uchun). */
  isOwn: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// AI Yordamchi — chat + xotira (mavjud sikl/homiladorlik ma'lumotidan
// jonli o'qiladi) + oddiy pattern-aniqlash (diagnoz emas, faqat signal).
// ---------------------------------------------------------------------------

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

/** Oxirgi ~90 kunda 3+ marta takrorlangan simptom — tashxis emas, shifokorga
 * murojaat qilishni taklif qiluvchi yumshoq signal. */
export interface SymptomPattern {
  symptom: Symptom;
  occurrences: number;
}

export interface CommunityStats {
  totalMembers: number;
  totalPosts: number;
  postsToday: number;
}

// ---------------------------------------------------------------------------
// Trendlar/statistika — mavjud cycle_logs ustidan hisoblanadigan agregatsiya
// (alohida "stats" jadvali yo'q). AI Yordamchi ekranining "Statistika"
// segmentida ko'rsatiladi (server/insights.ts).
// ---------------------------------------------------------------------------

export interface CycleLengthPoint {
  startDate: string;
  lengthDays: number;
}

export interface SymptomFrequencyPoint {
  symptom: Symptom;
  count: number;
}

export interface MoodDistributionPoint {
  mood: Mood;
  count: number;
}

/** Bitta aniqlangan sikl davomida cramps/back_pain/headache mavjud kunlar
 * soni — og'riq INTENSIVLIGI emas (bu hozircha kunlik jurnalda yo'q),
 * chastota-proksi sifatida. */
export interface PainDaysPoint {
  startDate: string;
  painDays: number;
}

export interface PeriodLengthPoint {
  startDate: string;
  lengthDays: number;
}

/** Sikl uzunligining o'rtachasi va o'zgaruvchanligi — ikkilik "tartibsiz/emas"
 * belgisidan ko'ra to'liqroq: "27 kun (±3 kun)" kabi shaffof ko'rsatkich. */
export interface RegularityScore {
  averageCycleLength: number;
  /** Aniqlangan sikllar orasidagi eng katta farq (max-min), kun. */
  variabilityDays: number;
  cyclesAnalyzed: number;
  /** So'nggi yarim va oldingi yarim sikllar o'rtachasi solishtirilgan yo'nalish
   * — kamida 4 ta sikl bo'lgandagina hisoblanadi (bo'lmasa "stable"). */
  trend: "stable" | "lengthening" | "shortening";
}

/** Bitta simptom sikl davomida QACHON ko'proq uchrashi — hayz kunlarida
 * (menstrual) yoki qolgan kunlarda (boshqa fazalar). Aniq 4-fazali (follikulyar/
 * ovulyatsiya/luteal) taqsimot BBT/LH ma'lumotisiz ishonchli emas, shuning
 * uchun faqat shu ikkilik taqsimot beriladi — baribir "faqat hayz paytida"
 * yoki "sikl davomida doim" kabi foydali farqni ko'rsatadi. */
export interface SymptomPhaseBreakdown {
  symptom: Symptom;
  periodDaysCount: number;
  otherDaysCount: number;
}

/** Kayfiyat sikl davomida QACHON ko'proq uchrashi — symptomPhaseBreakdown
 * bilan bir xil g'oya, faqat kayfiyat uchun ("hayz paytida ko'proq charchoq
 * his qilasizmi, yoki sikl davomida doimiymi"). */
export interface MoodPhaseBreakdown {
  mood: Mood;
  periodDaysCount: number;
  otherDaysCount: number;
}

/** Bashorat algoritmi tarixda qanchalik aniq bo'lganini orqaga qarab (backtest)
 * o'lchaydi — har bir o'tgan sikl uchun "o'sha vaqtda mavjud bo'lgan tarixdan
 * qancha kun deb bashorat qilingan bo'lardi" bilan haqiqiy boshlanish sanasi
 * solishtiriladi. Shaffoflik uchun: foydalanuvchiga "bizning bashoratimiz
 * o'rtacha N kun xato bilan ishlaydi" ko'rsatish — reklama emas, haqiqiy raqam. */
export interface PredictionAccuracy {
  avgErrorDays: number;
  /** Bashorat haqiqiy sanadan ±2 kun ichida to'g'ri chiqqan sikllar foizi. */
  within2DaysPct: number;
  cyclesEvaluated: number;
}

export interface InsightsSummary {
  /** Kamida 2 ta aniqlangan sikl yoki 14 ta log bo'lmasa false — bo'sh holat. */
  hasEnoughData: boolean;
  cycleLengths: CycleLengthPoint[];
  periodLengths: PeriodLengthPoint[];
  regularity: RegularityScore | null;
  symptomFrequency: SymptomFrequencyPoint[];
  symptomPhaseBreakdown: SymptomPhaseBreakdown[];
  moodPhaseBreakdown: MoodPhaseBreakdown[];
  moodDistribution: MoodDistributionPoint[];
  painDaysPerCycle: PainDaysPoint[];
  /** `null` — hali 4 tadan kam o'tgan sikl bor, ishonchli baholash uchun yetarli emas. */
  predictionAccuracy: PredictionAccuracy | null;
}

// ---------------------------------------------------------------------------
// Feedback loop — "Fikr bildirish" menyu bandi + AI Yordamchi ichidagi
// yumshoq so'rov.
// ---------------------------------------------------------------------------

export type FeedbackTrigger = "manual" | "chat_prompt";

export interface FeedbackSubmission {
  trigger: FeedbackTrigger;
  rating?: number | null;
  message?: string | null;
}

export interface FeedbackResponse {
  id: string;
  trigger: FeedbackTrigger;
  rating: number | null;
  message: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Bildirishnomalar — hozircha faqat "postingizga izoh qoldirildi" turi.
// ---------------------------------------------------------------------------

export type NotificationType = "comment_on_post" | "partner_message" | "daily_reminder";

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

// ---------------------------------------------------------------------------
// Foydalanish analitikasi — mijoz qaysi sahifada qancha vaqt o'tkazgani va
// qaysi tugmalarni bosgani (admin panelda "chuqur tahlil" uchun). Faqat
// asosiy ilova (onboarding + (app) guruhi) kuzatiladi — admin panelning o'zi
// EMAS, chunki bu foydalanuvchi xatti-harakatini o'rganish uchun, egasi
// emas. Mobil'da tugma bosishlar cheklangan (faqat asosiy CTA'lar) — React
// Native'da DOM'dagi kabi global "document click" delegatsiyasi yo'q.
// ---------------------------------------------------------------------------

export type AnalyticsEventType = "pageview" | "click";

export interface AnalyticsEventInput {
  type: AnalyticsEventType;
  /** Sahifa/ekran yo'li (masalan "/asosiy"). */
  path: string;
  /** `click` uchun — tugma matni/yorlig'i. `pageview` uchun `null`. */
  label?: string | null;
  /** `pageview` uchun — shu sahifada o'tkazilgan vaqt (millisekund). */
  durationMs?: number | null;
  /** Mijoz tomonida generatsiya qilingan, brauzer/ilova ochiq turgancha barqaror ID. */
  sessionId: string;
  platform: "web" | "mobile";
}

export interface AnalyticsSummary {
  /** Yandex Metrica uslubidagi "hozir onlayn" — so'nggi 5 daqiqada hodisa
   * yuborgan noyob seanslar soni. `days` filtriga bog'liq emas — doim
   * real vaqtga yaqin. */
  liveNow: number;
  /** Yandex Metrica uslubidagi "otказ" (bounce rate) — TANLANGAN oyna
   * ichida faqat BITTA sahifa ko'rib, hech qanday tugma bosmasdan
   * ketgan seanslar foizi. */
  bounceRatePct: number;
  totals: {
    sessions: number;
    pageviews: number;
    clicks: number;
    /** O'rtacha bitta seans davomiyligi (millisekund). */
    avgSessionDurationMs: number;
  };
  /** So'nggi N kun uchun kunlik faollik — grafik uchun. */
  dailyActivity: { day: string; sessions: number; pageviews: number; clicks: number }[];
  /** Eng ko'p vaqt o'tkazilgan sahifalar (kamayish tartibida). */
  topPages: { path: string; viewCount: number; totalDurationMs: number; avgDurationMs: number }[];
  /** Eng ko'p bosilgan tugmalar (kamayish tartibida). */
  topButtons: { label: string; path: string | null; count: number }[];
  /** QR-flyer funneli (`/baholash?src=...`) orqali ro'yxatdan o'tishlar,
   * manba bo'yicha guruhlangan (kamayish tartibida). */
  qrSignups: { source: string; count: number }[];
  /** Har bir sahifa uchun "qolib ketish" (exit rate) — foydalanuvchi so'rovi
   * (2026-09-17): "qaysi sahifada har bitta user qancha qolib ketyapti,
   * umumiy emas, bitta-bitta". `entries` — shu sahifani ko'rgan noyob
   * seanslar soni; `exits` — shu SAHIFA seansning OXIRGI ko'rgan sahifasi
   * bo'lgan holatlar soni (ya'ni shu yerdan "chiqib ketishgan"); kamida
   * 5 ta kirish bo'lgan sahifalar (shovqinni kamaytirish uchun), eng yuqori
   * qolib ketish foizidan boshlab tartiblangan. */
  pageDropOff: { path: string; entries: number; exits: number; exitRatePct: number }[];
}

export interface AnalyticsUserSummary {
  userId: string;
  name: string | null;
  phone: string | null;
  sessionsCount: number;
  eventsCount: number;
  totalDurationMs: number;
  lastActiveAt: string | null;
  topPath: string | null;
}

// ---------------------------------------------------------------------------
// Traction Dashboard — investor/demo-day uchun bitta ekranda AARRR
// (Acquisition/Activation/Retention/Referral/Revenue kengaytirilgan)
// ko'rsatkichlar. Mumkin bo'lgan joyda MAVJUD jadvallardan (users,
// analytics_events, cycle_logs, chat_messages, telegram_bot_starts,
// feedback_responses) real hisoblanadi — yangi kuzatuv talab qiladigan
// joylar (`tracked: false`) hozircha nol/bo'sh qaytaradi va "bugundan
// boshlab yig'ilyapti" deb izohlanadi (server/repo.ts#getTractionSummary).
// ---------------------------------------------------------------------------

export interface TractionSummary {
  /** Acquisition/Product/Growth bo'limlari shu oynaga qarab hisoblanadi. */
  periodDays: number;
  acquisition: {
    qrScansTotal: number;
    qrScansTracked: boolean;
    qrScansBySource: { source: string; count: number }[];
    qrSignupsBySource: { source: string; count: number }[];
    websiteVisitors: number;
    telegramStarts: number;
    registrations: number;
    /** registrations / telegramStarts, 0..1 (telegram start bot bilan majburiy bosqich). */
    conversionRate: number | null;
  };
  /** Har doim JAMI (davr bilan cheklanmagan) — "hozirgacha nechta foydalanuvchi faollashgan". */
  activation: {
    totalUsers: number;
    completedOnboarding: number;
    loggedFirstPeriod: number;
    addedFirstSymptom: number;
    usedChatbot: number;
  };
  /** DAU/WAU/MAU ta'rifi bo'yicha doim 1/7/30 kunlik oyna — `periodDays`ga bog'liq emas. */
  engagement: {
    dau: number;
    wau: number;
    mau: number;
    sessionsPerActiveUser: number;
    symptomsLoggedPerUser: number;
    chatMessagesPerUser: number;
  };
  /** Klassik kohort saqlanish — ro'yxatdan o'tgan kundan aynan N kun keyin
   * qaytganlar foizi. `cohortSize` yetarli bo'lmasa (hali N kun o'tmagan
   * foydalanuvchilar) foiz `null`. */
  retention: {
    d1: number | null;
    d1CohortSize: number;
    d7: number | null;
    d7CohortSize: number;
    d30: number | null;
    d30CohortSize: number;
  };
  product: {
    mostUsedFeatures: { label: string; viewCount: number }[];
    mostAbandonedOnboardingSteps: { step: string; count: number }[];
    onboardingStepsTracked: boolean;
    mostCommonQuestionTopics: { topic: string; count: number }[];
    mostCommonSymptoms: { symptom: string; count: number }[];
  };
  quality: {
    complaintsCount: number;
    recentComplaints: { message: string | null; createdAt: string }[];
  };
  growth: {
    school: number;
    university: number;
    clinic: number;
    organic: number;
    other: number;
    referralTracked: boolean;
  };
  revenue: {
    applicable: boolean;
  };
}

// ---------------------------------------------------------------------------
// Obuna (Premium) — AI Yordamchi + chuqur Statistika pullik, qolgani bepul.
// Hozircha to'lov provayderi ulanmagan — admin panel orqali qo'lda
// faollashtiriladi (server/repo.ts#grantPremium izohiga qarang).
// ---------------------------------------------------------------------------

export interface Subscription {
  userId: string;
  plan: "premium";
  /** `null` — muddatsiz. */
  expiresAt: string | null;
  grantedBy: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}
