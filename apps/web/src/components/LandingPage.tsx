"use client";

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

const HOW_ANCHOR = "qanday-ishlaydi";

/**
 * mammo.uz'ga birinchi marta (anonim, ro'yxatdan o'tmagan holatda) kirilganda
 * ko'rsatiladigan marketing bosh sahifasi (referens: flo.health, helloclue.com).
 * "Bepul sinab ko'rish" tugmasi bosilganda haqiqiy ilovaga (onboarding) o'tadi —
 * sessiya bo'lgan foydalanuvchilar bu sahifani umuman ko'rmaydi (page.tsx'da
 * to'g'ridan-to'g'ri ilovaga yo'naltiriladi).
 */
export function LandingPage({ onStart }: { onStart: () => void }) {
  const { dict } = useI18n();
  const l = dict.landing;

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            {/* logo.svg — faqat shaffof (fonsiz) belgi, shuning uchun favicon.png'dagi kabi
                brend-rangли fonga joylashtiriladi (aks holda oq navbar ustida ko'rinmay qoladi). */}
            <div className="bg-aurora-cycle flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element -- SVG, next/image optimizatsiyasi kerak emas */}
              <img src="/logo.svg" alt="" className="h-5 w-5" />
            </div>
            <span className="text-lg font-extrabold text-text-primary">MammoAI</span>
          </div>
          <Button onClick={onStart} className="px-5! py-2! text-sm!">
            {l.navCta}
          </Button>
        </div>
      </header>

      <section className="bg-aurora-hero">
        <div className="animate-fade-in-up mx-auto flex max-w-5xl flex-col items-center gap-6 px-5 pb-14 pt-14 text-center md:pt-20">
          <span className="rounded-full bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-primary shadow-sm">
            {l.heroEyebrow}
          </span>
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight text-text-primary md:text-5xl">{l.heroTitle}</h1>
          <p className="max-w-xl text-lg text-text-secondary">{l.heroSubtitle}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button onClick={onStart} className="px-8! py-3! text-base!">
              {l.ctaPrimary}
            </Button>
            <a
              href={`#${HOW_ANCHOR}`}
              className="tap-target flex items-center gap-1 text-sm font-semibold text-text-secondary transition hover:text-text-primary"
            >
              {l.ctaSecondary}
              <KeyboardArrowDownOutlined fontSize="small" />
            </a>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG, next/image optimizatsiyasi kerak emas */}
          <img src="/illustrations/welcome.svg" alt="" className="mt-2 h-56 w-auto md:h-72" />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
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
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon />
                </div>
                <h3 className="text-lg font-bold text-text-primary">{f.title}</h3>
                <p className="mt-1 text-sm text-text-secondary">{f.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section id={HOW_ANCHOR} className="bg-surface-muted py-16">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="text-center text-2xl font-extrabold text-text-primary md:text-3xl">{l.howTitle}</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {l.howSteps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-extrabold text-white">
                  {i + 1}
                </div>
                <h3 className="font-bold text-text-primary">{step.title}</h3>
                <p className="mt-1 text-sm text-text-secondary">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-center text-2xl font-extrabold text-text-primary md:text-3xl">{l.trustTitle}</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {l.trustItems.map((item, i) => {
            const Icon = TRUST_ICONS[i];
            return (
              <div key={i} className="rounded-3xl bg-surface p-5 text-center shadow-sm shadow-text-primary/5">
                <Icon className="mx-auto mb-3 text-primary" />
                <h3 className="text-sm font-bold text-text-primary">{item.title}</h3>
                <p className="mt-1 text-xs text-text-secondary">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-surface-muted py-16">
        <div className="mx-auto max-w-2xl px-5">
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

      <section className="bg-aurora-cycle px-5 py-16 text-center text-white">
        <div className="mx-auto max-w-lg">
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

      <footer className="border-t border-border px-5 py-8 text-center text-xs text-text-muted">
        <p>{l.footerTagline}</p>
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
