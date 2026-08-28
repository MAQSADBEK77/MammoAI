/**
 * @type {import('tailwindcss').Config}
 * Ranglar packages/shared/src/design-tokens.ts bilan qiymat jihatdan bir xil
 * ushlab turiladi — ikkala ilova ham bir xil dizaynda bo'lishi uchun.
 */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#F48998", dark: "#E06B7C", light: "#FBC4CC" },
        secondary: { DEFAULT: "#B98BD6", light: "#E4D3F2" },
        accent: { DEFAULT: "#8FB6E0", light: "#D9E8F7" },
        background: "#FFFAF1",
        surface: "#FFFFFF",
        "surface-muted": "#FBF3E9",
        "text-primary": "#2B2027",
        "text-secondary": "#6B5A62",
        "text-muted": "#9C8A92",
        border: "#EFE1E6",
        success: "#6FAE8A",
        warning: "#E0A458",
        danger: "#D9707A",
      },
    },
  },
  plugins: [],
};
