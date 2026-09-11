// Gamifikatsiya — roadmap: "App ni o'ziga ham gamifikatsiya qo'shish". Oddiy,
// samimiy naqsh: kunlik yozuv ketma-ketligi (Duolingo uslubidagi "streak") +
// yutuq nishonlari. ATAYLAB YO'Q: ommaviy reyting jadvali (leaderboard) —
// sog'liq ma'lumoti shaxsiy, boshqa foydalanuvchilar bilan solishtirish
// noqulay/nomaqbul bo'lardi.
//
// MUHIM ARXITEKTURA QARORI: yutuqlar (badges) uchun ALOHIDA DB jadval YO'Q.
// Har bir nishon "hech qachon kamaymaydigan" (monotonic) ko'rsatkichga
// bog'langan — eng uzun streak va jami yozuvlar soni faqat o'sishi mumkin,
// hech qachon kamaymaydi — shuning uchun "qachon qo'lga kiritilgani" alohida
// saqlanmasdan, HAR SAFAR cycle_logs sanalaridan qayta hisoblansa ham natija
// bir xil bo'ladi. Bitta streak uzilib qolsa ham, ilgari qo'lga kiritilgan
// nishon YO'QOLMAYDI (currentStreak emas, longestStreak'ga bog'liq).

export interface StreakStats {
  currentStreakDays: number;
  longestStreakDays: number;
  totalLogsCount: number;
}

export type BadgeId = "first_log" | "week_streak" | "month_streak" | "hundred_logs" | "loyal_90";

export interface BadgeDefinition {
  id: BadgeId;
  icon: string;
  /** Nishon shu ko'rsatkichga bog'liq — `totalLogsCount` yoki `longestStreakDays`. */
  metric: "totalLogsCount" | "longestStreakDays";
  threshold: number;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: "first_log", icon: "🌱", metric: "totalLogsCount", threshold: 1 },
  { id: "week_streak", icon: "🔥", metric: "longestStreakDays", threshold: 7 },
  { id: "hundred_logs", icon: "💯", metric: "totalLogsCount", threshold: 100 },
  { id: "month_streak", icon: "🏆", metric: "longestStreakDays", threshold: 30 },
  { id: "loyal_90", icon: "👑", metric: "longestStreakDays", threshold: 90 },
];

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86400000);
}

/**
 * @param logDates cycle_logs'dagi barcha (takrorlanmagan) sanalar, tartib shart emas.
 * @param today "bugun" — sinov uchun parametr sifatida (server: localDateStr()).
 */
export function computeStreaks(logDates: string[], today: string): StreakStats {
  const unique = [...new Set(logDates)].sort();
  if (unique.length === 0) return { currentStreakDays: 0, longestStreakDays: 0, totalLogsCount: 0 };

  let longestStreakDays = 1;
  let runLength = 1;
  for (let i = 1; i < unique.length; i++) {
    if (daysBetween(unique[i - 1], unique[i]) === 1) {
      runLength++;
    } else {
      longestStreakDays = Math.max(longestStreakDays, runLength);
      runLength = 1;
    }
  }
  longestStreakDays = Math.max(longestStreakDays, runLength);

  // Joriy streak — oxirgi yozuvdan bugungacha (yoki kecha, hali bugun
  // yozilmagan bo'lsa ham "streak uzilmagan" hisoblanadi — foydalanuvchi
  // kunni tugatmasdan turib streak yo'qolib qolmasin) teskari sanaladi.
  const lastDate = unique[unique.length - 1];
  const gapFromToday = daysBetween(lastDate, today);
  let currentStreakDays = 0;
  if (gapFromToday <= 1) {
    currentStreakDays = 1;
    for (let i = unique.length - 1; i > 0; i--) {
      if (daysBetween(unique[i - 1], unique[i]) === 1) currentStreakDays++;
      else break;
    }
  }

  return { currentStreakDays, longestStreakDays, totalLogsCount: unique.length };
}

export function computeEarnedBadges(stats: StreakStats): BadgeId[] {
  return BADGE_DEFINITIONS.filter((b) => stats[b.metric] >= b.threshold).map((b) => b.id);
}
