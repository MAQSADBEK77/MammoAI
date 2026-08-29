// Dizayn tokenlari — Dribbble "Lunari — Period Tracker App UI Kit" uslubiga
// moslashtirilgan (foydalanuvchi skrinshotlar orqali ulashgan namuna): jasur/
// to'yingan pushti, oq fon, to'liq aylana ("pill") tugmalar, yumshoq soyali kartalar.
// Web (Tailwind CSS o'zgaruvchilari) va mobil (NativeWind/JS tema) ikkalasi ham
// shundan o'qiydi — shu orqali ikki ilova bir xil dizaynda bo'ladi.

export const colors = {
  primary: "#EE3F73", // Lunari uslubidagi jasur pushti-qizil
  primaryDark: "#C82F5C",
  primaryLight: "#FCD9E3",
  secondary: "#8B6FD1", // binafsha (accent variatsiyasi uchun)
  secondaryLight: "#E6DFF7",
  accent: "#5FB6C4", // moviy-yashil (unumdor oyna, homiladorlik uchun)
  accentLight: "#DCF1F3",

  background: "#FFFFFF", // Lunari — asosiy ekranlarda oq fon
  surface: "#FFFFFF",
  surfaceMuted: "#F7F5F6",

  textPrimary: "#241B26",
  textSecondary: "#6E6470",
  textMuted: "#A79EA9",
  border: "#F0EBEE",

  success: "#57B894",
  warning: "#E7A83F",
  danger: "#E0506F",

  // Yuqori kontrast rejimi (Profil sozlamasi — funksional bo'lmagan talab: default
  // yuqori kontrast, kattalashtirish imkoniyati)
  highContrast: {
    background: "#FFFFFF",
    textPrimary: "#000000",
    textSecondary: "#1A1A1A",
    border: "#000000",
    primary: "#B01446",
  },
} as const;

export const fontScale = {
  normal: { body: 16, small: 13, h1: 28, h2: 22, h3: 18, button: 17 },
  large: { body: 19, small: 16, h1: 32, h2: 26, h3: 21, button: 20 },
} as const;

// Lunari uslubi: tugmalar to'liq aylana ("pill"), kartalar kattaroq radiusda.
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
