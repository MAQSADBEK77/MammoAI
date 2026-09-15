"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import {
  CalendarMonthOutlined,
  PregnantWomanOutlined,
  LocalHospitalOutlined,
  GroupsOutlined,
  LocationOnOutlined,
  MenuBookOutlined,
  ShieldOutlined,
  CheckCircleOutlined,
  TranslateOutlined,
  KeyboardArrowDownOutlined,
  ExpandMoreOutlined,
} from "@mui/icons-material";
import { useI18n } from "@/lib/i18n";
import { useIllustrations } from "@/lib/illustrations";
import { Button, Card } from "@/components/ui";

const FEATURE_KEYS = ["cycle", "pregnancy", "checkups", "community", "clinics", "articles"] as const;
const FEATURE_ICONS = [
  CalendarMonthOutlined,
  PregnantWomanOutlined,
  LocalHospitalOutlined,
  GroupsOutlined,
  LocationOnOutlined,
  MenuBookOutlined,
];
const TRUST_ICONS = [ShieldOutlined, CheckCircleOutlined, TranslateOutlined, LocationOnOutlined];

// 2026-09-15 dizayn yangilanishi (lalu.uz'dan ilhomlangan): uchta brend rangi
// (pushti/binafsha/moviy-yashil — MammoAI'ning o'zining mavjud tokenlari,
// design-tokens.ts) navbat bilan ishlatiladi — bir xil rangdagi "quruq"
// ro'yxat o'rniga lalu uslubidagi rang xilma-xilligi, lekin YANGI palitra
// EMAS (butun ilova bo'ylab ishlatiladigan --color-primary/secondary/accent
// tokenlariga tayanadi, shuning uchun qorong'u rejimda ham xavfsiz).
const ACCENT_CHIP_CLASSES = ["bg-primary/10 text-primary", "bg-secondary/10 text-secondary", "bg-accent/10 text-accent"];
const ACCENT_SOLID_CLASSES = ["bg-primary", "bg-secondary", "bg-accent"];
const ACCENT_TEXT_CLASSES = ["text-primary", "text-secondary", "text-accent"];

const HOW_ANCHOR = "qanday-ishlaydi";
const FEATURES_ANCHOR = "imkoniyatlar";
const TRUST_ANCHOR = "ishonch";
const FAQ_ANCHOR = "savol-javob";

/** Bo'lim fonidagi dekorativ illyustratsiya — juda xira (o'qishga xalaqit
 * bermaydi), sahifaga "quruq" oq/kulrang bo'lib qolmasligi uchun chuqurlik
 * beradi. Har doim `overflow-hidden relative` bo'limning ICHIDA, tarkibdan
 * OLDIN chaqiriladi (z-index bilan orqaga suriladi). */
function BgArt({ src, className }: { src: string; className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- fon uchun dekorativ SVG, next/image kerak emas
    <img src={src} alt="" aria-hidden className={clsx("pointer-events-none absolute -z-10 opacity-25 select-none", className)} />
  );
}

/** lalu.uz uslubidagi "organik" (blob) dekorativ shakl — burchaklari
 * notekis radiusli, xira va xiralashtirilgan, faqat fon chuqurligi uchun.
 * Yangi rasm/SVG kerak emas — sof CSS border-radius texnikasi. */
function BlobArt({ className }: { className: string }) {
  return <div aria-hidden className={clsx("pointer-events-none absolute -z-10 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-2xl", className)} />;
}

// Ilovaning haqiqiy ekranlaridan olingan skrinshotlar (namunaviy ma'lumot bilan) —
// tsikl, homiladorlik, tekshiruvlar, hamkor va hamjamiyat. Yasama illyustratsiya
// emas, real UI — bir nechtasi navbat bilan almashinib turadi ("animatsiyaga
// o'xshab" ochilishi uchun).
const APP_PREVIEWS = ["/app-preview-1.png", "/app-preview-2.png", "/app-preview-3.png", "/app-preview-4.png", "/app-preview-5.png"];
const PREVIEW_INTERVAL_MS = 2800;

function AppPreviewCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % APP_PREVIEWS.length), PREVIEW_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mt-2">
      <BlobArt className="left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 bg-primary-light/50" />
      <BlobArt className="left-1/2 top-1/2 h-64 w-64 -translate-x-[65%] -translate-y-[35%] rotate-45 bg-accent-light/30" />
      <div className="relative w-[220px] -rotate-2 overflow-hidden rounded-[2rem] border-[8px] border-[#1f2937] bg-[#1f2937] shadow-2xl">
        <div className="absolute left-1/2 top-2 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-[#1f2937]" />
        <div className="relative aspect-[624/1168] w-full">
          {APP_PREVIEWS.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- statik skrinshot, next/image optimizatsiyasi kerak emas
            <img
              key={src}
              src={src}
              alt=""
              className={clsx("absolute inset-0 h-full w-full transition-opacity duration-700 ease-in-out", i === index ? "opacity-100" : "opacity-0")}
            />
          ))}
        </div>
      </div>
      <div className="mt-4 flex justify-center gap-1.5">
        {APP_PREVIEWS.map((_, i) => (
          <span key={i} className={clsx("h-1.5 rounded-full transition-all duration-500", i === index ? "w-5 bg-primary" : "w-1.5 bg-primary/25")} />
        ))}
      </div>
    </div>
  );
}

/**
 * mammo.uz'ga birinchi marta (anonim, ro'yxatdan o'tmagan holatda) kirilganda
 * ko'rsatiladigan marketing bosh sahifasi (referens: flo.health, helloclue.com,
 * 2026-09-15'dan boshlab lalu.uz uslubidagi iliq/yumaloq dizayn yangilanishi
 * bilan — ko'p bandli navigatsiya, "raqam + izoh" fakt-qatori, navbatlashuvchi
 * brend ranglari, organik "blob" fon shakllari). "Bepul sinab ko'rish" tugmasi
 * bosilganda haqiqiy ilovaga (onboarding) o'tadi — sessiya bo'lgan
 * foydalanuvchilar bu sahifani umuman ko'rmaydi (page.tsx'da to'g'ridan-to'g'ri
 * ilovaga yo'naltiriladi).
 */
