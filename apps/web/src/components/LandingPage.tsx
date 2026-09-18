"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, useInView, useReducedMotion } from "motion/react";
import { DURATION, EASE_BRAND, VIEWPORT_ONCE } from "@/lib/motion";
import { Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import {
  GroupsOutlined,
  LocationOnOutlined,
  MenuBookOutlined,
  ShieldOutlined,
  CheckCircleOutlined,
  TranslateOutlined,
  KeyboardArrowDownOutlined,
  ExpandMoreOutlined,
  PeopleAltOutlined,
  NotificationsActiveOutlined,
} from "@mui/icons-material";
import { useI18n } from "@/lib/i18n";
import { useIllustrations } from "@/lib/illustrations";
import { Button, Card } from "@/components/ui";
import { PublicCalculators } from "@/components/landing/PublicCalculators";
import { Reveal, PopIn } from "@/components/motion-primitives";

const LIFE_STAGE_KEYS = ["cycle", "pregnancy", "checkups"] as const;
const LIFE_STAGE_ILLUSTRATIONS = ["/illustrations/calendar.svg", "/illustrations/expecting.svg", "/illustrations/library/all-checked_d3u6.svg"];
const LIFE_STAGE_TINTS = ["bg-primary/8", "bg-secondary/8", "bg-accent/8"];

const SECONDARY_FEATURE_KEYS = ["community", "clinics", "articles"] as const;
const SECONDARY_FEATURE_ICONS = [GroupsOutlined, LocationOnOutlined, MenuBookOutlined];
const TRUST_ICONS = [ShieldOutlined, CheckCircleOutlined, TranslateOutlined, LocationOnOutlined];

// 2026-09-15/16 dizayn yangilanishi (lalu.uz'dan ilhomlangan, so'ng foydalanuvchi
// talabiga ko'ra ANCHA yaqinroq struktura bilan — LANDING-CALC/bento/ticker):
// uchta brend rangi (pushti/binafsha/moviy-yashil — MammoAI'ning o'zining mavjud
// tokenlari, design-tokens.ts) navbat bilan ishlatiladi — YANGI palitra EMAS.
const ACCENT_CHIP_CLASSES = ["bg-primary/10 text-primary", "bg-secondary/10 text-secondary", "bg-accent/10 text-accent"];
const ACCENT_SOLID_CLASSES = ["bg-primary", "bg-secondary", "bg-accent"];
const ACCENT_TEXT_CLASSES = ["text-primary", "text-secondary", "text-accent"];

/** MOTION-05: Bento karta hover-fidbeki — yengil ko'tarilish + soyaning
 * kuchayishi, --motion-duration-section (400ms) bilan mos. */
const BENTO_CARD_HOVER = "transition-[translate,box-shadow] duration-[var(--motion-duration-section)] hover:-translate-y-1 hover:shadow-lg";

const HOW_ANCHOR = "qanday-ishlaydi";
const FEATURES_ANCHOR = "imkoniyatlar";
const CALC_ANCHOR = "kalkulyatorlar";
const TRUST_ANCHOR = "ishonch";
const FAQ_ANCHOR = "savol-javob";

/** "23+", "100%", "0" kabi qiymatlardan sonli qismini ("prefiks"/"sufiks"
 * bilan) ajratib oladi — MOTION-03: statistika-lentasi raqamlari son
 * bo'lmagan belgilar (+/%) BILAN to'g'ri hisoblanishi uchun. */
function parseCountValue(raw: string): { number: number; prefix: string; suffix: string } {
  const match = /^(\D*)(\d+)(\D*)$/.exec(raw);
  if (!match) return { number: 0, prefix: "", suffix: raw };
  return { number: Number(match[2]), prefix: match[1], suffix: match[3] };
}

const COUNT_UP_DURATION_MS = 1200;

/** Ko'rinish maydoniga kirganda 0'dan haqiqiy qiymatgacha animatsion
 * hisoblaydi — oxirida sekinlashib to'xtaydigan ease-out (doim bir xil
 * tezlikda emas). `useReducedMotion()` yoqilgan bo'lsa — darhol yakuniy
 * qiymat, hisoblashsiz. */
function CountUpStat({ value, className }: { value: string; className: string }) {
  const { number, prefix, suffix } = useMemo(() => parseCountValue(value), [value]);
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, VIEWPORT_ONCE);
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(number);

  useEffect(() => {
    if (!inView || reduceMotion) {
      // setState effekt ICHIDA sinxron chaqirilmaydi (kaskadli render'larni
      // oldini olish uchun) — loyihada allaqachon bor FIX-07 naqshi.
      const timeout = setTimeout(() => setDisplay(number), 0);
      return () => clearTimeout(timeout);
    }
    let raf: number;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min(1, (now - start) / COUNT_UP_DURATION_MS);
      const eased = 1 - (1 - t) ** 3; // ease-out cubic — oxirida sekinlashadi
      // Birinchi kadr `t`si deyarli 0 bo'lgani uchun `display` allaqachon
      // ~0'dan boshlanadi — alohida "setDisplay(0)" sinxron chaqiruvi shart
      // emas (bu ham yuqoridagi bilan bir xil ESLint qoidasini ilib olardi).
      setDisplay(Math.round(eased * number));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, number, reduceMotion]);

  return (
    <p ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </p>
  );
}

