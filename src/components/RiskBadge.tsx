import { AlertOctagon, AlertTriangle, CheckCircle2 } from "lucide-react";
import { RISK_LABELS } from "@/lib/store";
import type { RiskLevel } from "@/lib/types";

// Fixed status palette — never themed, never reused for categorical series.
export const RISK_STATUS_COLOR: Record<RiskLevel, string> = {
  past: "#0ca30c", // good
  orta: "#fab219", // warning
  yuqori: "#d03b3b", // critical
};

const RISK_ICON: Record<RiskLevel, typeof CheckCircle2> = {
  past: CheckCircle2,
  orta: AlertTriangle,
  yuqori: AlertOctagon,
};

export function RiskBadge({
  level,
  size = "md",
}: {
  level: RiskLevel;
  size?: "sm" | "md";
}) {
  const color = RISK_STATUS_COLOR[level];
  const Icon = RISK_ICON[level];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-semibold text-slate-700"
      style={{
        backgroundColor: `${color}1A`,
        padding: size === "md" ? "0.35rem 0.75rem" : "0.2rem 0.55rem",
        fontSize: size === "md" ? "0.8rem" : "0.72rem",
      }}
    >
      <Icon size={size === "md" ? 14 : 12} style={{ color }} strokeWidth={2.5} />
      {RISK_LABELS[level]}
    </span>
  );
}
