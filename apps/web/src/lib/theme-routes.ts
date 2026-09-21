/**
 * THEME-01 — mavzu MAJBURAN yorug' bo'ladigan sahifalar.
 *
 * Nega kerak: onboarding va Telegram kirish oqimi — SESSIYADAN OLDINGI
 * ekranlar. Foydalanuvchi hali kirmagan, ya'ni uning mavzu tanlovi bizga
 * ma'lum emas, shuning uchun ilova qurilma sozlamasiga ergashardi. Natijada
 * telefoni qorong'u rejimda bo'lgan odam onboarding'ni qorong'uda ko'rardi —
 * holbuki referens dizayn (logo, gradient, rang zonalari, Telegram tugmasining
 * ko'k rangi) YORUG' fon uchun chizilgan.
 *
 * Mahsulot qarori (2026-09-21): birinchi taassurot brend nazoratida bo'lishi
 * kerak. Kirgandan keyin foydalanuvchining o'z tanlovi to'liq ishlaydi.
 *
 * Ro'yxat SHU YERDA yagona — ikki joyda ishlatiladi va ular bir-biriga zid
 * bo'lmasligi shart:
 *   1) `app/layout.tsx`dagi bloklovchi inline skript — birinchi bo'yashda
 *      (React'dan OLDIN), shu orqali qorong'u "yaltirash" bo'lmaydi;
 *   2) `lib/session.tsx`dagi mavzu effekti — `/api/me` javob bergach mavzuni
 *      qayta qo'llaydi va agar bu tekshiruv bo'lmasa, yorug'ni qorong'uga
 *      almashtirib yuborardi.
 */
export const FORCED_LIGHT_PREFIXES = ["/onboarding", "/tg"] as const;

export function isForcedLightPath(pathname: string): boolean {
  return FORCED_LIGHT_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
