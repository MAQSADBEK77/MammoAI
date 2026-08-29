// Joriy tsikl fazasi kartasi — web versiyasi bilan bir xil mantiq
// (apps/web/src/components/PhaseCard.tsx).
import { View, Text } from "react-native";
import type { CyclePhase } from "@mammoai/shared";
import { getFertilityLevel } from "@mammoai/shared";
import { useI18n } from "../lib/i18n";

const PHASE_STYLES: Record<CyclePhase, { bg: string; text: string; badge: string }> = {
  menstrual: { bg: "bg-primary-light/40", text: "text-primary-dark", badge: "bg-primary" },
  follicular: { bg: "bg-secondary-light/40", text: "text-secondary", badge: "bg-secondary" },
  ovulation: { bg: "bg-accent-light/40", text: "text-accent", badge: "bg-accent" },
  luteal: { bg: "bg-success/15", text: "text-success", badge: "bg-success" },
};

export function PhaseCard({ phase }: { phase: CyclePhase }) {
  const { dict } = useI18n();
  const style = PHASE_STYLES[phase];
  const fertility = getFertilityLevel(phase);
  const copy = dict.cyclePhase[phase];

  return (
    <View className={`rounded-3xl p-5 ${style.bg}`}>
      <View className="flex-row items-center justify-between gap-3">
        <Text className={`text-lg font-bold ${style.text}`}>{copy.name}</Text>
        <View className={`rounded-full px-3 py-1 ${style.badge}`}>
          <Text className="text-xs font-semibold text-white">
            {dict.cyclePhase.fertilityLabel}: {dict.cyclePhase.fertilityLevels[fertility]}
          </Text>
        </View>
      </View>
      <Text className="mt-2 text-sm text-text-secondary">{copy.description}</Text>
    </View>
  );
}
