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
        // `primary` CSS o'zgaruvchi orqali — web'da bo'lgani kabi (globals.css
        // `[data-mode="pregnancy"|"planning_pregnancy"]`) joriy maqsadga (hayz/
        // homiladorlik/tayyorgarlik) qarab butunlay boshqa rangga almashishi
        // uchun (ildiz _layout.tsx'da vars() bilan o'rnatiladi, useModeAccent
        // bilan bir xil manbadan). Statik hex bo'lganda "bg-primary"/
        // "text-primary" ishlatilgan barcha ekranlar homiladorlik rejimida
        // ham pushti bo'lib qolardi — web esa binafsha/moviy-yashilga o'tadi.
        primary: { DEFAULT: "var(--color-primary)", dark: "var(--color-primary-dark)", light: "var(--color-primary-light)" },
        secondary: { DEFAULT: "#7C3AED", light: "#C4B5FD" },
        accent: { DEFAULT: "#0D9488", light: "#5EEAD4" },
        // Yorug'/qorong'u rejimlar orasida almashadigan tokenlar — statik hex
        // emas, CSS o'zgaruvchisi orqali (NativeWind v4 `vars()`, ildiz
        // _layout.tsx'da o'rnatiladi, lib/theme.ts'dagi useResolvedTheme'ga
        // qarab). Brend ranglari (yuqorida) ikkala rejimda ham bir xil qoladi.
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        "surface-muted": "var(--color-surface-muted)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted": "var(--color-text-muted)",
        border: "var(--color-border)",
        success: "#57B894",
        warning: "#E7A83F",
        danger: "#E0506F",
        // "Aurora" kengaytmasi — suzuvchi tungi-siyoh navigatsiya paneli va h.k.
        // (packages/shared/src/design-tokens.ts#gradients bilan bir xil).
        nav: { DEFAULT: "#241127", light: "#3B1B45" },
      },
      borderRadius: {
        "4xl": "28px",
        "5xl": "32px",
      },
    },
  },
  plugins: [],
};