/** Kichik, katta harfli "eyebrow" yorliq — lalu.uz'dagi bo'lim sarlavhalari
 * ustidagi takrorlanuvchi naqsh. `accentIndex` ACCENT_TEXT_CLASSES'ga mos. */
function Eyebrow({ children, accentIndex = 0 }: { children: React.ReactNode; accentIndex?: number }) {
  return <p className={clsx("text-center text-xs font-extrabold tracking-widest", ACCENT_TEXT_CLASSES[accentIndex % 3])}>{children}</p>;
}

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
function BlobArt({ className, breatheDelay }: { className: string; breatheDelay?: string }) {
  return (
    <div
      aria-hidden
      className={clsx("motion-breathe pointer-events-none absolute -z-10 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-2xl", className)}
      style={breatheDelay ? { animationDelay: breatheDelay } : undefined}
    />
  );
}

/** MOTION-00 (asos): Hero bo'limi DOIM (qorong'u rejimda ham) o'zgarmaydigan
 * iliq pastel fonga ega (`.bg-landing-hero`), undan keyingi bo'lim (ticker)
 * esa TEMA-MOSLASHUVCHAN `bg-surface`ga — qorong'u rejimda bu ikkisi
 * orasida juda qattiq, "kesilgan" chegara paydo bo'lardi (och pushti →
 * to'q-ko'k, to'g'ri chiziq bo'ylab). Bu yumshoq to'lqinsimon SVG ajratuvchi
 * fill'i `var(--color-surface)` (keyingi bo'lim foni bilan BIR XIL, tema
 * bilan avtomatik moslashadi) — chegara endi to'g'ri chiziq emas, yumshoq
 * egri chiziq bo'ylab o'tadi. */
function HeroWaveDivider() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-12 w-full translate-y-px md:h-16"
    >
      <path d="M0,32 C320,80 1120,0 1440,40 L1440,80 L0,80 Z" fill="var(--color-surface)" />
    </svg>
  );
}

const HERO_STAGGER_STEP_S = 0.07; // 70ms — foydalanuvchi so'rovi ("60-80ms")

/** Hero sarlavhasi — segmentlar (so'z-guruhlari) birma-bir, pastdan yengil
 * yuqoriga siljib, xiradan-aniqqa chiqadi. Scroll-reveal EMAS (Hero birinchi
 * ekranda, mount bo'lishi bilan ishga tushadi) — shuning uchun umumiy
 * `<Reveal>` primitivi (whileInView) o'rniga shu yerda alohida, mount-
 * asosli variant. `useReducedMotion()` yoqilgan bo'lsa — kechikishsiz,
 * darhol to'liq holatda (`initial={false}`) — matn HECH QACHON
 * ko'rinmasdan qolib ketmaydi. */
