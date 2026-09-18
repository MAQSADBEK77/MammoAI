// MOTION-01 (dastlab Landing uchun, MOTION-APP-01'dan boshlab BUTUN ilova
// bo'ylab qayta ishlatiladi — masalan (app)/layout.tsx'dagi PageTransition):
// YAGONA harakat tizimi. globals.css'dagi --motion-* CSS o'zgaruvchilari
// bilan QIYMAT jihatidan ATAYLAB SINXRON — CSS animatsiyalar (masalan blob
// "nafas olishi", ticker, gradient siljishi) o'sha CSS o'zgaruvchilaridan,
// `motion` komponentlari esa shu yerdan bir xil sonlarni oladi. Ikkalasi
// alohida-alohida o'zgartirilsa, ilova bo'ylab "his qilish" (feel)
// izchilligi buziladi — shuning uchun bu fayl yagona haqiqat manbai.

/** "ease-out-expo" turidagi maxsus egri chiziq — yumshoq to'xtash,
 * MammoAI'ning "mehribon, sokin professional" ohangiga mos. */
export const EASE_BRAND: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Soniyalarda (motion `transition.duration` shu birlikni kutadi) —
 * globals.css'dagi --motion-duration-* (millisekund) bilan bir xil qiymat. */
export const DURATION = {
  /** 150ms — mikro-fidbek (tugma bosilishi va h.k.). */
  micro: 0.15,
  /** 400ms — bo'lim-darajasi (karta hover, accordion). */
  section: 0.4,
  /** 700ms — sahifa-darajasidagi katta o'tish (hero, scroll-reveal). */
  page: 0.7,
} as const;

/** Ekranga kirganda pastdan-yuqoriga + xiradan-aniqqa — deyarli barcha
 * scroll-reveal animatsiyalari uchun umumiy variant (Hayot-bosqichi
 * kartalari, Bento, Ishonch va h.k.) — takrorlanmasin deb shu yerda.
 * `custom` (stagger indeksi) `transition.delay`ni hisoblash uchun. */
export const fadeUpVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (custom: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.page, ease: EASE_BRAND, delay: custom },
  }),
};

/** Kichik "pop" — ikonkalar/belgi-kartalar sahifaga kirganda (scale 0.8→1). */
export const popVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (custom: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 20, delay: custom },
  }),
};

/** `useInView`/`whileInView` uchun umumiy sozlama — bir marta (`once`)
 * ishga tushadi (qayta scroll qilinganda takrorlanmaydi, bezovta qilmaydi)
 * va elementning bir qismi (10%) ko'rinishi bilanoq boshlanadi (foydalanuvchi
 * uni to'liq ko'rmaguncha kutib turmaydi). */
export const VIEWPORT_ONCE = { once: true, margin: "-10% 0px -10% 0px" } as const;
