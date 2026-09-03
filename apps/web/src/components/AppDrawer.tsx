"use client";

import { useState } from "react";
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
import { Menu as MenuIcon, PersonOutlined, LockOutlined, FavoriteBorderOutlined, Close } from "@mui/icons-material";
import clsx from "clsx";
import type { Language } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { IconButton } from "@/components/ui";

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: "uz", label: "O'zbekcha (lotin)" },
  { value: "uz-cyrl", label: "Ўзбекча (кирилл)" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

/**
 * Chap tomondagi ochiladigan menyu (burger) — foydalanuvchi so'roviga ko'ra:
 * profil bo'limiga shu yerdan kirish mumkin, til/shrift/kontrast/bildirishnoma
 * kabi tezkor sozlamalar esa profilga kirmasdan, to'g'ridan-to'g'ri shu
 * menyuda ko'rinadi va o'zgartiriladi (referens: davlat xizmatlari ilovasi
 * uslubidagi chap drawer).
 */
export function AppDrawer() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { dict, language, setLanguage } = useI18n();
  const { user, refresh } = useSession();

  if (!user) return null;

  async function save(patch: Parameters<typeof api.me.update>[0]) {
    await api.me.update(patch);
    await refresh();
  }

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  const initials = (user.name?.trim()?.[0] ?? "👋").toUpperCase();

  // Asosiy/Jamiyat/Tekshiruvlar pastki menyuda allaqachon bor — bu yerda
  // takrorlanmaydi. Profil endi FAQAT shu burger menyu orqali ochiladi
  // (foydalanuvchi so'rovi).
  const navItems = [
    { href: "/profil", label: dict.nav.profile, icon: <PersonOutlined /> },
    { href: "/hamkor", label: dict.partner.title, icon: <FavoriteBorderOutlined /> },
    { href: "/maxfiylik", label: dict.profile.securityTitle, icon: <LockOutlined /> },
  ];

  return (
    <>
      <IconButton icon={<MenuIcon sx={{ fontSize: 22 }} />} onClick={() => setOpen(true)} />

      <Drawer anchor="left" open={open} onClose={() => setOpen(false)} slotProps={{ paper: { sx: { width: 300 } } }}>
        <div className="flex h-full flex-col bg-surface">
          <div className="bg-aurora-profile flex items-center gap-3 p-5 text-white">
            <button type="button" onClick={() => go("/profil")} className="flex flex-1 items-center gap-3 text-left">
              <Avatar src={user.avatarUrl ?? undefined} sx={{ width: 48, height: 48, bgcolor: "rgba(255,255,255,0.25)" }}>
                {!user.avatarUrl && initials}
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-bold">{user.name?.trim() || dict.profile.noNameFallback}</p>
                <p className="truncate text-sm text-white/80">{user.phone || dict.profile.phonePlaceholder}</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 active:scale-95"
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
              <span className="text-sm font-medium text-text-primary">{dict.profile.languageLabel}</span>
              <Select
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
              <span className="text-sm font-medium text-text-primary">{dict.profile.highContrastLabel}</span>
              <Switch
                checked={user.highContrast}
                onChange={() => save({ highContrast: !user.highContrast })}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "#fff" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "var(--color-primary)", opacity: 1 },
                }}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-text-primary">{dict.profile.notificationsLabel}</span>
              <Switch
                checked={user.notificationsEnabled}
                onChange={() => save({ notificationsEnabled: !user.notificationsEnabled })}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "#fff" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "var(--color-primary)", opacity: 1 },
                }}
              />
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
}
