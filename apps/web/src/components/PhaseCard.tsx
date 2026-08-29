"use client";

import type { CyclePhase } from "@mammoai/shared";
import { getFertilityLevel } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";

// Joriy tsikl fazasi kartasi — App.pdf'dan keyin, Figma "Make" manbasida topilgan
// haqiqiy dizayn elementi asosida ("Follikul fazasi", "UNUMDOR DAVR" kabi). Har bir
// faza o'ziga xos rangda (menstrual=primary, follicular=secondary, ovulation=accent,
// luteal=success) ko'rsatiladi.

const PHASE_STYLES: Record<CyclePhase, { bg: string; text: string; badge: string }> = {
  menstrual: { bg: "bg-primary-light/40", text: "text-primary-dark", badge: "bg-primary text-white" },
  follicular: { bg: "bg-secondary-light/40", text: "text-secondary", badge: "bg-secondary text-white" },
  ovulation: { bg: "bg-accent-light/40", text: "text-accent", badge: "bg-accent text-white" },
  luteal: { bg: "bg-success/15", text: "text-success", badge: "bg-success text-white" },
};

export function PhaseCard({ phase }: { phase: CyclePhase }) {
  const { dict } = useI18n();
  const style = PHASE_STYLES[phase];
  const fertility = getFertilityLevel(phase);
  const copy = dict.cyclePhase[phase];

  return (
    <div className={`rounded-3xl p-5 ${style.bg}`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-lg font-bold ${style.text}`}>{copy.name}</p>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}>
          {dict.cyclePhase.fertilityLabel}: {dict.cyclePhase.fertilityLevels[fertility]}
        </span>
      </div>
      <p className="mt-2 text-sm text-text-secondary">{copy.description}</p>
    </div>
  );
}
