// Median.co (median.co) — mavjud mammo.uz saytini native ilova (WebView
// wrapper) sifatida qadoqlash uchun foydalanuvchi tomonidan tanlangan xizmat.
// Median o'zi HECH QANDAY alohida "app" kodini talab qilmaydi — u shunchaki
// butun saytni WebView ichida ochadi. MUAMMO: shu tufayli bosh sahifa
// (LandingPage — marketing/reklama maqsadli) ham native ilova ichida
// ko'rsatilib qolardi, garchi u yerda kerak bo'lmasa ham (foydalanuvchi
// allaqachon ilovani o'rnatgan — "sinab ko'rish" bosqichi ortiqcha).
//
// Yechim: Median o'z ilovasidan yuborilgan har bir so'rovga User-Agent'ga
// standart identifikator qo'shadi (rasmiy hujjat: docs.median.co/docs/
// detecting-app-usage) — iOS'da "MedianIOS/1.0 median", Android'da
// "MedianAndroid/1.0 median". Shunga qarab aniqlab, page.tsx marketing
// LandingPage'ni butunlay o'tkazib yuborib, to'g'ridan-to'g'ri ilovaga
// (onboarding yoki mavjud sessiya bo'lsa asosiy ekranga) yo'naltiradi.
import { useSyncExternalStore } from "react";

export function isMedianApp(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.userAgent.toLowerCase().includes("median");
}

/**
 * APPREVIEW-01 — App Store'dagi iOS ilovasi (Median "MedianIOS").
 *
 * iOS'da Apple qoidalari boshqacha: ilova ichida pullik imkoniyat faqat
 * Apple In-App Purchase orqali sotilishi mumkin (3.1.1) va ilova boshqa
 * ilovani (Telegram) o'rnatishni talab qilmasligi kerak (4.2.3). Shu
 * sababli Premium'ga oid hamma narsa va Telegram'ga majburiy yo'naltirish
 * FAQAT iOS ilovasida o'chiriladi — veb va Android o'zgarmaydi.
 */
export function isMedianIOSApp(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.userAgent.toLowerCase().includes("medianios");
}

const subscribeNoop = () => () => {};

/** Komponentlar uchun: server render va gidratsiya paytida `false`, keyin
 * haqiqiy qiymat — `navigator`ni to'g'ridan-to'g'ri render ichida o'qish
 * server/mijoz HTML nomuvofiqligiga (hydration mismatch) olib kelardi. */
export function useIsMedianIOSApp(): boolean {
  return useSyncExternalStore(subscribeNoop, isMedianIOSApp, () => false);
}
