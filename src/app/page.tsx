"use client";

import { Activity, ClipboardList, LineChart, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Logo } from "@/components/Logo";
import { LinkButton } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { StatCounter } from "@/components/StatCounter";
import { useT } from "@/lib/i18n/context";

export default function HomePage() {
  const t = useT();

  const STEPS = [
    { icon: UserPlus, title: t.landing.step1Title, text: t.landing.step1Text },
    { icon: ClipboardList, title: t.landing.step2Title, text: t.landing.step2Text },
    { icon: LineChart, title: t.landing.step3Title, text: t.landing.step3Text },
  ];

  const FEATURES = [
    { icon: Activity, title: t.landing.feature1Title, text: t.landing.feature1Text },
    { icon: ShieldCheck, title: t.landing.feature2Title, text: t.landing.feature2Text },
    { icon: Sparkles, title: t.landing.feature3Title, text: t.landing.feature3Text },
  ];

  const STATS = [
    { value: 8, prefix: "1/", suffix: "", label: t.landing.stat1Label },
    { value: 99, prefix: "", suffix: "%", label: t.landing.stat2Label },
    { value: 10, prefix: "", suffix: t.landing.stat3Suffix, label: t.landing.stat3Label },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(600px circle at 50% 0%, rgba(59,130,246,0.25), transparent 70%)",
          }}
        />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-pink-400/20 bg-pink-500/10 px-4 py-1.5 text-xs font-medium text-pink-200">
            <span aria-hidden>🎗️</span>
            {t.landing.ribbonBadge}
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
            <Logo size="lg" />
          </div>
          <h2
            className="animate-fade-in-up mt-8 text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "160ms" }}
          >
            {t.landing.heroTitle}{" "}
            <span className="bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
              {t.landing.heroTitleHighlight}
            </span>
          </h2>
          <p
            className="animate-fade-in-up mt-5 max-w-xl text-base text-blue-200/80 sm:text-lg lg:text-xl"
            style={{ animationDelay: "240ms" }}
          >
            {t.landing.heroSubtitle}
          </p>
          <div
            className="animate-fade-in-up mt-8 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "320ms" }}
          >
            <LinkButton href="/sign-up">
              <UserPlus size={16} />
              {t.landing.ctaSignup}
            </LinkButton>
            <LinkButton href="/login" variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
              {t.landing.ctaLogin}
            </LinkButton>
          </div>
          <p
            className="animate-fade-in-up mt-6 max-w-lg text-xs text-blue-300/60"
            style={{ animationDelay: "380ms" }}
          >
            {t.landing.disclaimer}
          </p>
        </div>
      </section>

      {/* Awareness stats */}
      <section className="border-b border-slate-100 bg-white px-4 py-16 sm:px-6 lg:px-8 dark:border-slate-900 dark:bg-slate-950">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 120} className="text-center">
              <p className="bg-gradient-to-br from-pink-500 to-blue-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
                <StatCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              </p>
              <p className="mx-auto mt-2 max-w-[22rem] text-sm text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <Reveal className="mx-auto max-w-xl text-center">
          <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
            {t.landing.howTitle}
          </h3>
          <p className="mt-2 text-slate-500 lg:text-lg dark:text-slate-400">
            {t.landing.howSubtitle}
          </p>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-3 lg:mt-16 lg:gap-8">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 120}>
              <div className="group h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg lg:p-8 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-md shadow-blue-900/20 transition-transform group-hover:scale-110">
                  <step.icon size={20} className="text-white" />
                </div>
                <h4 className="mt-4 font-semibold text-slate-900 lg:text-lg dark:text-white">
                  {step.title}
                </h4>
                <p className="mt-1.5 text-sm text-slate-500 lg:text-base dark:text-slate-400">
                  {step.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-28 dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mx-auto max-w-xl text-center">
            <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
              {t.landing.whyTitle}
            </h3>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-3 lg:mt-16 lg:gap-8">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 120}>
                <div className="group h-full rounded-2xl bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg lg:p-8 dark:bg-slate-900">
                  <f.icon size={22} className="text-blue-600 transition-transform group-hover:scale-110 dark:text-blue-400" />
                  <h4 className="mt-3 font-semibold text-slate-900 lg:text-lg dark:text-white">
                    {f.title}
                  </h4>
                  <p className="mt-1.5 text-sm text-slate-500 lg:text-base dark:text-slate-400">
                    {f.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <Reveal className="mx-auto flex max-w-5xl flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-14 text-center shadow-xl shadow-blue-900/20 lg:py-20">
          <h3 className="text-2xl font-bold text-white sm:text-3xl">
            {t.landing.ctaTitle}
          </h3>
          <p className="max-w-md text-sm text-blue-100">
            {t.landing.ctaText}
          </p>
          <LinkButton
            href="/sign-up"
            className="mt-2 bg-white text-blue-700 hover:bg-blue-50"
          >
            {t.landing.ctaButton}
          </LinkButton>
        </Reveal>
      </section>

      <footer className="border-t border-slate-200 px-4 py-8 text-center text-xs text-slate-400 sm:px-6 dark:border-slate-800 dark:text-slate-500">
        <span aria-hidden className="mr-1">🎗️</span>
        © {new Date().getFullYear()} MammoAI. {t.footer.rights}
      </footer>
    </div>
  );
}
