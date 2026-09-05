// Butun ilova bo'ylab (onboarding, bosh sahifa, ayrim ekranlar) ishlatiladigan
// illyustratsiyalar — admin panel orqali har bir "joy" (slot) uchun alohida
// tanlanadi. Barchasi unDraw manbasidan (litsenziyasiz-erkin, tijorat uchun
// ochiq) va ilova brend ranglariga (binafsha #7c3aed, tungi-siyoh #241127/
// #3b1b45) mos qayta rangланган.

export type IllustrationCategory =
  | "classic"
  | "security"
  | "calendar"
  | "checklist"
  | "notifications"
  | "community"
  | "wellness"
  | "welcome"
  | "family";

export interface LibraryIllustration {
  /** Butun kutubxona bo'yicha noyob kalit. "classic-" bilan boshlansa — ilovaning
   * asl (birinchi kundan) o'z illyustratsiyasi (apps ichidagi illustrations papkasi ildizida). */
  slug: string;
  name: string;
  category: IllustrationCategory;
}

// Ilovaning dastlabki (hali admin tanlovi yo'q paytdagi) illyustratsiyalari —
// apps/web/public/illustrations/*.svg va apps/mobile/assets/illustrations/*.svg
// ildizida joylashgan, "library/" quyi papkasida EMAS.
const CLASSICS: LibraryIllustration[] = [
  { slug: "classic-welcome", name: "Xush kelibsiz (asl)", category: "classic" },
  { slug: "classic-secure-login", name: "Xavfsiz kirish (asl)", category: "classic" },
  { slug: "classic-goal", name: "Maqsad (asl)", category: "classic" },
  { slug: "classic-calendar", name: "Kalendar (asl)", category: "classic" },
  { slug: "classic-medicine", name: "Dori-darmon (asl)", category: "classic" },
  { slug: "classic-doctor", name: "Shifokor (asl)", category: "classic" },
  { slug: "classic-notifications", name: "Bildirishnoma (asl)", category: "classic" },
  { slug: "classic-meditation", name: "Meditatsiya (asl)", category: "classic" },
  { slug: "classic-well-done", name: "Tabriklaymiz (asl)", category: "classic" },
  { slug: "classic-healthy-lifestyle", name: "Sog'lom turmush (asl)", category: "classic" },
  { slug: "classic-expecting", name: "Homiladorlik (asl)", category: "classic" },
];

// apps/*/illustrations/library/{slug}.svg ostida joylashgan qo'shimcha variantlar.
const LIBRARY_ITEMS: LibraryIllustration[] = [
  { slug: "secure-password_9qv4", name: "Secure Password", category: "security" },
  { slug: "two-factor-authentication_ofho", name: "Two Factor Authentication", category: "security" },
  { slug: "biometric-login_v832", name: "Biometric Login", category: "security" },
  { slug: "authentication_1evl", name: "Authentication", category: "security" },
  { slug: "unlock_m0yr", name: "Unlock", category: "security" },
  { slug: "forgot-password_nttj", name: "Forgot Password", category: "security" },
  { slug: "protection-enabled_pve7", name: "Protection Enabled", category: "security" },
  { slug: "security-on_3ykb", name: "Security On", category: "security" },
  { slug: "calendar_8r6s", name: "Calendar", category: "calendar" },
  { slug: "date-picker_8qys", name: "Date Picker", category: "calendar" },
  { slug: "schedule_ry1w", name: "Schedule", category: "calendar" },
  { slug: "online-calendar_iz1q", name: "Online Calendar", category: "calendar" },
  { slug: "digital-calendar_180l", name: "Digital Calendar", category: "calendar" },
  { slug: "time-management_4ss6", name: "Time Management", category: "calendar" },
  { slug: "events-calendar_sudy", name: "Events Calendar", category: "calendar" },
  { slug: "to-do-list_eoia", name: "To Do List", category: "checklist" },
  { slug: "all-checked_d3u6", name: "All Checked", category: "checklist" },
  { slug: "action-required_pplo", name: "Action Required", category: "checklist" },
  { slug: "completing_3pe7", name: "Completing", category: "checklist" },
  { slug: "reminders_o8j5", name: "Reminders", category: "checklist" },
  { slug: "guidelines_p5r7", name: "Guidelines", category: "checklist" },
  { slug: "notifications_uvwd", name: "Notifications", category: "notifications" },
  { slug: "push-notifications_5z1s", name: "Push Notifications", category: "notifications" },
  { slug: "my-notifications_fy5v", name: "My Notifications", category: "notifications" },
  { slug: "lock-screen-notifications_n6o8", name: "Lock Screen Notifications", category: "notifications" },
  { slug: "new-notification_q6lz", name: "New Notification", category: "notifications" },
  { slug: "alarm-ringing_4deu", name: "Alarm Ringing", category: "notifications" },
  { slug: "online-community_3o0l", name: "Online Community", category: "community" },
  { slug: "social-friends_mt6k", name: "Social Friends", category: "community" },
  { slug: "team_mmq0", name: "Team", category: "community" },
  { slug: "meet-the-team_fau8", name: "Meet The Team", category: "community" },
  { slug: "friends-online_gvwz", name: "Friends Online", category: "community" },
  { slug: "followers_m4z4", name: "Followers", category: "community" },
  { slug: "meditation_k4oa", name: "Meditation", category: "wellness" },
  { slug: "mindfulness_d853", name: "Mindfulness", category: "wellness" },
  { slug: "yoga_i399", name: "Yoga", category: "wellness" },
  { slug: "walk-stats_g34b", name: "Walk Stats", category: "wellness" },
  { slug: "hiking_9zta", name: "Hiking", category: "wellness" },
  { slug: "working-out_6ksl", name: "Working Out", category: "wellness" },
  { slug: "hello_ccwj", name: "Hello", category: "welcome" },
  { slug: "welcome-aboard_y4e9", name: "Welcome Aboard", category: "welcome" },
  { slug: "happy-news_6lg3", name: "Happy News", category: "welcome" },
  { slug: "peekaboo_5o8i", name: "Peekaboo", category: "family" },
  { slug: "quality-time_h2b9", name: "Quality Time", category: "family" },
  { slug: "sweet-home_b054", name: "Sweet Home", category: "family" },
];

