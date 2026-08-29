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
