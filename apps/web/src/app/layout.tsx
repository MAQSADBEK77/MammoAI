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

const SITE_URL = "https://mammo.uz";
const SITE_TITLE = "MammoAI — Ayollar salomatligi";
const SITE_DESCRIPTION =
  "Hayz tsikli, homiladorlik va tibbiy tekshiruvlarni bir joyda kuzating. AI yordamchi, jamiyat va klinikalar — butunlay o'zbek tilida, bepul.";

export const metadata: Metadata = {
  // Nisbiy URL'larni (masalan openGraph.images) to'liq manzilga aylantirish
  // uchun shart — bo'lmasa Next.js localhost asosida yasab, ijtimoiy tarmoq/
  // qidiruv tizimi oldindan ko'rishida buzilib chiqadi.
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s — MammoAI` },
  description: SITE_DESCRIPTION,
  keywords: ["hayz kalendari", "homiladorlik kuzatuvi", "ayollar salomatligi", "sikl kalkulyatori", "MammoAI"],
  alternates: { canonical: SITE_URL },
  // logo.svg endi faqat shaffof (fonsiz) belgi — bryauzer tab fonida ko'rinmasligi
  // mumkin, shuning uchun favicon uchun brend-fonli PNG ishlatiladi.
  icons: { icon: "/favicon.png" },
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    url: SITE_URL,
    siteName: SITE_TITLE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/app-preview-1.png", width: 624, height: 1168, alt: SITE_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/app-preview-1.png"],
  },
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
