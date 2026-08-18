"use client";

import { useState } from "react";
import { RISK_STATUS_COLOR } from "@/components/RiskBadge";
import { RISK_LABELS } from "@/lib/store";
import { formatDate } from "@/lib/format";
import type { QuizAttempt } from "@/lib/types";

const WIDTH = 640;
const HEIGHT = 220;
const PAD_X = 28;
const PAD_TOP = 16;
const PAD_BOTTOM = 34;

const ZONES: { from: number; to: number; color: string }[] = [
  { from: 0, to: 34, color: RISK_STATUS_COLOR.past },
  { from: 34, to: 67, color: RISK_STATUS_COLOR.orta },
  { from: 67, to: 100, color: RISK_STATUS_COLOR.yuqori },
];

function yFor(percent: number) {
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  return PAD_TOP + plotH * (1 - percent / 100);
}

/** A single-series line chart of risk % over successive attempts, oldest → newest. */
export function RiskHistoryChart({ attempts }: { attempts: QuizAttempt[] }) {
  const ordered = [...attempts].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const [active, setActive] = useState<number | null>(null);

  const plotW = WIDTH - PAD_X * 2;
  const step = ordered.length > 1 ? plotW / (ordered.length - 1) : 0;
  const points = ordered.map((a, i) => ({
    x: PAD_X + (ordered.length > 1 ? i * step : plotW / 2),
    y: yFor(a.percent),
    attempt: a,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const activePoint = active !== null ? points[active] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ height: "auto" }}
        role="img"
        aria-label="Xavf darajasi vaqt bo'yicha o'zgarishi grafigi"
      >
        {/* Zone bands for context (same thresholds as the result meter) */}
        {ZONES.map((z) => (
          <rect
            key={z.from}
            x={PAD_X}
            y={yFor(z.to)}
            width={plotW}
            height={yFor(z.from) - yFor(z.to)}
            fill={z.color}
            opacity={0.06}
          />
        ))}

        {/* Gridlines at zone thresholds */}
        {[0, 34, 67, 100].map((v) => (
          <line
            key={v}
            x1={PAD_X}
            x2={WIDTH - PAD_X}
            y1={yFor(v)}
            y2={yFor(v)}
            stroke="var(--meter-track)"
            strokeWidth={1}
          />
        ))}

        {/* Crosshair */}
        {activePoint && (
          <line
            x1={activePoint.x}
            x2={activePoint.x}
            y1={PAD_TOP}
            y2={HEIGHT - PAD_BOTTOM}
            stroke="currentColor"
            className="text-slate-300 dark:text-slate-700"
            strokeWidth={1}
          />
        )}

        {/* Connecting line — neutral ink, the dots carry the risk-status color */}
        {points.length > 1 && (
          <path d={linePath} fill="none" stroke="currentColor" className="text-slate-400 dark:text-slate-500" strokeWidth={2} />
        )}

        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={p.attempt.id}
            cx={p.x}
            cy={p.y}
            r={active === i ? 7 : 5}
            fill={RISK_STATUS_COLOR[p.attempt.riskLevel]}
            stroke="var(--background)"
            strokeWidth={2}
            className="transition-[r]"
          />
        ))}

        {/* Date labels */}
        {points.map((p) => (
          <text
            key={p.attempt.id}
            x={p.x}
            y={HEIGHT - 12}
            textAnchor="middle"
            fontSize={11}
            className="fill-slate-400 dark:fill-slate-500"
          >
            {formatDate(p.attempt.createdAt).replace(/, \d{4}$/, "")}
          </text>
        ))}
      </svg>

      {/* Transparent hit targets + keyboard focus, sized well beyond the painted dot */}
      <div className="absolute inset-0">
        {points.map((p, i) => (
          <button
            key={p.attempt.id}
            type="button"
            aria-label={`${formatDate(p.attempt.createdAt)}: ${p.attempt.percent}%, ${RISK_LABELS[p.attempt.riskLevel]}`}
            className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            style={{ left: `${(p.x / WIDTH) * 100}%`, top: `${(p.y / HEIGHT) * 100}%` }}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive((cur) => (cur === i ? null : cur))}
            onFocus={() => setActive(i)}
            onBlur={() => setActive((cur) => (cur === i ? null : cur))}
          />
        ))}
      </div>

      {activePoint && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-800"
          style={{
            left: `${(activePoint.x / WIDTH) * 100}%`,
            top: `${(activePoint.y / HEIGHT) * 100}%`,
            marginTop: "-10px",
          }}
        >
          <p className="font-semibold text-slate-900 dark:text-white">
            {activePoint.attempt.percent}% · {RISK_LABELS[activePoint.attempt.riskLevel]}
          </p>
          <p className="text-slate-400 dark:text-slate-500">{formatDate(activePoint.attempt.createdAt)}</p>
        </div>
      )}
    </div>
  );
}
