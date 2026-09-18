"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Switch,
  Select,
  MenuItem,
} from "@mui/material";
import { Menu as MenuIcon, PersonOutlined, LockOutlined, FeedbackOutlined, Close } from "@mui/icons-material";
import clsx from "clsx";
import type { Language } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { IconButton } from "@/components/ui";
import { Emoji } from "@/components/Emoji";

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: "uz", label: "O'zbekcha (lotin)" },
  { value: "uz-cyrl", label: "Ўзбекча (кирилл)" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

const THEME_OPTIONS: { value: "light" | "dark" | "system"; labelKey: "themeLight" | "themeDark" | "themeSystem"; emoji: string }[] = [
  { value: "light", labelKey: "themeLight", emoji: "☀️" },
  { value: "dark", labelKey: "themeDark", emoji: "🌙" },
  { value: "system", labelKey: "themeSystem", emoji: "⚙️" },
];

const AppDrawerContext = createContext<{ openDrawer: () => void } | null>(null);

/** Bosh sahifa (CycleScreen) kabi ekranlar o'zining maxsus tugmasidan
 * (masalan profil-avatar) mavjud AppDrawer'ni ochish uchun shu hook'dan
 * foydalanadi — yangi navigatsiya qurilmaydi, faqat mavjudining ochilish
 * nuqtasi ko'chiriladi (foydalanuvchi so'rovi, 2026-09-18 UX qayta qurish). */
export function useAppDrawer() {
  const ctx = useContext(AppDrawerContext);
  if (!ctx) throw new Error("useAppDrawer AppDrawerProvider ichida chaqirilishi kerak");
  return ctx;
}

/**
 * Chap tomondagi ochiladigan menyu (burger) — foydalanuvchi so'roviga ko'ra:
 * profil bo'limiga shu yerdan kirish mumkin, til/shrift/kontrast/bildirishnoma
 * kabi tezkor sozlamalar esa profilga kirmasdan, to'g'ridan-to'g'ri shu
 * menyuda ko'rinadi va o'zgartiriladi (referens: davlat xizmatlari ilovasi
 * uslubidagi chap drawer). Ochilish holati shu Provider'da saqlanadi, shunda
 * uni turli ekranlardagi turli tugmalar (global burger-ikonka, CycleScreen
 * profil-avatari) baravar ochishi mumkin.
 */
export function AppDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { dict, language, setLanguage } = useI18n();
  const { user, refresh } = useSession();

  async function save(patch: Parameters<typeof api.me.update>[0]) {
    await api.me.update(patch);
    await refresh();
  }

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  const initials = user?.name?.trim()?.[0]?.toUpperCase() ?? null;

  // Asosiy/Jamiyat/Tekshiruvlar/Hamkor pastki menyuda allaqachon bor — bu
  // yerda takrorlanmaydi. Profil endi FAQAT shu burger menyu orqali ochiladi
  // (foydalanuvchi so'rovi).
  const navItems = [
    { href: "/profil", label: dict.nav.profile, icon: <PersonOutlined /> },
    { href: "/maxfiylik", label: dict.profile.securityTitle, icon: <LockOutlined /> },
    { href: "/fikr", label: dict.feedback.menuLabel, icon: <FeedbackOutlined /> },
  ];

  return (
    <AppDrawerContext.Provider value={{ openDrawer: () => user && setOpen(true) }}>
      {children}
      {user && (
        <Drawer anchor="left" open={open} onClose={() => setOpen(false)} slotProps={{ paper: { sx: { width: 300 } } }}>
        <div className="flex h-full flex-col bg-surface">
          <div className="bg-aurora-profile flex items-center gap-3 p-5 text-white">
            <button type="button" onClick={() => go("/profil")} className="flex flex-1 items-center gap-3 text-left">
              <Avatar src={user.avatarUrl ?? undefined} sx={{ width: 48, height: 48, bgcolor: "rgba(255,255,255,0.25)" }}>
                {!user.avatarUrl && (initials ?? <Emoji e="👋" size={22} />)}
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-bold">{user.name?.trim() || dict.profile.noNameFallback}</p>
                <p className="truncate text-sm text-white/80">{user.phone || dict.profile.phonePlaceholder}</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={dict.common.close}
              // FIX2-07: ilgari 32x32px edi (loyihaning o'z 48px `.tap-target`
              // konvensiyasidan kichik) va aria-label yo'q edi.
              className="tap-target flex shrink-0 items-center justify-center rounded-full bg-white/15 active:scale-95"
            >
              <Close sx={{ fontSize: 18 }} />
            </button>
          </div>

          <List sx={{ py: 1 }}>
            {navItems.map((item) => (
              <ListItemButton key={item.href} onClick={() => go(item.href)}>
                <ListItemIcon sx={{ minWidth: 40, color: "var(--color-primary)" }}>{item.icon}</ListItemIcon>
                <ListItemText slotProps={{ primary: { sx: { fontWeight: 600 } } }}>{item.label}</ListItemText>
              </ListItemButton>
            ))}
          </List>

          <Divider />

          <div className="space-y-4 overflow-y-auto p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted">{dict.profile.accessibilityTitle}</p>

            <div className="flex items-center justify-between gap-3">
              {/* FIX2-10: ilgari oddiy <span> bo'lib, boshqaruv elementiga
                  htmlFor/aria-labelledby orqali ulanmagan edi. */}
              <span id="drawer-language-label" className="text-sm font-medium text-text-primary">
                {dict.profile.languageLabel}
              </span>
              <Select
                labelId="drawer-language-label"
                value={language}
                onChange={(e) => {
                  const lang = e.target.value as Language;
                  setLanguage(lang);
                  save({ language: lang });
                }}
                size="small"
                sx={{ minWidth: 150, borderRadius: "12px", fontSize: "0.8rem" }}
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-text-primary">{dict.profile.fontSizeLabel}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => save({ fontScale: "normal" })}
                  className={clsx(
                    "tap-target rounded-full px-3 text-xs font-semibold",
                    user.fontScale === "normal" ? "bg-primary text-white" : "bg-surface-muted text-text-secondary"
                  )}
                >
                  {dict.profile.fontSizeNormal}
                </button>
                <button
                  onClick={() => save({ fontScale: "large" })}
                  className={clsx(
                    "tap-target rounded-full px-3 text-xs font-semibold",
                    user.fontScale === "large" ? "bg-primary text-white" : "bg-surface-muted text-text-secondary"
                  )}
                >
                  {dict.profile.fontSizeLarge}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-text-primary">{dict.profile.themeLabel}</span>
              <div className="flex gap-2">
                {THEME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => save({ theme: opt.value })}
                    title={dict.profile[opt.labelKey]}
                    aria-label={dict.profile[opt.labelKey]}
                    className={clsx(
                      "tap-target flex items-center justify-center rounded-full px-2.5",
                      user.theme === opt.value ? "bg-primary" : "bg-surface-muted"
                    )}
                  >
                    <Emoji e={opt.emoji} size={15} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              {/* FIX2-10: ilgari oddiy <span> bo'lib, boshqaruv elementiga
                  htmlFor/aria-labelledby orqali ulanmagan edi. */}
              <span id="drawer-notifications-label" className="text-sm font-medium text-text-primary">
                {dict.profile.notificationsLabel}
              </span>
              <Switch
                checked={user.notificationsEnabled}
                onChange={() => save({ notificationsEnabled: !user.notificationsEnabled })}
                slotProps={{ input: { "aria-labelledby": "drawer-notifications-label" } }}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "#fff" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "var(--color-primary)", opacity: 1 },
                }}
              />
            </div>
          </div>
        </div>
        </Drawer>
      )}
    </AppDrawerContext.Provider>
  );
}

/** Global yuqori panelning burger-tugmasi — endi shu Provider kontekstidagi
 * bitta ochilish holatini chaqiradi. Bosh sahifa (CycleScreen) esa bu
 * komponentni emas, o'zining profil-avatar tugmasini ko'rsatadi (bir xil
 * `useAppDrawer()` orqali) — ikkalasi bitta drawer'ni ochadi. */
export function AppDrawer() {
  const { dict } = useI18n();
  const { user } = useSession();
  const { openDrawer } = useAppDrawer();

  if (!user) return null;

  return <IconButton icon={<MenuIcon sx={{ fontSize: 22 }} />} onClick={openDrawer} ariaLabel={dict.common.openMenu} />;
}
