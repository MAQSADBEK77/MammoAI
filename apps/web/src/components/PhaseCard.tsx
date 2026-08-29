"use client";

import type { CyclePhase } from "@mammoai/shared";
import { getFertilityLevel, CYCLE_PHASE_EMOJI, cssGradient, colors } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";

// Joriy tsikl fazasi kartasi — App.pdf'dan keyin, Figma "Make" manbasida topilgan
// haqiqiy dizayn elementi asosida ("Follikul fazasi", "UNUMDOR DAVR" kabi). Har bir
// faza o'ziga xos rangda (menstrual=primary, follicular=secondary, ovulation=accent,
// luteal=success) gradient fon bilan ko'rsatiladi — manba bundle'ida topilgan
// `linear-gradient(135deg, color 0%, colorBB 100%)` naqshiga asoslangan.

const PHASE_COLOR: Record<CyclePhase, string> = {
  menstrual: colors.primary,
  follicular: colors.secondary,
  ovulation: colors.accent,
  luteal: colors.success,
};

export function PhaseCard({ phase }: { phase: CyclePhase }) {
  const { dict } = useI18n();
  const color = PHASE_COLOR[phase];
  const fertility = getFertilityLevel(phase);
  const copy = dict.cyclePhase[phase];

  return (
    <div className="rounded-3xl p-5 text-white shadow-lg" style={{ background: cssGradient(color) }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-bold">
          {CYCLE_PHASE_EMOJI[phase]} {copy.name}
        </p>
        <span className="rounded-full bg-white/25 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
          {dict.cyclePhase.fertilityLabel}: {dict.cyclePhase.fertilityLevels[fertility]}
        </span>
      </div>
      <p className="mt-2 text-sm text-white/90">{copy.description}</p>
    </div>
  );
}
