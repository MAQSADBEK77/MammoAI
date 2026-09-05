// Haftalik o'lcham illyustratsiyasi — PLACEHOLDER: haqiqiy dizayner chizmagan, keyin
// mos illyustratsiya to'plami bilan almashtirish uchun tuzilma tayyor (spec §3).
// Hozircha emoji + o'sib boruvchi gradient doira orqali "kattalik" hissi beriladi.

import { cssGradient, colors } from "@mammoai/shared";
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
  const size = 72 + index * 10; // haftalar o'tgani sayin doira kattalashadi

  return (
    <div
      className="mx-auto flex items-center justify-center rounded-full shadow-md transition-all"
      style={{ width: size, height: size, background: cssGradient(colors.accent) }}
    >
      <Emoji e={ICON_EMOJI[icon] ?? "🤰"} size={size * 0.45} />
    </div>
  );
}
