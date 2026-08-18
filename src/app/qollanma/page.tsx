"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Eye,
  Hand,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { LinkButton } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { apiGetGuideMedia } from "@/lib/store";
import { useT } from "@/lib/i18n/context";

function youtubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function GuidePage() {
  const t = useT();
  const [media, setMedia] = useState<{ imageUrls: string[]; videoUrl: string }>({ imageUrls: [], videoUrl: "" });

  useEffect(() => {
    apiGetGuideMedia().then(setMedia);
  }, []);

  const STEPS = [
    { icon: Calendar, title: t.guide.step1Title, text: t.guide.step1Text },
    { icon: Eye, title: t.guide.step2Title, text: t.guide.step2Text },
    { icon: Hand, title: t.guide.step3Title, text: t.guide.step3Text },
    { icon: Hand, title: t.guide.step4Title, text: t.guide.step4Text },
    { icon: ShieldAlert, title: t.guide.step5Title, text: t.guide.step5Text },
  ];

  const WARNING_SIGNS = [
    t.guide.warning1,
    t.guide.warning2,
    t.guide.warning3,
    t.guide.warning4,
    t.guide.warning5,
    t.guide.warning6,
  ];

  return (
    <div className="flex min-h-full flex-col bg-white dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-pink-50 px-4 py-1.5 text-xs font-medium text-pink-700 dark:bg-pink-500/10 dark:text-pink-300">
            <span aria-hidden>🎗️</span>
            {t.guide.badge}
          </div>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl dark:text-white">
            {t.guide.title}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-500 dark:text-slate-400">
            {t.guide.subtitle}
          </p>
        </Reveal>

        <Reveal delay={100} className="mt-8 flex items-start gap-3 rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          <ShieldAlert size={18} className="mt-0.5 shrink-0" />
          <p>{t.guide.disclaimer}</p>
        </Reveal>

        <div className="mt-10 flex flex-col gap-4">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 90}>
              <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-md shadow-blue-900/20">
                  <step.icon size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{step.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {(media.imageUrls.length > 0 || media.videoUrl) && (
          <Reveal delay={110} className="mt-10 flex flex-col gap-4">
            {media.videoUrl && (
              (() => {
                const embed = youtubeEmbedUrl(media.videoUrl);
                return embed ? (
                  <div className="aspect-video w-full overflow-hidden rounded-2xl shadow-sm">
                    <iframe src={embed} className="h-full w-full" allowFullScreen title="guide-video" />
                  </div>
                ) : (
                  <a href={media.videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
                    {media.videoUrl}
                  </a>
                );
              })()
            )}
            {media.imageUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {media.imageUrls.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt="" className="aspect-square w-full rounded-xl object-cover" />
                ))}
              </div>
            )}
          </Reveal>
        )}

        <Reveal delay={120} className="mt-12">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <AlertTriangle size={18} className="text-amber-500" />
            {t.guide.warningTitle}
          </h2>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {WARNING_SIGNS.map((sign) => (
              <li
                key={sign}
                className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                {sign}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={160} className="mt-12 flex flex-col items-center gap-3 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-10 text-center shadow-xl shadow-blue-900/20">
          <Sparkles size={22} className="text-blue-200" />
          <h3 className="text-xl font-bold text-white">{t.guide.ctaTitle}</h3>
          <p className="max-w-md text-sm text-blue-100">{t.guide.ctaText}</p>
          <LinkButton href="/test" className="mt-1 bg-white text-blue-700 hover:bg-blue-50">
            {t.guide.ctaButton}
          </LinkButton>
        </Reveal>
      </main>
    </div>
  );
}
