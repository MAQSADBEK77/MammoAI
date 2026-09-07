import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { SessionProvider } from "@/lib/session";
import { MuiThemeProvider } from "@/lib/mui-theme";
import { IllustrationsProvider } from "@/lib/illustrations";
import { AnalyticsProvider } from "@/lib/analytics";

// Iliq, yumaloq shrift — o'zbek (lotin) va rus (kirill) ikkalasini ham qamrab oladi.
const nunito = Nunito({ subsets: ["latin", "cyrillic"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Ayollar salomatligi",
  description: "Hayz tsikli, homiladorlik va tekshiruv kuzatuvchisi",
  // logo.svg endi faqat shaffof (fonsiz) belgi — bryauzer tab fonida ko'rinmasligi
  // mumkin, shuning uchun favicon uchun brend-fonli PNG ishlatiladi.
  icons: { icon: "/favicon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={nunito.variable}>
      <body>
        {/* Telegram Mini App SDK — o'zimizda joylashtirib bo'lmaydi (Telegram
            tomonidan doimiy yangilanib turadi), shuning uchun to'g'ridan-to'g'ri
            telegram.org'dan yuklanadi. Oddiy brauzerda zararsiz — window.Telegram
            aniqlanmaydi, lib/telegram.ts shunga qarab ishlaydi. */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <I18nProvider>
          <SessionProvider>
            <IllustrationsProvider>
              <MuiThemeProvider>
                <AnalyticsProvider>{children}</AnalyticsProvider>
              </MuiThemeProvider>
            </IllustrationsProvider>
          </SessionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
