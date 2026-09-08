import { useColorScheme } from "react-native";
import { getModeAccentColors, resolveThemeColors, type ModeAccentColors } from "@mammoai/shared";
import { useSession } from "./session";

/** Joriy rejim (Hayz/Homiladorlik/Tayyorgarlik) bo'yicha brend rangi — Figma
 * referens: rejim almashganda tugma/faol-tab rangi butunlay boshqa rangga
 * o'tadi. Onboarding profili hali yo'q bo'lsa (masalan onboarding oqimining
 * o'zida) standart pushti qaytadi. */
export function useModeAccent(): ModeAccentColors {
  const { onboardingProfile } = useSession();
  return getModeAccentColors(onboardingProfile?.primaryGoal ?? "cycle");
}

/** `user.theme` "system" bo'lsa qurilma sozlamasiga (`useColorScheme`) qarab
 * hal qilinadi, aks holda foydalanuvchi tanlovi to'g'ridan-to'g'ri qaytadi.
 * Foydalanuvchi hali yuklanmagan bo'lsa (masalan onboarding'da) qurilma
 * sozlamasi ishlatiladi. Web'dagi lib/session.tsx'ning mobil ekvivalenti. */
export function useResolvedTheme(): "light" | "dark" {
  const { user } = useSession();
  const systemScheme = useColorScheme();
  const preference = user?.theme ?? "system";
  if (preference === "system") return systemScheme === "dark" ? "dark" : "light";
  return preference;
}

/** Joriy hal qilingan mavzuga mos to'liq rang to'plami — Tailwind
 * class'lari orqali ifodalab bo'lmaydigan joylarda (`color="#hex"` ikonka
 * prop'lari, inline `style`) ishlatiladi. Root `_layout.tsx`dagi `vars()`
 * bilan bir xil manbadan (`resolveThemeColors`) o'qiydi. */
export function useThemeColors() {
  return resolveThemeColors(useResolvedTheme());
}
