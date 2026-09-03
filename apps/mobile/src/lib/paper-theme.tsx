import { useMemo, type ReactNode } from "react";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import { colors } from "@mammoai/shared";
import { useModeAccent } from "./theme";

/**
 * React Native Paper temasini joriy rejim (Hayz=pushti/Homiladorlik=binafsha/
 * Tayyorgarlik=moviy-yashil) rangiga moslab qayta tuzadi — foydalanuvchi
 * so'roviga ko'ra butun mobil ilova ham Material UI (React Native Paper)
 * komponentlaridan foydalanadi, lekin MammoAI'ning o'z brend ranglari
 * saqlanadi (web'dagi lib/mui-theme.tsx bilan bir xil mantiq).
 */
export function DynamicPaperProvider({ children }: { children: ReactNode }) {
  const accent = useModeAccent();

  const theme = useMemo(
    () => ({
      ...MD3LightTheme,
      colors: {
        ...MD3LightTheme.colors,
        primary: accent.primary,
        onPrimary: "#FFFFFF",
        primaryContainer: accent.primaryLight,
        onPrimaryContainer: accent.primaryDark,
        secondary: colors.secondary,
        onSecondary: "#FFFFFF",
        secondaryContainer: colors.secondaryLight,
        error: colors.danger,
        background: colors.background,
        surface: colors.surface,
        surfaceVariant: colors.surfaceMuted,
        onSurface: colors.textPrimary,
        onSurfaceVariant: colors.textSecondary,
        outline: colors.border,
      },
      roundness: 16,
    }),
    [accent.primary, accent.primaryDark, accent.primaryLight]
  );

  return <PaperProvider theme={theme}>{children}</PaperProvider>;
}
