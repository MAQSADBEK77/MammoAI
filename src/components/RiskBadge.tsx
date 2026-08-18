"use client";

import { AlertOctagon, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useT } from "@/lib/i18n/context";
import type { Dictionary } from "@/lib/i18n/types";
import type { RiskLevel } from "@/lib/types";

// Fixed status palette — never themed, never reused for categorical series.
// Brand Green/Red (see the pink/emerald/red overrides in globals.css); amber stays Tailwind's default.
export const RISK_STATUS_COLOR: Record<RiskLevel, string> = {
  past: "#3a8f72", // good
  orta: "#fab219", // warning
  yuqori: "#c94a4a", // critical
};

const RISK_ICON: Record<RiskLevel, typeof CheckCircle2> = {
  past: CheckCircle2,
  orta: AlertTriangle,
  yuqori: AlertOctagon,
};

export function getRiskLabel(t: Dictionary, level: RiskLevel): string {
  return { past: t.risk.pastLabel, orta: t.risk.ortaLabel, yuqori: t.risk.yuqoriLabel }[level];
}

export function getRiskDescription(t: Dictionary, level: RiskLevel): string {
  return { past: t.risk.pastDescription, orta: t.risk.ortaDescription, yuqori: t.risk.yuqoriDescription }[level];
}

export function RiskBadge({
  level,
  size = "md",
  pulse = false,
}: {
  level: RiskLevel;
  size?: "sm" | "md";
  /** Subtle attention ring for a standalone "yuqori" result — never used in lists/tables. */
  pulse?: boolean;
}) {
  const t = useT();
  const color = RISK_STATUS_COLOR[level];
  const Icon = RISK_ICON[level];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-semibold text-slate-700 dark:text-slate-100"
      style={{
        backgroundColor: `${color}1A`,
        padding: size === "md" ? "0.35rem 0.75rem" : "0.2rem 0.55rem",
        fontSize: size === "md" ? "0.8rem" : "0.72rem",
      }}
    >
      <span className="relative inline-flex items-center justify-center">
        {pulse && level === "yuqori" && (
          <span
            className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
        <Icon size={size === "md" ? 14 : 12} style={{ color }} strokeWidth={2.5} className="relative" />
      </span>
      {getRiskLabel(t, level)}
    </span>
  );
}
