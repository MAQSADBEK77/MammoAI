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
        primary: { DEFAULT: "#F43F7F", dark: "#D62A63", light: "#FFB3CB" },
        secondary: { DEFAULT: "#7C3AED", light: "#C4B5FD" },
        accent: { DEFAULT: "#0D9488", light: "#5EEAD4" },
        background: "#F9FAFB",
        surface: "#FFFFFF",
        "surface-muted": "#F3F4F6",
        "text-primary": "#1F2937",
        "text-secondary": "#4B5563",
        "text-muted": "#9CA3AF",
        border: "#E5E7EB",
        success: "#57B894",
        warning: "#E7A83F",
        danger: "#E0506F",
      },
    },
  },
  plugins: [],
};
