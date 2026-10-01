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
export function lastFlowStreakStart(logs: { date: string; flow: string | null }[]): string | null {
  const dates = [...new Set(logs.filter((l) => l.flow).map((l) => l.date))].sort();
  if (dates.length === 0) return null;

  // Oxiridan boshlab orqaga yuramiz: kunlar ketma-ket bo'lsa bitta seriya.
  let start = dates[dates.length - 1];
  for (let i = dates.length - 2; i >= 0; i--) {
    if (daysBetween(dates[i], start) === 1) start = dates[i];
    else break;
  }
  return start;
}
