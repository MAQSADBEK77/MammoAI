"use client";

import { useEffect, useState } from "react";
import { RISK_STATUS_COLOR } from "@/components/RiskBadge";
import type { RiskLevel } from "@/lib/types";

export function Meter({ percent, level }: { percent: number; level: RiskLevel }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const color = RISK_STATUS_COLOR[level];

  // Animate the fill in from 0 on mount instead of snapping straight to value.
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setWidth(clamped));
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  return (
    <div
      className="relative h-3 w-full rounded-full transition-colors"
      style={{ backgroundColor: "var(--meter-track)" }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-[900ms] ease-out"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
      {/* Zone thresholds at 34% and 67% */}
      <div className="absolute top-0 h-full w-px bg-white/70 dark:bg-black/40" style={{ left: "34%" }} />
      <div className="absolute top-0 h-full w-px bg-white/70 dark:bg-black/40" style={{ left: "67%" }} />
    </div>
  );
}
