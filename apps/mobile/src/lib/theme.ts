import { getModeAccentColors, type ModeAccentColors } from "@mammoai/shared";
import { useSession } from "./session";

/** Joriy rejim (Hayz/Homiladorlik/Tayyorgarlik) bo'yicha brend rangi — Figma
 * referens: rejim almashganda tugma/faol-tab rangi butunlay boshqa rangga
 * o'tadi. Onboarding profili hali yo'q bo'lsa (masalan onboarding oqimining
 * o'zida) standart pushti qaytadi. */
export function useModeAccent(): ModeAccentColors {
  const { onboardingProfile } = useSession();
  return getModeAccentColors(onboardingProfile?.primaryGoal ?? "cycle");
}
