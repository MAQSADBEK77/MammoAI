import type { RiskLevel } from "./types";

// Pure, side-effect-free — safe to import from both server (API routes,
// scoring) and client code. Display strings (labels/descriptions) live in
// the i18n dictionaries now (see lib/i18n/*.ts + components/RiskBadge.tsx's
// getRiskLabel/getRiskDescription helpers) since they're user-facing text.

export function riskLevelFromPercent(percent: number): RiskLevel {
  if (percent < 34) return "past";
  if (percent < 67) return "orta";
  return "yuqori";
}
