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
        primary: { DEFAULT: "#EE3F73", dark: "#C82F5C", light: "#FCD9E3" },
        secondary: { DEFAULT: "#8B6FD1", light: "#E6DFF7" },
        accent: { DEFAULT: "#5FB6C4", light: "#DCF1F3" },
        background: "#FFFFFF",
        surface: "#FFFFFF",
        "surface-muted": "#F7F5F6",
        "text-primary": "#241B26",
        "text-secondary": "#6E6470",
        "text-muted": "#A79EA9",
        border: "#F0EBEE",
        success: "#57B894",
        warning: "#E7A83F",
        danger: "#E0506F",
      },
    },
  },
  plugins: [],
};
