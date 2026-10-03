import { daysBetween } from "./cycle";

/**
 * PERIOD-TRACK-03 — oxirgi qon ketish "seriyasi"ning boshlanishi.
 *
 * Nega `detectPeriodStarts`dan alohida: u DOG'LANISHNI ataylab e'tiborsiz
 * qoldiradi, chunki dog'lanish sikl boshlanishi emas — bu tibbiy jihatdan
 * to'g'ri va bashorat uchun shunday qolishi kerak.
 *
 * Lekin AYOL uchun manzara boshqacha: u kalendarda kunni belgilaydi,
 * kalendar uni to'liq bo'yab ko'rsatadi, va shundan keyin ilova hech
 * narsa so'ramaydi — go'yo belgilash hech narsani o'zgartirmagandek.
 *
 * O'lchandi (production, 2026-10-01): oxirgi 7 kunda qayd qilgan 35
 * ayoldan 5 tasi FAQAT dog'lanish belgilagan. Ularning hech biri
 * "hayzingiz davom etyaptimi?" savolini olmasdi.
 *
 * Shuning uchun SAVOL berish uchun istalgan qon ketish qaydi yetarli.
 * Javob ("ha, davom etyapti" + darajasi) esa ilovaga haqiqiy hayzmi
 * yoki yo'qmi — shuni o'rgatadi.
 */
export interface FlowStreak {
  /** Seriyaning birinchi kuni. */
  start: string;
  /**
   * PERIOD-TRACK-04: seriyada FAQAT dog'lanish bormi.
   *
   * Nega muhim: savol berish uchun dog'lanish yetarli (yuqoridagi izoh),
   * lekin "Hayzingizning 3-kuni" deb DA'VO qilish uchun yetarli emas.
   * Dog'lanish hayz boshlanishi sanalmaydi — u hayz oldidan, ovulyatsiya
   * paytida yoki boshqa sabab bilan bo'lishi mumkin.
   *
   * Production'da ko'rilgan haqiqiy holat (2026-10-03): ayol 2-oktabrda
   * bitta dog'lanish kunini belgilagan, 3-oktabrda esa Telegram'ga
   * "Hayzingizning 2-kuni" degan xabar ketgan. Hayzi boshlanmagan edi.
   * O'sha kuni shunday xabar olgan 12 ayoldan 4 tasida oxirgi qayd
   * faqat dog'lanish edi.
   */
  spottingOnly: boolean;
}

export function lastFlowStreak(logs: { date: string; flow: string | null }[]): FlowStreak | null {
  const byDate = new Map<string, string>();
  for (const l of logs) if (l.flow) byDate.set(l.date, l.flow);
  const dates = [...byDate.keys()].sort();
  if (dates.length === 0) return null;

  // Oxiridan boshlab orqaga yuramiz: kunlar ketma-ket bo'lsa bitta seriya.
  let start = dates[dates.length - 1];
  const streak = [start];
  for (let i = dates.length - 2; i >= 0; i--) {
    if (daysBetween(dates[i], start) === 1) {
      start = dates[i];
      streak.push(start);
    } else break;
  }
  return { start, spottingOnly: streak.every((d) => byDate.get(d) === "spotting") };
}

/** Eski chaqiruvchilar uchun — faqat boshlanish sanasi. */
export function lastFlowStreakStart(logs: { date: string; flow: string | null }[]): string | null {
  return lastFlowStreak(logs)?.start ?? null;
}
