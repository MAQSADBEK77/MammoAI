import { useMemo, type ReactNode } from "react";
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { useModeAccent, useResolvedTheme, useThemeColors } from "./theme";

/**
 * React Native Paper temasini joriy rejim (Hayz=pushti/Homiladorlik=binafsha/
 * Tayyorgarlik=moviy-yashil) rangiga hamda joriy yorug'/qorong'u mavzuga
 * moslab qayta tuzadi — foydalanuvchi so'roviga ko'ra butun mobil ilova ham
 * Material UI (React Native Paper) komponentlaridan foydalanadi, lekin
 * MammoAI'ning o'z brend ranglari saqlanadi (web'dagi lib/mui-theme.tsx
 * bilan bir xil mantiq).
 */
export function DynamicPaperProvider({ children }: { children: ReactNode }) {
  const accent = useModeAccent();
  const resolvedTheme = useResolvedTheme();
  const colors = useThemeColors();
  const base = resolvedTheme === "dark" ? MD3DarkTheme : MD3LightTheme;

  const theme = useMemo(
    () => ({
      ...base,
      colors: {
        ...base.colors,
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
    [base, accent.primary, accent.primaryDark, accent.primaryLight, colors]
  );

  return <PaperProvider theme={theme}>{children}</PaperProvider>;
}
