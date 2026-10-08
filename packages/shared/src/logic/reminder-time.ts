/**
 * REMIND-HOUR-01 — eslatma ayolning O'Z faol vaqtida yuborilsin.
 *
 * Ilgari hamma uchun bitta vaqt bor edi: Toshkent bo'yicha 20:00.
 * Production analitikasi (30 kun, 261 ayol, push soatining o'zi hisobdan
 * chiqarilgan holda) ko'rsatdiki, faollik ancha keng tarqalgan:
 *
 *     18:00 — 65 ayol   (eng katta cho'qqi)
 *     19:00 — 23
 *     14:00 — 21
 *     09:00 — 16,  11:00 — 15,  13:00 — 15,  10:00 — 14
 *
 * Ya'ni ertalabki guruh sezilarli, lekin unga xabar kechqurun borardi —
 * ya'ni u o'sha kuni ilovani allaqachon ochib bo'lgan paytda.
 *
 * Nega "eng yaqin oyna", "aniq soat" emas: cron chaqiruvlari soni
 * cheklangan. Oyna qo'shilsa, bu yerga bitta raqam qo'shiladi va
 * mantiq o'zgarmaydi.
 */

/** Yuborish oynalari — Toshkent soati bo'yicha. */
export const REMINDER_SLOTS = [9, 20] as const;

/** Faolligi noma'lum ayol uchun — eski xatti-harakat (kechqurun). */
export const DEFAULT_REMINDER_SLOT = 20;

/**
 * Ayolning eng faol soatiga ENG YAQIN oyna.
 *
 * Teng masofada kechki oyna tanlanadi: ertalabki xabar kunni boshlashga
 * ulguradi, lekin ayol hali uyqudan turmagan bo'lsa yo'qoladi; kechqurungi
 * esa deyarli har doim o'qiladi.
 */
export function nearestReminderSlot(preferredHour: number | null | undefined): number {
  if (preferredHour === null || preferredHour === undefined || !Number.isFinite(preferredHour)) {
    return DEFAULT_REMINDER_SLOT;
  }
  const hour = Math.min(23, Math.max(0, Math.round(preferredHour)));
  let best = DEFAULT_REMINDER_SLOT;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const slot of REMINDER_SLOTS) {
    // Sutka aylana: 23:00 va 00:00 orasi bir soat, 23 soat emas.
    const diff = Math.abs(hour - slot);
    const distance = Math.min(diff, 24 - diff);
    if (distance < bestDistance || (distance === bestDistance && slot > best)) {
      best = slot;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Shu chaqiruvda shu ayolga yuborilsinmi.
 *
 * `fallbackSlot` — kuniga BITTA chaqiruv bo'lganda ishlaydigan zaxira:
 * o'sha chaqiruvda hamma qolganlar ham xabarini oladi. Shu sababli cron
 * chastotasi oshirilmasa ham, xatti-harakat BUZILMAYDI — faqat hamma
 * eski vaqtda oladi.
 */
export function shouldSendAtHour(
  preferredHour: number | null | undefined,
  currentHour: number,
  fallbackSlot: number = DEFAULT_REMINDER_SLOT
): boolean {
  if (nearestReminderSlot(preferredHour) === currentHour) return true;
  return currentHour === fallbackSlot;
}
