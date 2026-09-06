import { useEffect, useState } from "react";
import { View, Text, Pressable, Modal, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Switch } from "react-native-paper";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import clsx from "clsx";
import type { Language } from "@mammoai/shared";
import { gradients } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useDrawer } from "@/lib/drawer";
import { api } from "@/lib/api";
import { Emoji } from "@/components/Emoji";

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: "uz", label: "O'zbekcha (lotin)" },
  { value: "uz-cyrl", label: "Ўзбекча (кирилл)" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

const DRAWER_WIDTH = 300;

/**
 * Chap tomondagi ochiladigan menyu (burger) — foydalanuvchi so'roviga ko'ra:
 * profil bo'limiga shu yerdan kirish mumkin, til/shrift/kontrast/bildirishnoma
 * kabi tezkor sozlamalar esa profilga kirmasdan, to'g'ridan-to'g'ri shu
 * menyuda ko'rinadi va o'zgartiriladi (web'dagi @/components/AppDrawer bilan
 * bir xil mantiq). Ildiz _layout.tsx'da bitta marta render qilinadi.
 */
export function AppDrawer() {
  const { open, closeDrawer } = useDrawer();
  const { dict, language, setLanguage } = useI18n();
  const { user, refresh } = useSession();
  const insets = useSafeAreaInsets();
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, { duration: open ? 220 : 180 });
  }, [open, progress]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (progress.value - 1) * DRAWER_WIDTH }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value * 0.5 }));

  function close() {
    setTimeout(closeDrawer, 180);
  }

  if (!user) return null;

  async function save(patch: Parameters<typeof api.me.update>[0]) {
    await api.me.update(patch);
    await refresh();
  }

  function go(href: "/(tabs)/profil" | "/maxfiylik" | "/fikr") {
    close();
    router.push(href);
  }

  const initials = user.name?.trim()?.[0]?.toUpperCase() ?? null;

  // Asosiy/Jamiyat/Tekshiruvlar/Hamkor pastki tab panelida allaqachon bor —
  // bu yerda takrorlanmaydi. Profil endi FAQAT shu burger menyu orqali
  // ochiladi (foydalanuvchi so'rovi).
  const navItems: { href: Parameters<typeof go>[0]; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { href: "/(tabs)/profil", label: dict.nav.profile, icon: "account-circle-outline" },
    { href: "/maxfiylik", label: dict.profile.securityTitle, icon: "lock-outline" },
    { href: "/fikr", label: dict.feedback.menuLabel, icon: "message-alert-outline" },
  ];

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={close}>
      <View className="flex-1">
        <Animated.View style={[{ position: "absolute", inset: 0, backgroundColor: "#000" }, backdropStyle]} pointerEvents={open ? "auto" : "none"}>
          <Pressable style={{ flex: 1 }} onPress={close} />
        </Animated.View>

        <Animated.View
          style={[{ position: "absolute", left: 0, top: 0, bottom: 0, width: DRAWER_WIDTH, backgroundColor: "#FFFFFF" }, panelStyle]}
        >
          <LinearGradient
            colors={gradients.profile}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingTop: insets.top + 12, paddingBottom: 16, paddingHorizontal: 20 }}
          >
            <View className="flex-row items-center gap-3">
              <Pressable onPress={() => go("/(tabs)/profil")} className="flex-1 flex-row items-center gap-3">
                <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white/25">
                  {user.avatarUrl ? (
                    <Image source={{ uri: user.avatarUrl }} className="h-full w-full" />
                  ) : initials ? (
                    <Text className="text-lg font-extrabold text-white">{initials}</Text>
                  ) : (
                    <Emoji e="👋" size={22} />
                  )}
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="font-bold text-white" numberOfLines={1}>
                    {user.name?.trim() || dict.profile.noNameFallback}
                  </Text>
                  <Text className="text-sm text-white/80" numberOfLines={1}>
                    {user.phone || dict.profile.phonePlaceholder}
                  </Text>
                </View>
              </Pressable>
              <Pressable onPress={close} className="h-8 w-8 items-center justify-center rounded-full bg-white/15 active:scale-95">
                <MaterialCommunityIcons name="close" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </LinearGradient>

          <View className="py-2">
            {navItems.map((item) => (
              <Pressable
                key={item.href}
                onPress={() => go(item.href)}
                className="flex-row items-center gap-3 px-5 py-3 active:bg-surface-muted"
              >
                <MaterialCommunityIcons name={item.icon} size={20} color="#F43F7F" />
                <Text className="font-semibold text-text-primary">{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <View className="border-t border-border" />

          <View className="gap-4 p-5">
            <Text className="text-xs font-bold uppercase tracking-wide text-text-muted">{dict.profile.accessibilityTitle}</Text>

            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-text-primary">{dict.profile.languageLabel}</Text>
                <Pressable
                  onPress={() => setLanguagePickerOpen((v) => !v)}
                  className="rounded-xl border border-border bg-surface px-3 py-1.5"
                >
                  <Text className="text-xs text-text-primary">{LANGUAGE_OPTIONS.find((o) => o.value === language)?.label}</Text>
                </Pressable>
              </View>
              {languagePickerOpen && (
                <View className="flex-row flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      onPress={() => {
                        setLanguage(opt.value);
                        save({ language: opt.value });
                        setLanguagePickerOpen(false);
                      }}
                      className={clsx(
                        "rounded-full border px-3 py-1.5",
                        language === opt.value ? "border-primary bg-primary" : "border-border bg-surface"
                      )}
                    >
                      <Text className={clsx("text-xs font-medium", language === opt.value ? "text-white" : "text-text-secondary")}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-text-primary">{dict.profile.fontSizeLabel}</Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => save({ fontScale: "normal" })}
                  className={clsx("rounded-full px-3 py-1.5", user.fontScale === "normal" ? "bg-primary" : "bg-surface-muted")}
                >
                  <Text className={clsx("text-xs font-semibold", user.fontScale === "normal" ? "text-white" : "text-text-secondary")}>
                    {dict.profile.fontSizeNormal}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => save({ fontScale: "large" })}
                  className={clsx("rounded-full px-3 py-1.5", user.fontScale === "large" ? "bg-primary" : "bg-surface-muted")}
                >
                  <Text className={clsx("text-xs font-semibold", user.fontScale === "large" ? "text-white" : "text-text-secondary")}>
                    {dict.profile.fontSizeLarge}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-text-primary">{dict.profile.highContrastLabel}</Text>
              <Switch value={user.highContrast} onValueChange={() => save({ highContrast: !user.highContrast })} color="#F43F7F" />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-text-primary">{dict.profile.notificationsLabel}</Text>
              <Switch
                value={user.notificationsEnabled}
                onValueChange={() => save({ notificationsEnabled: !user.notificationsEnabled })}
                color="#F43F7F"
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
