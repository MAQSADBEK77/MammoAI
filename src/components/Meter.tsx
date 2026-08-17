import { RISK_STATUS_COLOR } from "@/components/RiskBadge";
import type { RiskLevel } from "@/lib/types";

export function Meter({ percent, level }: { percent: number; level: RiskLevel }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const color = RISK_STATUS_COLOR[level];

  return (
    <div className="relative h-3 w-full rounded-full" style={{ backgroundColor: "#e1e0d9" }}>
      <div
        className="h-full rounded-full transition-[width]"
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
      {/* Zone thresholds at 34% and 67% */}
      <div
        className="absolute top-0 h-full w-px bg-white/70"
        style={{ left: "34%" }}
      />
      <div
        className="absolute top-0 h-full w-px bg-white/70"
        style={{ left: "67%" }}
      />
    </div>
  );
}
