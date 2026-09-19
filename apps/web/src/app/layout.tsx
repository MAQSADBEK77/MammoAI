import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { SessionProvider } from "@/lib/session";
import { MuiThemeProvider } from "@/lib/mui-theme";
import { IllustrationsProvider } from "@/lib/illustrations";
import { AnalyticsProvider } from "@/lib/analytics";
import { TelegramFullscreenSetup } from "@/lib/telegram";

// Iliq, yumaloq shrift — o'zbek (lotin) va rus (kirill) ikkalasini ham qamrab oladi.
// MUHIM: oddiy "cyrillic" quyi to'plami faqat RUS alifbosi uchun yetarli
// harflarni o'z ichiga oladi — o'zbekcha kirillga XOS harflar (Ў/ў, Ғ/ғ,
// Қ/қ, Ҳ/ҳ) undan TASHQARIDA, faqat "cyrillic-ext"da bor. Shu sabab
// tarjima matnida "O'zbekcha (kirill)" tanlanganda aynan shu 4 ta harf
// (o'zbek matnida ENG KO'P uchraydiganlaridan) ko'rinmay/tushib qolgan edi.
const nunito = Nunito({ subsets: ["latin", "cyrillic", "cyrillic-ext"], variable: "--font-body" });

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
  // WEB3-20: apple-touch-icon yo'q edi — iOS'da "Bosh ekranga qo'shish"
  // qilinganda Apple standart (bo'sh/skrinshot) belgi qo'yardi.
  icons: { icon: "/favicon.png", apple: "/apple-touch-icon.png" },
  // PWA manifest — PWABuilder/Bubblewrap orqali Android ilovasini (Trusted
  // Web Activity) BEPUL, package name'ni to'liq o'zi belgilab tayyorlash
  // uchun kerak (Median.co'ning bepul rejasida package name o'zgartirib
  // bo'lmasligi sababli ishlatilgan muqobil yo'l).
  manifest: "/manifest.json",
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

// Foydalanuvchi so'rovi (2026-09-17): "yandex analytics ni ulash kerak ekan".
// Counter ID hali yo'q (Yandex Metrica hisobi ochilmagan) — shuning uchun
// bu butunlay ENV o'zgaruvchi orqali yoqiladi/o'chadi: hisob ochilib,
// counter ID olingach, Vercel'da `NEXT_PUBLIC_YANDEX_METRICA_ID`ni
// o'rnatish kifoya — qayta kod o'zgartirish/deploy shart emas (Vercel'ning
// o'zi env o'zgarishida avtomatik qayta build qiladi). Hozircha bu o'zgaruvchi
// yo'qligi uchun skript butunlay chiqarilmaydi (bo'sh/soxta counter ID bilan
// sinab urinish yo'q).
const YANDEX_METRICA_ID = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID;

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
        {/* Yandex Metrica — 2026-09-17'da foydalanuvchi Yandex'ning o'zi bergan
            aniq skriptni ulashtirdi (counter 112748907); shu skriptning HAR
            BIR sozlamasi (ssr/ecommerce/referrer/url) ATAYLAB SO'ZMA-SO'Z
            saqlangan — o'zboshimchalik bilan soddalashtirilmagan. `webvisor:
            true` — Yandex'ning o'zi ham sessiya-yozuvi/issiqlik xaritasi va
            sahifama-sahifa "qolib ketish" hisobotini beradi (admin panelning
            /admin/analitika'dagi "Sahifama-sahifa qolib ketish" bilan bir
            xil g'oya — biri bizning bazamiz, biri Yandex'ning o'zi). */}
        {YANDEX_METRICA_ID && (
          <>
            <Script
              id="yandex-metrica"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                  m[i].l=1*new Date();
                  for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
                  (window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRICA_ID}", "ym");
                  ym(${Number(YANDEX_METRICA_ID)}, "init", {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});`,
              }}
            />
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element -- Yandex'ning o'zi bergan JS-siz kuzatuv piksel */}
              <img
                src={`https://mc.yandex.ru/watch/${YANDEX_METRICA_ID}`}
                style={{ position: "absolute", left: "-9999px" }}
                alt=""
              />
            </noscript>
          </>
        )}
        {/* Sarlavha panelini shaffof qilib, ilovani ekranning yuqori qismigacha
            kengaytiradi (foydalanuvchi so'rovi) + bo'shab qolgan joyni
            --tg-safe-area-top/bottom CSS o'zgaruvchisi orqali e'lon qiladi
            (lib/telegram.ts). Oddiy brauzerda zararsiz — hech narsa qilmaydi. */}
        <TelegramFullscreenSetup />
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
