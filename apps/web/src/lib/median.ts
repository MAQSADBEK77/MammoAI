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
export function isMedianApp(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.userAgent.toLowerCase().includes("median");
}
