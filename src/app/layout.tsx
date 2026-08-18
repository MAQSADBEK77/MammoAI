import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { LanguageProvider } from "@/lib/i18n/context";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

// Stamps the .dark class before React hydrates, so there's no flash of the
// wrong theme on load. Keep this in sync with lib/theme-context.tsx.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("mammoai:theme");
    var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "MammoAI — Ko'krak saratonini erta aniqlash tizimi",
  description:
    "MammoAI — ko'krak saratoni xavf omillarini onlayn baholash, shaxsiy kabinet va tibbiy nazorat tizimi.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon-32.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#d94f87",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      {/* Base/body text color is the brand's "Asosiy text" (Dark Gray) — the
          few components that don't set an explicit text color inherit this. */}
      <body className="min-h-full flex flex-col bg-white text-[#333333] dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              {children}
              <ServiceWorkerRegister />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
