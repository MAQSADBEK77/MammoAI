import type { RiskLevel } from "./types";

// Pure, side-effect-free — safe to import from both server (API routes,
// scoring) and client (display) code.

export function riskLevelFromPercent(percent: number): RiskLevel {
  if (percent < 34) return "past";
  if (percent < 67) return "orta";
  return "yuqori";
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  past: "Past xavf",
  orta: "O'rta xavf",
  yuqori: "Yuqori xavf",
};

export const RISK_DESCRIPTIONS: Record<RiskLevel, string> = {
  past:
    "Hozircha aniqlangan xavf omillari kam. Baribir yiliga bir marta profilaktik ko'rikdan o'ting.",
  orta:
    "Ba'zi xavf omillari aniqlandi. Yaqin orada mutaxassis shifokor ko'rigidan o'tishingiz tavsiya etiladi.",
  yuqori:
    "Bir nechta muhim xavf omili aniqlandi. Iloji boricha tezroq onkolog-mammolog shifokorga murojaat qiling.",
};
