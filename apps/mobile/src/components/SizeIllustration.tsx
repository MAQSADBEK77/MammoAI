// PLACEHOLDER illyustratsiya — web versiyasi bilan bir xil mantiq (spec §3, ko'ring:
// apps/web/src/components/SizeIllustration.tsx uchun izoh).
import { LinearGradient } from "expo-linear-gradient";
import { gradientStops, colors } from "@mammoai/shared";
import { Emoji } from "@/components/Emoji";

const ICON_EMOJI: Record<string, string> = {
  seed: "🌱",
  raspberry: "🫐",
  lime: "🟢",
  lemon: "🍋",
  avocado: "🥑",
  corn: "🌽",
  eggplant: "🍆",
  coconut: "🥥",
  pineapple: "🍍",
  watermelon: "🍉",
};
const MILESTONE_ORDER = Object.keys(ICON_EMOJI);

export function SizeIllustration({ icon }: { icon: string }) {
  const index = Math.max(0, MILESTONE_ORDER.indexOf(icon));
  const size = 72 + index * 10;

  return (
    <LinearGradient
      colors={gradientStops(colors.accent)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center", alignSelf: "center" }}
    >
      <Emoji e={ICON_EMOJI[icon] ?? "🤰"} size={size * 0.45} />
    </LinearGradient>
  );
}
