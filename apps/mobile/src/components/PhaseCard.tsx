// Joriy tsikl fazasi kartasi — web versiyasi bilan bir xil mantiq
// (apps/web/src/components/PhaseCard.tsx), gradient fon bilan.
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { CyclePhase } from "@mammoai/shared";
import { getFertilityLevel, CYCLE_PHASE_EMOJI, gradientStops, colors } from "@mammoai/shared";
import { useI18n } from "../lib/i18n";
import { Emoji } from "./Emoji";

const PHASE_COLOR: Record<CyclePhase, string> = {
  menstrual: colors.primary,
  follicular: colors.secondary,
  ovulation: colors.accent,
  // Avval "success" (yashil) edi — accent (moviy-yashil) bilan deyarli bir
  // xil ko'rinib, ajratib bo'lmasdi (foydalanuvchi fikri) — endi "warning".
  luteal: colors.warning,
};

export function PhaseCard({ phase }: { phase: CyclePhase }) {
  const { dict } = useI18n();
  const color = PHASE_COLOR[phase];
  const fertility = getFertilityLevel(phase);
  const copy = dict.cyclePhase[phase];

  return (
    <LinearGradient
      colors={gradientStops(color)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 24, padding: 20 }}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-1.5">
          <Emoji e={CYCLE_PHASE_EMOJI[phase]} />
          <Text className="text-lg font-bold text-white">{copy.name}</Text>
        </View>
        <View className="rounded-full bg-white/25 px-3 py-1">
          <Text className="text-xs font-semibold text-white">
            {dict.cyclePhase.fertilityLabel}: {dict.cyclePhase.fertilityLevels[fertility]}
          </Text>
        </View>
      </View>
      <Text className="mt-2 text-sm text-white/90">{copy.description}</Text>
    </LinearGradient>
  );
}