export function LandingPage({ onStart }: { onStart: () => void }) {
  const { dict } = useI18n();
  const { resolve } = useIllustrations();
  const l = dict.landing;

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex shrink-0 items-center gap-2.5">
            {/* logo.svg — faqat shaffof (fonsiz) belgi, shuning uchun favicon.png'dagi kabi
                brend-rangли fonga joylashtiriladi (aks holda oq navbar ustida ko'rinmay qoladi). */}
            <div className="bg-aurora-cycle flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element -- SVG, next/image optimizatsiyasi kerak emas */}
              <img src="/logo.svg" alt="" className="h-5 w-5" />
            </div>
            <span className="text-lg font-extrabold text-text-primary">MammoAI</span>
          </div>
          {/* lalu.uz uslubidagi ko'p bandli navigatsiya — mobilda joy tejash
              uchun yashirilgan (logo + CTA yetarli), md+ ekranda ko'rinadi. */}
          <nav className="hidden items-center gap-6 md:flex">
            <a href={`#${HOW_ANCHOR}`} className="text-sm font-semibold text-text-secondary transition hover:text-text-primary">
              {l.navLinks.howItWorks}
            </a>
            <a href={`#${FEATURES_ANCHOR}`} className="text-sm font-semibold text-text-secondary transition hover:text-text-primary">
              {l.navLinks.features}
            </a>
            <a href={`#${TRUST_ANCHOR}`} className="text-sm font-semibold text-text-secondary transition hover:text-text-primary">
              {l.navLinks.trust}
            </a>
            <a href={`#${FAQ_ANCHOR}`} className="text-sm font-semibold text-text-secondary transition hover:text-text-primary">
              {l.navLinks.faq}
            </a>
          </nav>
          <Button onClick={onStart} className="px-5! py-2! text-sm! shrink-0">
            {l.navCta}
          </Button>
        </div>
      </header>

      <section className="bg-landing-hero relative isolate overflow-hidden">
        <BgArt src={resolve("landing.heroLeft")} className="-left-16 -top-10 h-72 w-72 -rotate-12 md:h-96 md:w-96" />
        <BgArt src={resolve("landing.heroRight")} className="-right-14 bottom-0 h-64 w-64 rotate-6 md:h-80 md:w-80" />
        <div className="animate-fade-in-up relative mx-auto flex max-w-5xl flex-col items-center gap-6 px-5 pb-14 pt-14 text-center md:pt-20">
          <span className="rounded-full bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-primary shadow-sm">
            {l.heroEyebrow}
          </span>
          {/* MUHIM: bu bo'lim (bg-landing-hero) qorong'u rejimda ham DOIM
              o'zgarmaydigan iliq pastel gradient fon — shuning uchun matn
              rangi ham QORONG'U REJIMGA MOSLASHUVCHI tokenlar (text-text-
              primary/secondary, ular qorong'u rejimda OCH rangga almashadi
              va shu och pastel fonda o'qib bo'lmay qolardi) EMAS, qat'iy
              (light-mode qiymati bilan bir xil) ranglarda yozilgan. */}
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight text-[#1f2937] md:text-5xl">{l.heroTitle}</h1>
          <p className="max-w-xl text-lg text-[#4b5563]">{l.heroSubtitle}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button onClick={onStart} className="px-8! py-3! text-base!">
              {l.ctaPrimary}
            </Button>
            <a
              href={`#${HOW_ANCHOR}`}
              className="tap-target flex items-center gap-1 text-sm font-semibold text-[#4b5563] transition hover:text-[#1f2937]"
            >
              {l.ctaSecondary}
              <KeyboardArrowDownOutlined fontSize="small" />
            </a>
          </div>
          <AppPreviewCarousel />
        </div>
      </section>

      {/* lalu.uz uslubidagi qisqa "raqam + izoh" fakt-qatori — soxta
          foydalanuvchi soni/reyting emas, kodning o'zidan tekshirilgan
          haqiqiy faktlar (dict.landing.factsStrip izohiga qarang). */}
      <section className="border-y border-border/60 bg-surface">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-y-6 px-5 py-10 sm:grid-cols-4">
          {l.factsStrip.map((fact, i) => (
            <div key={i} className="text-center">
              <p className={clsx("text-3xl font-extrabold", ACCENT_TEXT_CLASSES[i % 3])}>{fact.value}</p>
              <p className="mt-1 text-xs text-text-secondary">{fact.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id={FEATURES_ANCHOR} className="relative isolate overflow-hidden">
        <BgArt src={resolve("landing.features")} className="-right-16 -top-16 h-72 w-72 rotate-6 md:h-96 md:w-96" />
        <div className="relative mx-auto max-w-5xl px-5 py-16">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-extrabold text-text-primary md:text-3xl">{l.featuresTitle}</h2>
            <p className="mt-2 text-text-secondary">{l.featuresSubtitle}</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_KEYS.map((key, i) => {
              const Icon = FEATURE_ICONS[i];
              const f = l.features[key];
              return (
                <Card key={key} className="p-6!">
                  <div className={clsx("mb-3 flex h-12 w-12 items-center justify-center rounded-2xl", ACCENT_CHIP_CLASSES[i % 3])}>
                    <Icon />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary">{f.title}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{f.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id={HOW_ANCHOR} className="relative isolate overflow-hidden bg-surface-muted py-16">
        <BgArt src={resolve("landing.howItWorks")} className="-left-16 -bottom-10 h-64 w-64 -rotate-6 md:h-80 md:w-80" />
        <div className="relative mx-auto max-w-4xl px-5">
          <h2 className="text-center text-2xl font-extrabold text-text-primary md:text-3xl">{l.howTitle}</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {l.howSteps.map((step, i) => (
              <div key={i} className="text-center">
                <div
                  className={clsx(
                    "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-lg font-extrabold text-white",
                    ACCENT_SOLID_CLASSES[i % 3]
                  )}
                >
                  {i + 1}
                </div>
                <h3 className="font-bold text-text-primary">{step.title}</h3>
                <p className="mt-1 text-sm text-text-secondary">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id={TRUST_ANCHOR} className="relative isolate overflow-hidden">
        <BgArt src={resolve("landing.trust")} className="-right-14 -bottom-14 h-64 w-64 rotate-6 md:h-80 md:w-80" />
        <div className="relative mx-auto max-w-5xl px-5 py-16">
          <h2 className="text-center text-2xl font-extrabold text-text-primary md:text-3xl">{l.trustTitle}</h2>

          {/* lalu.uz'dagi "shifokor tomonidan ko'rib chiqilgan" ishonch
              ustuniga mos, HAQIQIY manba bilan (FIX-CHECKUPS ishi). */}
          <div className="mx-auto mt-8 max-w-3xl rounded-3xl bg-primary/5 p-6 text-center">
            <h3 className="text-base font-bold text-text-primary">{l.sourceTrustTitle}</h3>
            <p className="mt-2 text-sm text-text-secondary">{l.sourceTrustBody}</p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {l.trustItems.map((item, i) => {
              const Icon = TRUST_ICONS[i];
              return (
                <div key={i} className="rounded-3xl bg-surface p-5 text-center shadow-sm shadow-text-primary/5">
                  <div className={clsx("mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full", ACCENT_CHIP_CLASSES[i % 3])}>
                    <Icon fontSize="small" />
                  </div>
                  <h3 className="text-sm font-bold text-text-primary">{item.title}</h3>
                  <p className="mt-1 text-xs text-text-secondary">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id={FAQ_ANCHOR} className="relative isolate overflow-hidden bg-surface-muted py-16">
        <BgArt src={resolve("landing.faq")} className="-left-14 -top-10 h-64 w-64 -rotate-6 md:h-80 md:w-80" />
        <div className="relative mx-auto max-w-2xl px-5">
          <h2 className="text-center text-2xl font-extrabold text-text-primary md:text-3xl">{l.faqTitle}</h2>
          <div className="mt-8 space-y-3">
            {l.faq.map((item, i) => (
              <Accordion
                key={i}
                disableGutters
                elevation={0}
                sx={{
                  borderRadius: "20px!important",
                  overflow: "hidden",
                  backgroundColor: "var(--color-surface)",
                  "&::before": { display: "none" },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreOutlined sx={{ color: "var(--color-primary)" }} />} sx={{ px: 2.5, py: 0.5 }}>
                  <span className="font-bold text-text-primary">{item.q}</span>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                  <p className="text-sm text-text-secondary">{item.a}</p>
                </AccordionDetails>
              </Accordion>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-landing-cta relative isolate overflow-hidden px-5 py-16 text-center text-white">
        <div className="pointer-events-none absolute -left-10 -top-16 -z-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 -bottom-16 -z-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto max-w-lg">
          <h2 className="text-2xl font-extrabold md:text-3xl">{l.finalCtaTitle}</h2>
          <p className="mt-2 text-white/85">{l.finalCtaSubtitle}</p>
          <button
            type="button"
            onClick={onStart}
            className="tap-target mt-6 rounded-full bg-white px-8 py-3 text-base font-extrabold text-primary shadow-lg transition active:scale-[0.98] hover:brightness-95"
          >
            {l.finalCtaButton}
          </button>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-10 text-center text-xs text-text-muted">
        <div className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <a href={`#${HOW_ANCHOR}`} className="hover:text-text-primary">
            {l.navLinks.howItWorks}
          </a>
          <a href={`#${FEATURES_ANCHOR}`} className="hover:text-text-primary">
            {l.navLinks.features}
          </a>
          <a href={`#${TRUST_ANCHOR}`} className="hover:text-text-primary">
            {l.navLinks.trust}
          </a>
          <a href={`#${FAQ_ANCHOR}`} className="hover:text-text-primary">
            {l.navLinks.faq}
          </a>
        </div>
        <p className="mt-4">{l.footerTagline}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <a href="/maxfiylik" className="hover:text-text-primary">
            {l.footerPrivacy}
          </a>
          <span>{l.footerRights(new Date().getFullYear())}</span>
        </div>
      </footer>
    </div>
  );
}
