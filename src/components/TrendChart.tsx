"use client";

import { useState } from "react";
import { formatDateShort } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/context";
import type { DailyCounts } from "@/lib/store";

const WIDTH = 720;
const HEIGHT = 240;
const PAD_X = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

/** A two-series line chart (signups vs. test attempts) sharing one count axis. */
export function TrendChart({ data }: { data: DailyCounts[] }) {
  const { t, language } = useLanguage();
  const [active, setActive] = useState<number | null>(null);

  const plotW = WIDTH - PAD_X * 2;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const maxValue = Math.max(1, ...data.map((d) => Math.max(d.signups, d.attempts)));
  const step = data.length > 1 ? plotW / (data.length - 1) : 0;

  function yFor(value: number) {
    return PAD_TOP + plotH * (1 - value / maxValue);
  }

  const signupPoints = data.map((d, i) => ({ x: PAD_X + i * step, y: yFor(d.signups), d }));
  const attemptPoints = data.map((d, i) => ({ x: PAD_X + i * step, y: yFor(d.attempts), d }));
  const signupPath = signupPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const attemptPath = attemptPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Sparse x-axis labels so 30 daily points don't collide.
  const labelEvery = Math.ceil(data.length / 6);
  const activeDatum = active !== null ? data[active] : null;
  const activeX = active !== null ? PAD_X + active * step : 0;

  const hasAnyData = data.some((d) => d.signups > 0 || d.attempts > 0);

  return (
    <div className="relative">
      <div className="mb-3 flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--trend-signups)" }} />
          {t.adminOverview.trendSignups}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--trend-attempts)" }} />
          {t.adminOverview.trendAttempts}
        </span>
      </div>

      {!hasAnyData ? (
        <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">{t.adminOverview.trendEmpty}</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ height: "auto" }} role="img" aria-label={t.adminOverview.trendTitle}>
            {/* Recessive gridlines */}
            {[0, 0.5, 1].map((frac) => (
              <line
                key={frac}
                x1={PAD_X}
                x2={WIDTH - PAD_X}
                y1={PAD_TOP + plotH * frac}
                y2={PAD_TOP + plotH * frac}
                stroke="var(--meter-track)"
                strokeWidth={1}
              />
            ))}

            {active !== null && (
              <line x1={activeX} x2={activeX} y1={PAD_TOP} y2={HEIGHT - PAD_BOTTOM} stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth={1} />
            )}

            <path d={signupPath} fill="none" stroke="var(--trend-signups)" strokeWidth={2} strokeLinejoin="round" />
            <path d={attemptPath} fill="none" stroke="var(--trend-attempts)" strokeWidth={2} strokeLinejoin="round" />

            {active !== null && (
              <>
                <circle cx={signupPoints[active].x} cy={signupPoints[active].y} r={4} fill="var(--trend-signups)" stroke="var(--background)" strokeWidth={2} />
                <circle cx={attemptPoints[active].x} cy={attemptPoints[active].y} r={4} fill="var(--trend-attempts)" stroke="var(--background)" strokeWidth={2} />
              </>
            )}

            {data.map(
              (d, i) =>
                i % labelEvery === 0 && (
                  <text key={d.date} x={PAD_X + i * step} y={HEIGHT - 8} textAnchor="middle" fontSize={10} className="fill-slate-400 dark:fill-slate-500">
                    {formatDateShort(d.date, language)}
                  </text>
                )
            )}
          </svg>

          {/* Transparent hover columns */}
          <div className="absolute inset-0">
            {data.map((d, i) => (
              <button
                key={d.date}
                type="button"
                aria-label={`${formatDateShort(d.date, language)}: ${t.adminOverview.trendSignups} ${d.signups}, ${t.adminOverview.trendAttempts} ${d.attempts}`}
                className="absolute top-0 h-full cursor-pointer outline-none"
                style={{
                  left: `${((PAD_X + i * step - step / 2) / WIDTH) * 100}%`,
                  width: `${(step / WIDTH) * 100}%`,
                }}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive((cur) => (cur === i ? null : cur))}
                onFocus={() => setActive(i)}
                onBlur={() => setActive((cur) => (cur === i ? null : cur))}
              />
            ))}
          </div>

          {activeDatum && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800"
              style={{
                left: `${(activeX / WIDTH) * 100}%`,
                top: 0,
              }}
            >
              <p className="font-semibold text-slate-900 dark:text-white">{formatDateShort(activeDatum.date, language)}</p>
              <p style={{ color: "var(--trend-signups)" }}>
                {t.adminOverview.trendSignups}: {activeDatum.signups}
              </p>
              <p style={{ color: "var(--trend-attempts)" }}>
                {t.adminOverview.trendAttempts}: {activeDatum.attempts}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
