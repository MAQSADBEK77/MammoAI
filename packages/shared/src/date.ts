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

/** "YYYY-MM-DD" (yoki shu bilan boshlanuvchi ISO) sanani foydalanuvchiga
 * ko'rsatish uchun "DD.MM.YYYY" formatiga o'giradi — App bo'ylab yagona sana
 * ko'rinishi (foydalanuvchi so'rovi: "sanalar hamma joyda shu formatda"). */
export function formatDateDisplay(dateStr: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!match) return dateStr;
  const [, year, month, day] = match;
  return `${day}.${month}.${year}`;
}
