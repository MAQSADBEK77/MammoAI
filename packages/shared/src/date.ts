// `Date#toISOString()` har doim UTC'ga o'giradi — musbat UTC-offset'li mintaqalarda
// (masalan, O'zbekiston, UTC+5) bu "bugun"ni haqiqiy mahalliy kundan BIR KUN ORQAGA
// suradi (masalan, mahalliy 00:00-04:59 oralig'ida UTC hali kechagi kun bo'ladi).
// Bu funksiya `Date` obyektining MAHALLIY yil/oy/kun qiymatlaridan to'g'ridan-to'g'ri
// "YYYY-MM-DD" satr yasaydi — hech qanday UTC konvertatsiyasiz.
export function localDateStr(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// FIX2-16/FIX2-23: `localDateStr()` yuqoridagi kabi JS DVIZHOK'ning
// KONFIGURATSIYA QILINGAN mahalliy vaqt zonasidan (`Date#getFullYear/
// getMonth/getDate`) foydalanadi — bu faqat OS/runtime `TZ` o'zgaruvchisi
// "Asia/Tashkent"ga o'rnatilgan bo'lsagina to'g'ri natija beradi. Loyihada
// Vercel Node funksiyalari uchun `TZ` HECH QAERDA o'rnatilmagan (standart —
// UTC), shuning uchun serverda `localDateStr()`ning o'zi ham UTC kalendar
// sanasini qaytaradi — Toshkent mahalliy 00:00-04:59 oralig'ida bu "kecha"gi
// sana bo'lib chiqadi. `tashkentDateStr()` esa `Intl.DateTimeFormat`ning
// aniq `timeZone: "Asia/Tashkent"` parametri orqali, server/runtime
// sozlamasidan MUSTAQIL ravishda har doim to'g'ri mahalliy sanani beradi —
// sikl/homiladorlik bashorati va gamifikatsiya/statistika kabi "bugun"ga
// bog'liq barcha server-tomon hisob-kitoblar shundan foydalanishi kerak.
const TASHKENT_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tashkent",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function tashkentDateStr(d: Date = new Date()): string {
  // "en-CA" locale'i Intl'da "YYYY-MM-DD" formatini beradi.
  return TASHKENT_DATE_FORMATTER.format(d);
}

/** "YYYY-MM-DD" (yoki shu bilan boshlanuvchi ISO) sanani foydalanuvchiga
 * ko'rsatish uchun "DD.MM.YYYY" formatiga o'giradi — App bo'ylab yagona sana
 * ko'rinishi (foydalanuvchi so'rovi: "sanalar hamma joyda shu formatda"). */
export function formatDateDisplay(dateStr: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!match) return dateStr;
  const [, year, month, day] = match;
  return `${day}.${month}.${year}`;
}
