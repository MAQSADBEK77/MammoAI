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

// DATA-ACCURACY-03: bu yerda mustaqil qayta yozilgan (uchinchi nusxa) sana-
// ayirish formulasi olib tashlandi — `./cycle.ts`dagi yagona, allaqachon
// eksport qilingan versiyadan foydalaniladi (ikki mustaqil nusxa kelajakda
// biri tuzatilib, ikkinchisi unutilib qolish xavfini tug'diradi).
import { daysBetween } from "./cycle";

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

// OVERNIGHT-05: 💯/🏆/👑'ning mahalliy Twemoji SVG fayli YO'Q edi (87 ta
// fayllik to'plamda faqat 87 ta belgi bor — bu uchtasi ichida emas), shuning
// uchun bu 3 ta nishonni qo'lga kiritgan HAR BIR foydalanuvchi "buzuq rasm"
// belgisini ko'rardi (Emoji.tsx'da fallback yo'q — oddiy <img>). Ilgari xuddi
// shu sinf muammo (nutrition/self_care) ham xuddi shunday — MAVJUD to'plamdan
// almashtirib tuzatilgan edi, bu safar ham shu naqsh: ⭐/✨/❤️ — uchalasi ham
// to'plamda bor, va mavjud 🌱(first_log)/🔥(week_streak) bilan to'qnashmaydi.
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: "first_log", icon: "🌱", metric: "totalLogsCount", threshold: 1 },
  { id: "week_streak", icon: "🔥", metric: "longestStreakDays", threshold: 7 },
  { id: "hundred_logs", icon: "⭐", metric: "totalLogsCount", threshold: 100 },
  { id: "month_streak", icon: "✨", metric: "longestStreakDays", threshold: 30 },
  { id: "loyal_90", icon: "❤️", metric: "longestStreakDays", threshold: 90 },
];

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
  // DATA-ACCURACY-03: `gapFromToday` MANFIY bo'lishi mumkin (`lastDate`
  // "bugun"dan KEYINGI kelajak sana bo'lsa — server hech qachon shunday
  // yubormaydi, lekin bu funksiya kelajakda boshqa chaqiruvchidan yoki
  // noto'g'ri sozlangan soatli klientdan ham chaqirilishi mumkin). Avvalgi
  // `<= 1` sharti manfiy qiymatlarni ham "streak uzilmagan" deb noto'g'ri
  // qabul qilardi — endi `>= 0` bilan aniq cheklangan.
  if (gapFromToday >= 0 && gapFromToday <= 1) {
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
