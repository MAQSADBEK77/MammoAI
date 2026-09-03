// O'zbekiston telefon raqami uchun kiritish maskasi — "+998" doim turadi
// (o'chirib bo'lmaydi), undan keyingi 9 ta raqam "## ### ## ##" guruhlarida
// ko'rsatiladi (foydalanuvchi so'rovi: "+998 default turadi qolgani faqat
// number ## ### ## ## usulida bo'ladi"). Ham web (<input onChange>), ham
// mobil (<TextInput onChangeText>) shu bitta funksiyadan foydalanadi.

/** Istalgan xom matnni (foydalanuvchi teramoqda yoki joylashtirmoqda) "+998
 * XX XXX XX XX" ko'rinishiga o'giradi. Raqamlardan boshqa hamma narsa
 * (bo'shliq, tire va h.k.) tashlab yuboriladi, 998 prefiksi takrorlansa ham
 * bitta marta hisoblanadi, 9 tadan ortiq raqam kesib tashlanadi. */
export function formatUzPhoneInput(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("998")) digits = digits.slice(3);
  digits = digits.slice(0, 9);

  let out = "+998";
  if (digits.length > 0) out += " " + digits.slice(0, 2);
  if (digits.length > 2) out += " " + digits.slice(2, 5);
  if (digits.length > 5) out += " " + digits.slice(5, 7);
  if (digits.length > 7) out += " " + digits.slice(7, 9);
  return out;
}

/** Maskalangan qiymatdan bo'shliqsiz "+998XXXXXXXXX" qatorini qaytaradi —
 * agar 9 ta raqam to'liq kiritilmagan bo'lsa, `null` (hali tugallanmagan). */
export function extractUzPhoneDigits(masked: string): string | null {
  let digits = masked.replace(/\D/g, "");
  if (digits.startsWith("998")) digits = digits.slice(3);
  if (digits.length !== 9) return null;
  return `+998${digits}`;
}
