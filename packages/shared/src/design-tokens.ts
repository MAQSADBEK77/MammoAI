// Dizayn tokenlari — logo ranglaridan (pushti #F48998, iliq oq #FFFAF1) kelib chiqib,
// texnik hujjatda tasvirlangan "yumshoq pushti/binafsha/ko'k, iliq va ishonchli" yo'nalish.
// Web (Tailwind CSS o'zgaruvchilari) va mobil (NativeWind/JS tema) ikkalasi ham shundan
// o'qiydi — shu orqali ikki ilova bir xil dizaynda bo'ladi.

export const colors = {
  primary: "#F48998", // brend pushtisi (logo)
  primaryDark: "#E06B7C",
  primaryLight: "#FBC4CC",
  secondary: "#B98BD6", // yumshoq binafsha
  secondaryLight: "#E4D3F2",
  accent: "#8FB6E0", // yumshoq ko'k (homiladorlik bo'limi uchun)
  accentLight: "#D9E8F7",

  background: "#FFFAF1", // logo foni — iliq oq
  surface: "#FFFFFF",
  surfaceMuted: "#FBF3E9",

  textPrimary: "#2B2027",
  textSecondary: "#6B5A62",
  textMuted: "#9C8A92",
  border: "#EFE1E6",

  success: "#6FAE8A",
  warning: "#E0A458",
  danger: "#D9707A",

  // Yuqori kontrast rejimi (Profil sozlamasi — funksional bo'lmagan talab: default
  // yuqori kontrast, kattalashtirish imkoniyati)
  highContrast: {
    background: "#FFFFFF",
    textPrimary: "#000000",
    textSecondary: "#1A1A1A",
    border: "#000000",
    primary: "#C43E52",
  },
} as const;

export const fontScale = {
  normal: { body: 16, small: 13, h1: 28, h2: 22, h3: 18, button: 17 },
  large: { body: 19, small: 16, h1: 32, h2: 26, h3: 21, button: 20 },
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
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