export const ILLUSTRATION_LIBRARY: LibraryIllustration[] = [...CLASSICS, ...LIBRARY_ITEMS];

export const ILLUSTRATION_CATEGORY_LABEL: Record<IllustrationCategory, string> = {
  classic: "Ilovaning asl rasmlari",
  security: "Xavfsizlik",
  calendar: "Kalendar",
  checklist: "Vazifalar",
  notifications: "Bildirishnomalar",
  community: "Hamjamiyat",
  wellness: "Salomatlik",
  welcome: "Xush kelibsiz",
  family: "Oila",
};

/** Ilovadagi har bir illyustratsiya "joyi" — admin panelda mustaqil tanlanadi. */
export type IllustrationSlotKey =
  | "onboarding.account_identifier"
  | "onboarding.goal"
  | "onboarding.cycle_lengths"
  | "onboarding.last_period"
  | "onboarding.health_conditions"
  | "onboarding.last_checkup"
  | "onboarding.notifications"
  | "onboarding.period_attitude"
  | "onboarding.analyzing"
  | "screen.tekshiruvlar"
  | "screen.pregnancy"
  | "landing.heroLeft"
  | "landing.heroRight"
  | "landing.features"
  | "landing.howItWorks"
  | "landing.trust"
  | "landing.faq";

export const SLOT_SECTION_LABEL = {
  onboarding: "Ro'yxatdan o'tish (onboarding)",
  screen: "Ilova ekranlari",
  landing: "Bosh sahifa (mammo.uz)",
} as const;

export const SLOT_META: Record<IllustrationSlotKey, { section: keyof typeof SLOT_SECTION_LABEL; label: string }> = {
  "onboarding.account_identifier": { section: "onboarding", label: "Telefon raqam kiritish" },
  "onboarding.goal": { section: "onboarding", label: "Maqsad tanlash" },
  "onboarding.cycle_lengths": { section: "onboarding", label: "Tsikl davomiyligi" },
  "onboarding.last_period": { section: "onboarding", label: "Oxirgi hayz sanasi" },
  "onboarding.health_conditions": { section: "onboarding", label: "Kasalliklar tarixi" },
  "onboarding.last_checkup": { section: "onboarding", label: "Oxirgi tekshiruv" },
  "onboarding.notifications": { section: "onboarding", label: "Bildirishnoma so'rovi" },
  "onboarding.period_attitude": { section: "onboarding", label: "Hayzga munosabat" },
  "onboarding.analyzing": { section: "onboarding", label: "Tahlil qilinmoqda / yakun" },
  "screen.tekshiruvlar": { section: "screen", label: "Tekshiruv ro'yxati ekrani" },
  "screen.pregnancy": { section: "screen", label: "Homiladorlik ekrani" },
  "landing.heroLeft": { section: "landing", label: "Bosh banner (chap fon)" },
  "landing.heroRight": { section: "landing", label: "Bosh banner (o'ng fon)" },
  "landing.features": { section: "landing", label: "Imkoniyatlar bo'limi foni" },
  "landing.howItWorks": { section: "landing", label: "\"Qanday ishlaydi\" foni" },
  "landing.trust": { section: "landing", label: "Ishonch bo'limi foni" },
  "landing.faq": { section: "landing", label: "FAQ bo'limi foni" },
};

export const SLOT_KEYS = Object.keys(SLOT_META) as IllustrationSlotKey[];

/** Admin hali hech narsa o'zgartirmagan bo'lsa ishlatiladigan boshlang'ich holat —
 * ilovaning HOZIRGI (kod ichida qattiq yozilgan bo'lgan) ko'rinishi bilan bir xil. */
export const DEFAULT_SLOT_ASSIGNMENTS: Record<IllustrationSlotKey, string> = {
  "onboarding.account_identifier": "classic-secure-login",
  "onboarding.goal": "classic-goal",
  "onboarding.cycle_lengths": "classic-calendar",
  "onboarding.last_period": "classic-calendar",
  "onboarding.health_conditions": "classic-medicine",
  "onboarding.last_checkup": "classic-doctor",
  "onboarding.notifications": "classic-notifications",
  "onboarding.period_attitude": "classic-meditation",
  "onboarding.analyzing": "classic-well-done",
  "screen.tekshiruvlar": "classic-healthy-lifestyle",
  "screen.pregnancy": "classic-expecting",
  "landing.heroLeft": "classic-welcome",
  "landing.heroRight": "classic-healthy-lifestyle",
  "landing.features": "classic-goal",
  "landing.howItWorks": "classic-calendar",
  "landing.trust": "classic-secure-login",
  "landing.faq": "classic-doctor",
};

/** Web uchun: slug'dan `/illustrations/...svg` yo'lini hisoblaydi. */
export function illustrationWebPath(slug: string): string {
  if (slug.startsWith("classic-")) return `/illustrations/${slug.slice("classic-".length)}.svg`;
  return `/illustrations/library/${slug}.svg`;
}
