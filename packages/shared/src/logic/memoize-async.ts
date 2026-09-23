// SCHEMA-RESILIENCE-01 — "faqat muvaffaqiyatni keshla" naqshi.
//
// Nega alohida modul: bu mantiq bir marta production uzilishiga sabab
// bo'lgan (db.ts#ensureSchema izohiga qarang) va uni ko'z bilan tekshirib
// bo'lmaydi — poyga va xato yo'llari ishtirok etadi. Sof funksiya sifatida
// esa to'liq sinovdan o'tkaziladi.

/**
 * `fn` natijasini FAQAT muvaffaqiyatli bo'lganda keshlaydi.
 *
 * Rad etilgan va'da keshlanmaydi — keyingi chaqiruv qaytadan urinadi.
 * Bir vaqtda kelgan chaqiruvlar bitta urinishni bo'lishadi (ya'ni `fn`
 * parallel ravishda ikki marta chaqirilmaydi).
 *
 * `onError` — xato yuz berganda (qayta urinishdan oldin) chaqiriladi,
 * odatda log yozish uchun.
 */
export function memoizeAsyncSuccess<T>(fn: () => Promise<T>, onError?: (error: unknown) => void): () => Promise<T> {
  let cached: Promise<T> | null = null;

  return () => {
    if (cached) return cached;
    const attempt = fn().catch((error: unknown) => {
      // MUHIM: keshni faqat SHU urinish hali joriy bo'lsa tozalaymiz.
      // Aks holda muvaffaqiyatli keyingi urinishning natijasini
      // kechikkan xato bekor qilib yuborishi mumkin edi.
      if (cached === attempt) cached = null;
      onError?.(error);
      throw error;
    });
    cached = attempt;
    return attempt;
  };
}
