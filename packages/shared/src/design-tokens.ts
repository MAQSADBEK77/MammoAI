// Dizayn tokenlari — https://fetch-blush-80931080.figma.site/ ("Lunari") manba
// kodidan (JS/CSS bundle) chiqarib olingan ANIQ rang qiymatlari asosida. Bu screenshot
// emas, haqiqiy ishlaydigan React ilovasining kompilyatsiya qilingan CSS/JS'idan
// topilgan hex kodlar — shuning uchun taxminiy emas, aniq.
// Web (Tailwind CSS o'zgaruvchilari) va mobil (NativeWind/JS tema) ikkalasi ham
// shundan o'qiydi — shu orqali ikki ilova bir xil dizaynda bo'ladi.

export const colors = {
  primary: "#F43F7F", // manba: asosiy pushti-qizil
  primaryDark: "#D62A63",
  primaryLight: "#FFB3CB",
  secondary: "#7C3AED", // manba: binafsha
  secondaryLight: "#C4B5FD",
  accent: "#0D9488", // manba: moviy-yashil (unumdor oyna, homiladorlik uchun)
  accentLight: "#5EEAD4",

  background: "#F9FAFB", // manba: asosiy ekranlar foni (juda och kulrang)
  surface: "#FFFFFF",
  surfaceMuted: "#F3F4F6",

  textPrimary: "#1F2937",
  textSecondary: "#4B5563",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",

  success: "#57B894",
  warning: "#E7A83F",
  danger: "#E0506F",

} as const;

// Qorong'u rejim — faqat fon/matn/chegara tokenlari almashadi (brend ranglari
// — primary/secondary/accent/success/warning/danger/nav — ikkala rejimda ham
// bir xil qoladi, xuddi `[data-mode="pregnancy"]` faqat primary'ni almashtirgani
// kabi). Web `globals.css`dagi `[data-theme="dark"]` bloki va mobil
// `lib/theme.ts`dagi `useThemeColors()` shu qiymatlardan o'qiydi.
export const darkColors = {
  background: "#0B0F17",
  surface: "#161B26",
  surfaceMuted: "#1F2633",
  textPrimary: "#F3F4F6",
  textSecondary: "#B9C0CC",
  textMuted: "#6B7280",
  border: "#2A3140",
} as const;

// `colors`/`darkColors` `as const` bilan e'lon qilingani uchun har bir
// tokenning tipi o'zining ANIQ hex literaliga teng (masalan "#F9FAFB") — ikki
// rejimdan birini shartli qaytaradigan funksiya shu literallarni birlashtira
// olmaydi, shuning uchun qaytish tipi keng (oddiy `string`) qilib olinadi.
export type ColorPalette = { [K in keyof typeof colors]: string };

/** Joriy hal qilingan mavzuga (light/dark) mos to'liq rang to'plamini
 * qaytaradi — web (MuiThemeProvider) va mobil (useThemeColors) bir xil
 * manbadan o'qiydi, alohida takrorlanmaydi. */
export function resolveThemeColors(mode: "light" | "dark"): ColorPalette {
  return mode === "dark" ? { ...colors, ...darkColors } : colors;
}

export const fontScale = {
  normal: { body: 16, small: 13, h1: 28, h2: 22, h3: 18, button: 17 },
  large: { body: 19, small: 16, h1: 32, h2: 26, h3: 21, button: 20 },
} as const;

// Tugmalar to'liq aylana ("pill"), kartalar kattaroq radiusda.
export const radii = {
  sm: 12,
  md: 20,
  lg: 28,
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Katta teginish nishoni — spec: "bitta qo'l bilan foydalanish qulay, katta tugmalar"
export const minTouchTarget = 48;

export const cycleColors = {
  period: colors.primary,
  fertile: colors.accent,
  predicted: colors.primaryLight,
} as const;

// "Aurora" tema kengaytmasi — 2026-08-30 kechasi dizayn yangilanishi. Ikkita
// premium UI-kit (binafsha "Pregnancy Monitor" va pushti/tungi "Lunari") dan
// ilhomlanib, MammoAI'ning o'z brend ranglariga (pushti+binafsha+moviy-yashil)
// moslab qurilgan gradient/shisha/soya tizimi. Web va mobil bir xil qiymatdan
// o'qiydi (bu yerda va globals.css/tailwind.config.js'da qo'lda takrorlangan).
export const gradients = {
  // Onboarding/hero fonlar uchun orzu-uslub pushti→lavanda o'tish.
  hero: ["#FDE6EF", "#EFE7FC"] as [string, string],
  heroStrong: ["#FBD3E6", "#DCCEFA"] as [string, string],
  cycle: [colors.primary, colors.primaryDark] as [string, string],
  pregnancy: [colors.secondary, "#4C1D95"] as [string, string],
  checkup: [colors.accent, "#0F766E"] as [string, string],
  // Suzuvchi pastki navigatsiya paneli — chuqur tun-siyoh rang (Lunari
  // tungi rejimidan ilhomlangan), ustida gradient faol doira bilan.
  navBar: ["#241127", "#3B1B45"] as [string, string],
  navActive: [colors.primary, colors.secondary] as [string, string],
  // Profil "shaxsiy" gradienti — Figma referens dizayniga moslab pushti→to'q
  // pushti (ilgari pushti→binafsha edi).
  profile: [colors.primary, colors.primaryDark] as [string, string],
} as const;

// RN'da haqiqiy backdrop-blur yo'q (expo-blur qo'shilmagan), shuning uchun
// "shisha" hissi yarim shaffof oq/qora qatlam + nozik border + soya orqali
// taqlid qilinadi — LinearGradient fonlar ustida joylashtirilganda ishlaydi.
export const glass = {
  light: "rgba(255,255,255,0.62)",
  lightStrong: "rgba(255,255,255,0.82)",
  border: "rgba(255,255,255,0.55)",
  dark: "rgba(36,17,39,0.55)",
  darkStrong: "rgba(36,17,39,0.78)",
} as const;

export const shadow = {
  soft: {
    shadowColor: "#3B1B45",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  card: {
    shadowColor: "#1F2937",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;
