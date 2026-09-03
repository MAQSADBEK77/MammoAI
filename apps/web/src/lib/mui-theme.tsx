"use client";

import { useMemo, type ReactNode } from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { colors, getModeAccentColors } from "@mammoai/shared";
import { useSession } from "./session";

/**
 * MUI temasini joriy rejim (Hayz=pushti/Homiladorlik=binafsha/
 * Tayyorgarlik=moviy-yashil) rangiga moslab qayta tuzadi — App.pdf/foydalanuvchi
 * so'roviga ko'ra butun ilova Material UI komponentlaridan foydalanadi,
 * lekin MammoAI'ning o'z brend ranglari saqlanib qoladi ("Aurora" tokenlari
 * bilan bir xil qiymatlar — packages/shared/src/design-tokens.ts).
 */
export function MuiThemeProvider({ children }: { children: ReactNode }) {
  const { onboardingProfile } = useSession();
  const accent = onboardingProfile ? getModeAccentColors(onboardingProfile.primaryGoal) : { primary: colors.primary, primaryDark: colors.primaryDark, primaryLight: colors.primaryLight };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: "light",
          primary: { main: accent.primary, dark: accent.primaryDark, light: accent.primaryLight, contrastText: "#FFFFFF" },
          secondary: { main: colors.secondary, light: colors.secondaryLight, contrastText: "#FFFFFF" },
          error: { main: colors.danger },
          warning: { main: colors.warning },
          success: { main: colors.success },
          background: { default: colors.background, paper: colors.surface },
          text: { primary: colors.textPrimary, secondary: colors.textSecondary },
          divider: colors.border,
        },
        shape: { borderRadius: 16 },
        typography: {
          fontFamily: "var(--font-body), system-ui, sans-serif",
          button: { textTransform: "none", fontWeight: 700 },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: { borderRadius: 999, minHeight: 48, paddingLeft: 20, paddingRight: 20 },
              sizeSmall: { minHeight: 40 },
            },
          },
          MuiIconButton: {
            styleOverrides: { root: { borderRadius: 999 } },
          },
          MuiCard: {
            styleOverrides: { root: { borderRadius: 28 } },
          },
          MuiChip: {
            styleOverrides: { root: { fontWeight: 600 } },
          },
          MuiPaper: {
            defaultProps: { elevation: 0 },
          },
          // globals.css'dagi `body` qoidasi (fon rangi, yuqori kontrast/shrift
          // o'lchami reaktivligi) yagona manba bo'lib qolishi uchun MUI'ning
          // o'z fon-rangini o'chiramiz.
          MuiCssBaseline: {
            styleOverrides: { body: { backgroundColor: "transparent" } },
          },
        },
      }),
    [accent.primary, accent.primaryDark, accent.primaryLight]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