function HeroHeadline({ segments, accentClassOf }: { segments: { text: string; accent?: string }[]; accentClassOf: (accent: string) => string }) {
  const reduceMotion = useReducedMotion();
  return (
    <h1 className="max-w-2xl text-4xl font-extrabold leading-tight text-[#1f2937] md:text-5xl">
      {segments.map((seg, i) =>
        reduceMotion ? (
          <span key={i} className={seg.accent ? accentClassOf(seg.accent) : undefined}>
            {seg.text}
          </span>
        ) : (
          <motion.span
            key={i}
            // MUHIM: `inline-block` EMAS — segmentlar orasidagi bo'shliqlar
            // (matn ichida, masalan " va ") inline-block chegarasida
            // yeyilib ketadi ("homiladorlikvatekshiruvlar" bo'lib qolgan
            // edi). Oddiy `inline` (span standart holati) bilan
            // `transform`/opacity animatsiyasi baribir to'g'ri ishlaydi.
            className={seg.accent ? accentClassOf(seg.accent) : undefined}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.page, ease: EASE_BRAND, delay: i * HERO_STAGGER_STEP_S }}
          >
            {seg.text}
          </motion.span>
        )
      )}
    </h1>
  );
}

/** Telefon-mokapning sichqoncha pozitsiyasiga qarab yumshoq 3D nishabi
 * (desktop) + doimiy yengil suzishi (.motion-float, CSS). Reduced-motion
 * yoqilgan bo'lsa — nishab butunlay o'chadi (float ham CSS orqali
 * globals.css'dagi umumiy qoidada o'chadi), faqat statik mokap qoladi. */
