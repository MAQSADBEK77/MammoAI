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
  // Google Search Console — mulkni tasdiqlash uchun (foydalanuvchi so'rovi bilan qo'shildi).
  verification: { google: "B8SNUTi-DyBjndWe-QIY6wzg_VQ2a_Hb5gngp6EJlVM" },
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
  // OS darajasida qorong'u bo'lsa brauzer manzil panelining rangi ham mos
  // keladi — ilova ichidagi aniq tanlov (yorug'/qorong'u/tizim) runtime
  // JS holati, statik metadata uni bilmaydi, shuning uchun faqat
  // `prefers-color-scheme`ga qarab ikkita variant (ko'pchilik holat uchun yetarli).
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F17" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={nunito.variable} suppressHydrationWarning>
      <body>
        {/* Sahifa bo'yalishidan OLDIN (hidratsiyadan oldin) ishlaydi — aks holda
            <html> har doim yorug' rejimda chizilib, keyin qorong'u rejimga
            "yaltirab" o'tadi (foydalanuvchi tanlovi `/api/me` javob bergunga
            qadar noma'lum). lib/session.tsx shu bilan bir xil kalit/mantiqni
            ishlatadi (localStorage'ni yozib turadi). */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("mammoai_theme");var dark=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=dark?"dark":"light";}catch(e){}})();`,
          }}
        />
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
