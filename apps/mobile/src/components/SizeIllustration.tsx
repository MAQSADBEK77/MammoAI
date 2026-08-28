// PLACEHOLDER illyustratsiya — web versiyasi bilan bir xil mantiq (spec §3, ko'ring:
// apps/web/src/components/SizeIllustration.tsx uchun izoh).
import { View, Text } from "react-native";

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
    <View
      className="items-center justify-center self-center rounded-full bg-accent-light"
      style={{ width: size, height: size }}
    >
      <Text style={{ fontSize: size * 0.45 }}>{ICON_EMOJI[icon] ?? "🤰"}</Text>
    </View>
  );
}