function PhoneTilt({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    const MAX_DEG = 4;
    setTilt({ x: -py * MAX_DEG * 2, y: px * MAX_DEG * 2 });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
  }

  return (
    <div style={{ perspective: 800 }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <motion.div
        ref={ref}
        className="motion-float"
        animate={reduceMotion ? undefined : { rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: "spring", stiffness: 150, damping: 15 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Ilovaning haqiqiy ekranlaridan olingan skrinshotlar (namunaviy ma'lumot bilan) —
// tsikl, homiladorlik, tekshiruvlar, hamkor va hamjamiyat. Yasama illyustratsiya
// emas, real UI — bir nechtasi navbat bilan almashinib turadi ("animatsiyaga
// o'xshab" ochilishi uchun).
const APP_PREVIEWS = ["/app-preview-1.png", "/app-preview-2.png", "/app-preview-3.png", "/app-preview-4.png", "/app-preview-5.png"];
const PREVIEW_INTERVAL_MS = 2800;

function AppPreviewCarousel() {
  const [index, setIndex] = useState(0);
  // WEB3-19: 5 ta skrinshot (jami ~818KB) BARCHASI sahifa ochilishi bilan
  // darhol yuklanmasin (barchasi bir vaqtning o'zida bittadan ko'rinsa ham)
  // — faqat hozirgi + navbatdagi (bir qadam oldindan, silliq almashish
  // uchun) rasm mount qilinadi. Native `loading="lazy"` bu yerda ishlamaydi,
  // chunki rasmlar allaqachon ko'rinadigan hero ichida, faqat opacity:0
  // bilan yashiringan (brauzer buni "offscreen" deb hisoblamaydi) — shuning
  // uchun DOM'ga qo'shilishning o'zi cheklanadi. Boshlang'ich qiymat 1
  // (0-rasm + oldindan yuklanayotgan 1-rasm) — qolgan 3 tasi faqat navbati
  // kelganda (setInterval callback'i ichida, quyida) mount qilinadi.
  const [maxLoadedIndex, setMaxLoadedIndex] = useState(() => Math.min(1, APP_PREVIEWS.length - 1));

  useEffect(() => {
    // LANDING-03: harakatga sezgir (vestibular) foydalanuvchilar uchun —
    // ticker-lenta (globals.css'dagi prefers-reduced-motion bloki) bilan bir
    // xil qoida: shu sozlama yoqilgan bo'lsa, avtomatik almashinuvni umuman
    // ishga tushirmaymiz (birinchi rasm bilan statik qoladi).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % APP_PREVIEWS.length;
        // Navbatdagi rasmni ("next"dan keyingisi) shu daqiqada oldindan
        // yuklashni boshlaydi — butun ~2.8s almashish davri davomida
        // yuklanib ulguradi, almashishda "bo'sh kadr" bo'lmaydi.
        setMaxLoadedIndex((m) => Math.max(m, Math.min(next + 1, APP_PREVIEWS.length - 1)));
        return next;
      });
    }, PREVIEW_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mt-2">
      <BlobArt className="left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 bg-primary-light/50" />
      <BlobArt className="left-1/2 top-1/2 h-64 w-64 -translate-x-[65%] -translate-y-[35%] rotate-45 bg-accent-light/30" breatheDelay="-3.5s" />
      <PhoneTilt>
        <div className="relative w-[220px] -rotate-2 overflow-hidden rounded-[2rem] border-[8px] border-[#1f2937] bg-[#1f2937] shadow-2xl">
          <div className="absolute left-1/2 top-2 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-[#1f2937]" />
          <div className="relative aspect-[624/1168] w-full">
            {APP_PREVIEWS.map((src, i) =>
              i > maxLoadedIndex ? null : (
                // eslint-disable-next-line @next/next/no-img-element -- statik skrinshot, next/image optimizatsiyasi kerak emas
                <img
                  key={src}
                  src={src}
                  alt=""
                  className={clsx("absolute inset-0 h-full w-full transition-opacity duration-700 ease-in-out", i === index ? "opacity-100" : "opacity-0")}
                />
              )
            )}
          </div>
        </div>
      </PhoneTilt>
      <div className="mt-4 flex justify-center gap-1.5">
        {APP_PREVIEWS.map((_, i) => (
          <span key={i} className={clsx("h-1.5 rounded-full transition-all duration-500", i === index ? "w-5 bg-primary" : "w-1.5 bg-primary/25")} />
        ))}
      </div>
    </div>
  );
}

/** Bosh banner ostidagi uzluksiz aylanuvchi "pill" teg-lenta (lalu.uz'dagi
 * naqsh). Ro'yxat IKKI marta chiziladi va CSS animatsiyasi faqat -50%
 * siljiydi — shuning uchun chok ko'rinmaydi (uzluksiz halqa illyuziyasi). */
function LandingTicker({ tags }: { tags: string[] }) {
  return (
    // MOTION-00: tepadagi border endi yo'q — Hero'ning HeroWaveDivider'i
    // shu chegarani allaqachon yumshoq egri chiziq bilan qamrab oladi,
    // qattiq to'g'ri chiziq TAKRORLANMASLIGI kerak.
    <div className="relative overflow-hidden border-b border-border/60 bg-surface py-4" aria-hidden={false}>
      <div className="landing-ticker-track flex w-max gap-3">
        {[...tags, ...tags].map((tag, i) => (
          <span
            key={i}
            className={clsx(
              "shrink-0 rounded-full px-4 py-1.5 text-xs font-bold",
              ACCENT_CHIP_CLASSES[i % 3]
            )}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * mammo.uz'ga birinchi marta (anonim, ro'yxatdan o'tmagan holatda) kirilganda
 * ko'rsatiladigan marketing bosh sahifasi (referens: lalu.uz — foydalanuvchi
 * so'roviga ko'ra 2026-09-16'da ANCHA yaqinroq struktura bilan qayta ishlandi:
 * rangli-so'zli sarlavha, aylanuvchi teg-lenta, muqobil joylashuvli 3 ta
 * "hayot bosqichi" kartasi, bento-tarmoq, ro'yxatdan o'tmasdan ishlaydigan
 * kalkulyatorlar). "Bepul sinab ko'rish" tugmasi bosilganda haqiqiy ilovaga
 * (onboarding) o'tadi — sessiya bo'lgan foydalanuvchilar bu sahifani umuman
 * ko'rmaydi (page.tsx'da to'g'ridan-to'g'ri ilovaga yo'naltiriladi).
 *
 * MUHIM — bu 1-to-1 klon EMAS, chunki lalu.uz'dagi ba'zi bo'limlar MammoAI
 * uchun HAQIQIY mazmun bilan to'ldirib bo'lmaydi (foydalanuvchi bilan
 * kelishilgan holda hal qilindi): haqiqiy sharh/reyting yo'qligi uchun
 * "sharhlar" bo'limi o'rniga kengaytirilgan manba-ishonch bo'limi qo'llanildi;
 * mavjud unDraw-uslubidagi sahna-illyustratsiyalar ishlatilgan (maxsus
 * multfilm-personajlar EMAS); asosiy CTA hamon web onboarding'ga olib
 * boradi (App Store/Google Play tugmalari EMAS — ilova hali nashr etilmagan).
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
            <a href={`#${CALC_ANCHOR}`} className="text-sm font-semibold text-text-secondary transition hover:text-text-primary">
              {l.navLinks.calculators}
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
        <div className="animate-fade-in-up relative mx-auto flex max-w-5xl flex-col items-center gap-6 px-5 pb-10 pt-14 text-center md:pt-20">
          <span className="rounded-full bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-primary shadow-sm">
            {l.heroEyebrow}
          </span>
          {/* MUHIM: bu bo'lim (bg-landing-hero) qorong'u rejimda ham DOIM
              o'zgarmaydigan iliq pastel gradient fon — shuning uchun matn
              rangi ham QORONG'U REJIMGA MOSLASHUVCHI tokenlar EMAS, qat'iy
              (light-mode qiymati bilan bir xil) ranglarda yozilgan. Faqat
              `accent` bilan belgilangan segmentlar brend tokenlaridan
              (--color-primary/secondary/accent) rang oladi — ular ham fon
              o'zgarmasligi sababli doimiy ko'rinadi. */}
          <HeroHeadline
            segments={l.heroTitleSegments}
            accentClassOf={(accent) => ACCENT_TEXT_CLASSES[["primary", "secondary", "accent"].indexOf(accent)]}
          />
          <p className="max-w-xl text-lg text-[#4b5563]">{l.heroSubtitle}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* MOTION-02: mikro-fidbek (150ms, --motion-duration-micro bilan mos) —
                `scale` mustaqil CSS xususiyati orqali, mavjud MUI hover/soya
                o'tishiga (buttonSx) ta'sir qilmaydi. */}
            <Button onClick={onStart} className="px-8! py-3! text-base! duration-150 hover:scale-[1.02] active:scale-[0.98]">
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
        <HeroWaveDivider />
      </section>

      <LandingTicker tags={l.tickerTags} />

      {/* lalu.uz uslubidagi qisqa "raqam + izoh" fakt-qatori — soxta
          foydalanuvchi soni/reyting emas, kodning o'zidan tekshirilgan
          haqiqiy faktlar (dict.landing.factsStrip izohiga qarang). */}
      <section className="border-b border-border/60 bg-surface">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-y-6 px-5 py-10 sm:grid-cols-4">
          {l.factsStrip.map((fact, i) => (
            <div key={i} className="text-center">
              <CountUpStat value={fact.value} className={clsx("text-3xl font-extrabold tabular-nums", ACCENT_TEXT_CLASSES[i % 3])} />
              <p className="mt-1 text-xs text-text-secondary">{fact.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* lalu.uz'dagi 3 ta muqobil-joylashuvli "hayot bosqichi" karta —
          MammoAI'ning haqiqiy 3 ustuni: tsikl, homiladorlik, tekshiruvlar
          (lalu'dagi "chaqaloq parvarishi" o'rniga — bunday funksiya
          MammoAI'da yo'q, soxta xususiyat qo'shilmadi). */}
      <section id={FEATURES_ANCHOR} className="relative isolate scroll-mt-24 overflow-hidden py-16">
        <BgArt src={resolve("landing.features")} className="-right-16 -top-16 h-72 w-72 rotate-6 md:h-96 md:w-96" />
        <div className="relative mx-auto max-w-5xl px-5">
          <Eyebrow accentIndex={0}>{l.eyebrows.features}</Eyebrow>
          <h2 className="mt-2 text-center text-2xl font-extrabold text-text-primary md:text-3xl">{l.featuresTitle}</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-text-secondary">{l.featuresSubtitle}</p>

          <div className="mt-10 space-y-6">
            {LIFE_STAGE_KEYS.map((key, i) => {
              const f = l.features[key];
              const reversed = i % 2 === 1;
              return (
                // MOTION-04: har biri ko'rinish maydoniga kirganda pastdan-
                // yuqoriga + xiradan-aniqqa, bir-biridan ~120ms kechikish
                // bilan ("to'lqin" effekti — foydalanuvchi so'ragan).
                <Reveal
                  key={key}
                  index={i}
                  className={clsx(
                    "flex flex-col items-center gap-6 rounded-[34px] p-8 md:gap-10 md:p-10",
                    LIFE_STAGE_TINTS[i],
                    reversed ? "md:flex-row-reverse" : "md:flex-row"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- statik SVG illyustratsiya */}
                  <img src={LIFE_STAGE_ILLUSTRATIONS[i]} alt="" className="h-40 w-40 shrink-0 md:h-48 md:w-48" />
                  <div className="text-center md:text-left">
                    <h3 className={clsx("text-xl font-extrabold", ACCENT_TEXT_CLASSES[i])}>{f.title}</h3>
                    <p className="mt-2 text-text-secondary">{f.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* lalu.uz'dagi "bento" tarmoq (1 katta + 1 kichik + 3 teng) — yuqoridagi
          3 asosiy ustundan TASHQARI qolgan ikkinchi darajali imkoniyatlar. */}
      <section className="relative isolate overflow-hidden bg-surface-muted py-16">
        <div className="relative mx-auto max-w-5xl px-5">
          <Eyebrow accentIndex={1}>{l.eyebrows.bento}</Eyebrow>
          <h2 className="mt-2 text-center text-2xl font-extrabold text-text-primary md:text-3xl">{l.bentoTitle}</h2>

          {/* MOTION-05: kartalar hover'da yengil ko'tariladi (translateY -4px
              + soyaning kuchayishi — `BENTO_CARD_HOVER`, 400ms/--motion-
              duration-section bilan mos), ikonkalar sahifaga kirganda kichik
              "pop" bilan paydo bo'ladi (`<PopIn>`, spring). */}
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <Card className={clsx("p-7! md:col-span-2", BENTO_CARD_HOVER)}>
              <PopIn index={0} className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <PeopleAltOutlined />
              </PopIn>
              <h3 className="text-lg font-bold text-text-primary">{l.bentoPartner.title}</h3>
              <p className="mt-1 text-sm text-text-secondary">{l.bentoPartner.desc}</p>
            </Card>
            <Card className={clsx("p-7!", BENTO_CARD_HOVER)}>
              <PopIn index={1} className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                <NotificationsActiveOutlined />
              </PopIn>
              <h3 className="text-lg font-bold text-text-primary">{l.bentoReminders.title}</h3>
              <p className="mt-1 text-sm text-text-secondary">{l.bentoReminders.desc}</p>
            </Card>
            {SECONDARY_FEATURE_KEYS.map((key, i) => {
              const Icon = SECONDARY_FEATURE_ICONS[i];
              const f = l.features[key];
              return (
                <Card key={key} className={clsx("p-7!", BENTO_CARD_HOVER)}>
                  <PopIn index={i + 2} className={clsx("mb-3 flex h-12 w-12 items-center justify-center rounded-2xl", ACCENT_CHIP_CLASSES[i % 3])}>
                    <Icon />
                  </PopIn>
                  <h3 className="text-lg font-bold text-text-primary">{f.title}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{f.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* LANDING-CALC: ro'yxatdan o'tmasdan ishlaydigan bepul kalkulyatorlar —
          lalu.uz'dagi 4 ta vositaga mos (packages/shared/src/logic/
          public-calculators.ts, faqat umumiy formulalar/ma'lumotnoma, tashxis
          EMAS — shuning uchun disclaimer har doim ko'rinadi). */}
      <section id={CALC_ANCHOR} className="relative isolate scroll-mt-24 overflow-hidden py-16">
        <div className="relative mx-auto max-w-5xl px-5">
          <Eyebrow accentIndex={2}>{l.eyebrows.calculators}</Eyebrow>
          <h2 className="mt-2 text-center text-2xl font-extrabold text-text-primary md:text-3xl">{l.calculatorsTitle}</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-text-secondary">{l.calculatorsSubtitle}</p>
          <div className="mt-10">
            <PublicCalculators />
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-text-muted">{l.calculatorsDisclaimer}</p>
        </div>
      </section>

      <section id={HOW_ANCHOR} className="relative isolate scroll-mt-24 overflow-hidden bg-surface-muted py-16">
        <BgArt src={resolve("landing.howItWorks")} className="-left-16 -bottom-10 h-64 w-64 -rotate-6 md:h-80 md:w-80" />
        <div className="relative mx-auto max-w-4xl px-5">
          <Eyebrow accentIndex={0}>{l.eyebrows.how}</Eyebrow>
          <h2 className="mt-2 text-center text-2xl font-extrabold text-text-primary md:text-3xl">{l.howTitle}</h2>
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

      {/* "Ishonch" bo'limi — lalu.uz'dagi sharh/reyting bo'limining o'rnini
          bosadi (foydalanuvchi bilan kelishilgan yechim: haqiqiy do'kon
          sharhlari yo'q, shuning uchun soxta emas — manba-asoslangan ishonch
          bloki + shifokor illyustratsiyasi bilan kengaytirildi). */}
      <section id={TRUST_ANCHOR} className="relative isolate scroll-mt-24 overflow-hidden">
        <BgArt src={resolve("landing.trust")} className="-right-14 -bottom-14 h-64 w-64 rotate-6 md:h-80 md:w-80" />
        <div className="relative mx-auto max-w-5xl px-5 py-16">
          <Eyebrow accentIndex={1}>{l.eyebrows.trust}</Eyebrow>
          <h2 className="mt-2 text-center text-2xl font-extrabold text-text-primary md:text-3xl">{l.trustTitle}</h2>

          <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center gap-6 rounded-[34px] bg-secondary/8 p-8 text-center md:flex-row md:text-left">
            {/* eslint-disable-next-line @next/next/no-img-element -- statik SVG illyustratsiya */}
            <img src="/illustrations/doctor.svg" alt="" className="h-32 w-32 shrink-0" />
            <div>
              <h3 className="text-base font-bold text-text-primary">{l.sourceTrustTitle}</h3>
              <p className="mt-2 text-sm text-text-secondary">{l.sourceTrustBody}</p>
            </div>
          </div>

          {/* MOTION-08: bento kartalari bilan bir xil naqsh — izchillik uchun. */}
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {l.trustItems.map((item, i) => {
              const Icon = TRUST_ICONS[i];
              return (
                <Reveal key={i} index={i} className="rounded-3xl bg-surface p-5 text-center shadow-sm shadow-text-primary/5">
                  <div className={clsx("mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full", ACCENT_CHIP_CLASSES[i % 3])}>
                    <Icon fontSize="small" />
                  </div>
                  <h3 className="text-sm font-bold text-text-primary">{item.title}</h3>
                  <p className="mt-1 text-xs text-text-secondary">{item.desc}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section id={FAQ_ANCHOR} className="relative isolate scroll-mt-24 overflow-hidden bg-surface-muted py-16">
        <BgArt src={resolve("landing.faq")} className="-left-14 -top-10 h-64 w-64 -rotate-6 md:h-80 md:w-80" />
        <div className="relative mx-auto max-w-2xl px-5">
          <Eyebrow accentIndex={2}>{l.eyebrows.faq}</Eyebrow>
          <h2 className="mt-2 text-center text-2xl font-extrabold text-text-primary md:text-3xl">{l.faqTitle}</h2>
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

      {/* lalu.uz'dagi kabi, chekka-chekkaga EMAS, ICHKI ("inset") yumaloq
          gradient CTA kartasi — sahifa fonidan bo'shliq bilan ajratilgan. */}
      <section className="px-5 py-16">
        <div className="bg-landing-cta relative isolate mx-auto max-w-4xl overflow-hidden rounded-[34px] px-6 py-14 text-center text-white">
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
          <a href={`#${CALC_ANCHOR}`} className="hover:text-text-primary">
            {l.navLinks.calculators}
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
