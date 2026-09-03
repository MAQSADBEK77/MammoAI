// Klinika kartasi uchun ko'rgazmali (reyting/ish vaqti) qiymatlar — real
// backend maydonlari hali yo'q (Clinic jadvalida rating/soatlar ustuni yo'q),
// shuning uchun klinika id'sidan deterministik hisoblanadi. Bu bo'lim
// allaqachon "Namunaviy ma'lumot" deb belgilangan (dict.clinics.seedDataNotice),
// shu bilan bir xil ruhda — ekrandan ekranga bir xil qiymat chiqadi, tasodifiy
// emas. Web va mobil ikkalasi ham shu funksiyalardan foydalanadi.

function hashString(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash;
}

const HOURS_PRESETS = ["Du–Ju: 8:00–18:00", "Du–Sh: 9:00–19:00", "Har kuni: 8:00–20:00", "Du–Ju: 9:00–18:00"];

/** 4.3–4.9 oralig'ida, klinika id'siga bog'liq barqaror reyting. */
export function getClinicRating(id: string): number {
  const hash = hashString(id);
  return 4.3 + (hash % 7) / 10;
}

/** Ish vaqti — bir nechta odatiy variantdan biri, id'ga bog'liq. */
export function getClinicHours(id: string): string {
  const hash = hashString(id);
  return HOURS_PRESETS[hash % HOURS_PRESETS.length];
}

/** Reytingi yuqori klinikalar "Top klinika" belgisini oladi. */
export function isTopClinic(rating: number): boolean {
  return rating >= 4.7;
}
