import { useEffect, useState } from "react";
import { ScrollView, View, Text, Pressable, Share, Alert, Image, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as ImagePicker from "expo-image-picker";
import clsx from "clsx";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp } from "react-native-reanimated";
import type { BloodType, CycleSettings, Goal, Language } from "@mammoai/shared";
import { BLOOD_TYPES, getModeAccentColors, gradientStops, colors, gradients, formatUzPhoneInput, extractUzPhoneDigits } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { clearToken } from "@/lib/storage";
import { useDrawer } from "@/lib/drawer";
import { Card, TextField } from "@/components/ui";
import { Emoji } from "@/components/Emoji";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const MODES: { goal: Goal; icon: string }[] = [
  { goal: "cycle", icon: "🌸" },
  { goal: "pregnancy", icon: "🤰" },
  { goal: "planning_pregnancy", icon: "🌱" },
];

// Til tanlash — qon guruhi kabi oddiy "bos va ochil" ro'yxat (App.pdf'dan
// tashqari, foydalanuvchi so'roviga ko'ra: "krillcha va ingliz tili qo'shilsin,
// til o'zgartirish qon guruhini o'zgartirish kabi sodda bo'lsin").
const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: "uz", label: "O'zbekcha (lotin)" },
  { value: "uz-cyrl", label: "Ўзбекча (кирилл)" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

export default function ProfileScreen() {
  const { dict, language, setLanguage } = useI18n();
  const { user, onboardingProfile, refresh } = useSession();
  const { openDrawer } = useDrawer();

  const [editingHeader, setEditingHeader] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  const [editingInfo, setEditingInfo] = useState(false);
  const [age, setAge] = useState(String(onboardingProfile?.age ?? ""));
  const [heightCm, setHeightCm] = useState(String(onboardingProfile?.heightCm ?? ""));
  const [weightKg, setWeightKg] = useState(String(onboardingProfile?.weightKg ?? ""));
  const [bloodType, setBloodType] = useState<BloodType | "">(onboardingProfile?.bloodType ?? "");
  const [bloodTypePickerOpen, setBloodTypePickerOpen] = useState(false);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logsCount, setLogsCount] = useState<number | null>(null);
  const [cycleSettings, setCycleSettings] = useState<CycleSettings | null>(null);

  useEffect(() => {
    api.cycle.get().then((res) => {
      setLogsCount(res.logs.length);
      setCycleSettings(res.settings);
    });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setName(user?.name ?? "");
      setPhone(user?.phone ?? "");
    }, 0);
    return () => clearTimeout(timeout);
  }, [user?.name, user?.phone]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAge(String(onboardingProfile?.age ?? ""));
      setHeightCm(String(onboardingProfile?.heightCm ?? ""));
      setWeightKg(String(onboardingProfile?.weightKg ?? ""));
      setBloodType(onboardingProfile?.bloodType ?? "");
    }, 0);
    return () => clearTimeout(timeout);
  }, [onboardingProfile?.age, onboardingProfile?.heightCm, onboardingProfile?.weightKg, onboardingProfile?.bloodType]);

  if (!user) return null;

  async function save(patch: Parameters<typeof api.me.update>[0]) {
    setSaving(true);
    try {
      await api.me.update(patch);
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function saveHeader() {
    await save({ name: name.trim() || null, phone: extractUzPhoneDigits(phone) });
    setEditingHeader(false);
  }

  async function pickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]?.base64) return;
    await save({ avatarUrl: `data:image/jpeg;base64,${result.assets[0].base64}` });
  }

  function changeMode(goal: Goal) {
    if (goal === onboardingProfile?.primaryGoal) return;
    Alert.alert(dict.profile.modeTitle, dict.profile.modeChangeConfirm, [
      { text: dict.common.cancel, style: "cancel" },
      {
        text: dict.common.continueButton,
        onPress: async () => {
          setSaving(true);
          try {
            await api.onboarding.update({ primaryGoal: goal, isPregnant: goal === "pregnancy" });
            await refresh();
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  }

  async function saveInfo() {
    setSaving(true);
    try {
      await api.onboarding.update({
        age: Number(age) || onboardingProfile?.age,
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        bloodType: bloodType || null,
      });
      await refresh();
      setEditingInfo(false);
    } finally {
      setSaving(false);
    }
  }

  // Akkauntdan chiqish — mobilda cookie emas, "Bearer" tokeni ishlatilgani
  // uchun serverga murojaat shart emas, tokenni qurilmadan o'chirish kifoya.
  // Ma'lumotlar saqlanib qoladi — telefon raqami orqali qayta kirish mumkin.
  function logout() {
    Alert.alert(dict.profile.logoutButton, dict.profile.logoutConfirmMessage, [
      { text: dict.common.cancel, style: "cancel" },
      {
        text: dict.profile.logoutConfirmButton,
        onPress: async () => {
          setLoggingOut(true);
          try {
            await clearToken();
            await refresh();
            router.replace("/");
          } catch {
            Alert.alert(dict.profile.logoutError);
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  }

  // Play Store "akkauntni o'chirish" talabi — App.pdf'dan tashqari, foydalanuvchi
  // hech qanday tashqi murojaatsiz akkauntini butunlay o'chira olishi shart.
  function deleteAccount() {
    Alert.alert(dict.profile.deleteAccountConfirmTitle, dict.profile.deleteAccountConfirmMessage, [
      { text: dict.common.cancel, style: "cancel" },
      {
        text: dict.profile.deleteAccountConfirmButton,
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await api.me.deleteAccount();
            await clearToken();
            await refresh();
            router.replace("/");
          } catch {
            setDeleting(false);
            Alert.alert(dict.profile.deleteAccountError);
          }
        },
      },
    ]);
  }

  const initials = user.name?.trim()?.[0]?.toUpperCase() ?? null;
  const daysActive = Math.max(0, Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / 86400000));
  const isCycleMode = onboardingProfile?.primaryGoal === "cycle";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="gap-4 pb-32">
        <Pressable onPress={openDrawer} className="h-9 w-9 items-center justify-center rounded-full bg-surface active:scale-95">
          <MaterialCommunityIcons name="menu" size={22} color="#1F2937" />
        </Pressable>
        {/* Profil "shaxsiy" kartasi — Figma referens dizayniga moslab pushti gradient,
            yuklanadigan avatar va tahrirlanadigan ism/telefon. */}
        <Animated.View entering={FadeInUp.duration(450)}>
          <LinearGradient
            colors={onboardingProfile ? [getModeAccentColors(onboardingProfile.primaryGoal).primary, getModeAccentColors(onboardingProfile.primaryGoal).primaryDark] : gradients.profile}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 32, padding: 22, gap: 16 }}
          >
            <View className="flex-row items-center gap-3.5">
              <Pressable onPress={pickAvatar} className="h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white/20">
                {user.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} className="h-full w-full" />
                ) : initials ? (
                  <Text className="text-2xl font-extrabold text-white">{initials}</Text>
                ) : (
                  <Emoji e="👋" size={30} />
                )}
                <View className="absolute bottom-0 right-0 h-6 w-6 items-center justify-center rounded-full bg-nav">
                  <MaterialCommunityIcons name="camera-outline" size={12} color="#FFFFFF" />
                </View>
              </Pressable>

              <View className="flex-1 gap-1.5">
                {editingHeader ? (
                  <>
                    <TextField value={name} onChangeText={setName} placeholder={dict.profile.nameLabel} />
                    <TextField
                      value={phone}
                      onChangeText={(v) => setPhone(formatUzPhoneInput(v))}
                      placeholder={dict.profile.phoneLabel}
                      keyboardType="phone-pad"
                    />
                  </>
                ) : (
                  <>
                    <Text className="text-xl font-extrabold text-white" numberOfLines={1}>
                      {user.name?.trim() || dict.profile.noNameFallback}
                    </Text>
                    <Text className="text-sm text-white/80" numberOfLines={1}>
                      {user.phone || dict.profile.phonePlaceholder}
                    </Text>
                  </>
                )}
              </View>

              <Pressable
                onPress={() => {
                  if (editingHeader) {
                    saveHeader();
                  } else {
                    setPhone(formatUzPhoneInput(user.phone ?? ""));
                    setEditingHeader(true);
                  }
                }}
                disabled={saving}
                className="h-9 w-9 items-center justify-center rounded-full bg-white/20 active:scale-95"
              >
                {editingHeader ? <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" /> : <MaterialCommunityIcons name="pencil-outline" size={16} color="#FFFFFF" />}
              </Pressable>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 flex-row items-center gap-2 rounded-2xl bg-white/15 px-3.5 py-3">
                <MaterialCommunityIcons name="clock-time-eight-outline" size={18} color="#FFFFFF" />
                <View>
                  <Text className="text-sm font-extrabold text-white">{dict.profile.statsDaysValue(daysActive)}</Text>
                  <Text className="text-[11px] text-white/75">{dict.profile.statsDaysLabel}</Text>
                </View>
              </View>
              <View className="flex-1 flex-row items-center gap-2 rounded-2xl bg-white/15 px-3.5 py-3">
                <MaterialCommunityIcons name="notebook-edit-outline" size={18} color="#FFFFFF" />
                <View>
                  <Text className="text-sm font-extrabold text-white">{logsCount ?? 0}</Text>
                  <Text className="text-[11px] text-white/75">{dict.profile.statsLogsLabel}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {onboardingProfile && (
          <Card className="gap-3">
            <Text className="text-xs font-bold uppercase tracking-wide text-text-muted">{dict.profile.modeTitle}</Text>
            <View className="flex-row gap-2">
              {MODES.map(({ goal, icon }) => {
                const active = onboardingProfile.primaryGoal === goal;
                // Har bir karta o'z rejimining rangida faollashadi (Hayz=pushti,
                // Homiladorlik=binafsha, Tayyorgarlik=moviy-yashil) — Figma referens.
                const accent = getModeAccentColors(goal);
                return (
                  <Pressable
                    key={goal}
                    onPress={() => changeMode(goal)}
                    disabled={saving}
                    className="flex-1 items-center gap-1.5 rounded-2xl border-2 px-2 py-3 active:scale-95"
                    style={{
                      borderColor: active ? accent.primary : colors.border,
                      backgroundColor: active ? `${accent.primaryLight}66` : colors.surface,
                    }}
                  >
                    <Emoji e={icon} size={22} />
                    <Text className="text-xs font-semibold" style={{ color: active ? accent.primaryDark : colors.textSecondary }}>
                      {dict.profile.modes[goal as keyof typeof dict.profile.modes]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        )}

        <Card className="gap-1">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-text-secondary">{dict.profile.personalInfoTitle}</Text>
            <Pressable
              onPress={() => (editingInfo ? saveInfo() : setEditingInfo(true))}
              disabled={saving}
              className="flex-row items-center gap-1 rounded-full px-2.5 py-1 active:opacity-60"
            >
              {editingInfo ? <MaterialCommunityIcons name="check" size={14} color={colors.primaryDark} /> : <MaterialCommunityIcons name="pencil-outline" size={14} color={colors.primaryDark} />}
              <Text className="text-xs font-semibold" style={{ color: colors.primaryDark }}>
                {editingInfo ? dict.profile.doneButton : dict.profile.editButton}
              </Text>
            </Pressable>
          </View>

          <SettingsRow icon="🎂" label={dict.profile.ageLabel}>
            {editingInfo ? (
              <View className="w-20">
                <TextField value={age} onChangeText={setAge} keyboardType="numeric" />
              </View>
            ) : (
              <Text className="text-sm text-text-secondary">
                {onboardingProfile?.age ? dict.profile.ageUnit(onboardingProfile.age) : dict.profile.notSet}
              </Text>
            )}
          </SettingsRow>

          <SettingsRow icon="📏" label={dict.profile.heightLabel}>
            {editingInfo ? (
              <View className="w-20">
                <TextField value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" />
              </View>
            ) : (
              <Text className="text-sm text-text-secondary">
                {onboardingProfile?.heightCm ? dict.profile.heightUnit(onboardingProfile.heightCm) : dict.profile.notSet}
              </Text>
            )}
          </SettingsRow>

          <SettingsRow icon="⚖️" label={dict.profile.weightLabel}>
            {editingInfo ? (
              <View className="w-20">
                <TextField value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" />
              </View>
            ) : (
              <Text className="text-sm text-text-secondary">
                {onboardingProfile?.weightKg ? dict.profile.weightUnit(onboardingProfile.weightKg) : dict.profile.notSet}
              </Text>
            )}
          </SettingsRow>

          <SettingsRow icon="🩸" label={dict.profile.bloodTypeLabel} last={!isCycleMode && !editingInfo}>
            {editingInfo ? (
              <Pressable onPress={() => setBloodTypePickerOpen((v) => !v)} className="rounded-xl border border-border bg-surface px-3 py-2">
                <Text className="text-sm text-text-primary">{bloodType || dict.profile.bloodTypeUnknownOption}</Text>
              </Pressable>
            ) : (
              <Text className="text-sm text-text-secondary">{onboardingProfile?.bloodType || dict.profile.bloodTypeUnknown}</Text>
            )}
          </SettingsRow>

          {editingInfo && bloodTypePickerOpen && (
            <View className="flex-row flex-wrap gap-2 border-b border-border py-2.5">
              {BLOOD_TYPES.map((bt) => (
                <Pressable
                  key={bt}
                  onPress={() => {
                    setBloodType(bt);
                    setBloodTypePickerOpen(false);
                  }}
                  className={clsx("rounded-full border px-3 py-1.5", bloodType === bt ? "border-primary bg-primary" : "border-border bg-surface")}
                >
                  <Text className={clsx("text-xs font-medium", bloodType === bt ? "text-white" : "text-text-secondary")}>{bt}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {isCycleMode && cycleSettings && (
            <>
              <SettingsRow icon="📅" label={dict.cycle.cycleLengthLabel}>
                <Text className="text-sm text-text-secondary">{dict.cycle.daysUnit(cycleSettings.averageCycleLength)}</Text>
              </SettingsRow>
              <SettingsRow icon="🩹" label={dict.cycle.periodLengthLabel} last>
                <Text className="text-sm text-text-secondary">{dict.cycle.daysUnit(cycleSettings.averagePeriodLength)}</Text>
              </SettingsRow>
            </>
          )}
        </Card>

        <Card className="gap-1">
          <Text className="mb-1 text-sm font-semibold text-text-secondary">{dict.profile.accessibilityTitle}</Text>

          <SettingsRow icon="🌐" label={dict.profile.languageLabel}>
            <Pressable onPress={() => setLanguagePickerOpen((v) => !v)} className="rounded-xl border border-border bg-surface px-3 py-2">
              <Text className="text-sm text-text-primary">{LANGUAGE_OPTIONS.find((o) => o.value === language)?.label}</Text>
            </Pressable>
          </SettingsRow>

          {languagePickerOpen && (
            <View className="flex-row flex-wrap gap-2 border-b border-border py-2.5">
              {LANGUAGE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    setLanguage(opt.value);
                    save({ language: opt.value });
                    setLanguagePickerOpen(false);
                  }}
                  className={clsx("rounded-full border px-3 py-1.5", language === opt.value ? "border-primary bg-primary" : "border-border bg-surface")}
                >
                  <Text className={clsx("text-xs font-medium", language === opt.value ? "text-white" : "text-text-secondary")}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <SettingsRow icon="format-size" label={dict.profile.fontSizeLabel}>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => save({ fontScale: "normal" })}
                className={clsx("min-h-[40px] rounded-full px-4 justify-center", user.fontScale === "normal" ? "bg-primary" : "bg-surface-muted")}
              >
                <Text className={clsx("text-sm font-semibold", user.fontScale === "normal" ? "text-white" : "text-text-secondary")}>
                  {dict.profile.fontSizeNormal}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => save({ fontScale: "large" })}
                className={clsx("min-h-[40px] rounded-full px-4 justify-center", user.fontScale === "large" ? "bg-primary" : "bg-surface-muted")}
              >
                <Text className={clsx("text-sm font-semibold", user.fontScale === "large" ? "text-white" : "text-text-secondary")}>
                  {dict.profile.fontSizeLarge}
                </Text>
              </Pressable>
            </View>
          </SettingsRow>

          <SettingsRow icon="eye-outline" label={dict.profile.highContrastLabel}>
            <Toggle checked={user.highContrast} onPress={() => save({ highContrast: !user.highContrast })} />
          </SettingsRow>

          <SettingsRow icon="🔔" label={dict.profile.notificationsLabel} last>
            <Toggle checked={user.notificationsEnabled} onPress={() => save({ notificationsEnabled: !user.notificationsEnabled })} />
          </SettingsRow>
        </Card>

        <Pressable className="active:scale-[0.98]" onPress={() => router.push("/maxfiylik")}>
          <Card className="gap-1">
            <SettingsRow icon="🔒" label={dict.profile.securityTitle} last>
              <Text className="text-sm text-primary-dark">{dict.profile.privacyPolicyLink}</Text>
            </SettingsRow>
          </Card>
        </Pressable>

        <Card className="gap-1">
          <SettingsRow icon="❓" label={dict.profile.helpTitle} last>
            <Pressable onPress={() => Linking.openURL(`tel:${dict.profile.helpPhoneValue.replace(/\s/g, "")}`)}>
              <Text className="text-right text-sm font-semibold" style={{ color: colors.primaryDark }}>
                {dict.profile.helpPhoneValue}
              </Text>
            </Pressable>
          </SettingsRow>
        </Card>

        <LinearGradient
          colors={gradients.pregnancy}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 28, padding: 20 }}
        >
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <Emoji e="✨" size={22} />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-white">{dict.profile.premiumTitle}</Text>
              <Text className="mt-1 text-sm text-white/80">{dict.profile.premiumSubtitle}</Text>
            </View>
          </View>
        </LinearGradient>

        <Card className="gap-1">
          <Pressable className="active:opacity-60" onPress={() => Alert.alert(dict.profile.rateAppButton, dict.profile.rateAppComingSoon)}>
            <SettingsRow icon="⭐" label={dict.profile.rateAppButton} />
          </Pressable>
          <Pressable className="active:opacity-60" onPress={() => Share.share({ message: dict.profile.shareAppMessage })}>
            <SettingsRow icon="📱" label={dict.profile.shareAppButton} last />
          </Pressable>
        </Card>

        {/* Profil "og'irlik darajasi bo'yicha" harakatlar — eksport (neytral) →
            chiqish (neytral) → o'chirish (qizil), bir xil chegaralangan-pill
            uslubda, aniq oraliq bilan (variant="secondary"ning tasodifiy
            binafsha rangi bu ekranning pushti mavzusiga mos kelmasdi). */}
        <View className="gap-3">
          <ProfileActionButton
            label={dict.profile.exportButton}
            onPress={async () => {
              const data = await api.me.exportData();
              const fileUri = `${FileSystem.cacheDirectory}mammoai-malumotlar.json`;
              await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2));
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, { mimeType: "application/json" });
              }
            }}
          />
          <ProfileActionButton label={dict.profile.logoutButton} onPress={logout} disabled={loggingOut} />
          <ProfileActionButton label={dict.profile.deleteAccountButton} onPress={deleteAccount} disabled={deleting} tone="danger" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Profil oxiridagi "hisob harakatlari" (eksport/chiqish/o'chirish) uchun bir xil
 * chegaralangan-pill tugma — `tone="danger"` faqat rangini qizilga o'zgartiradi. */
function ProfileActionButton({
  label,
  onPress,
  disabled,
  tone = "neutral",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "neutral" | "danger";
}) {
  const color = tone === "danger" ? colors.danger : colors.textPrimary;
  const borderColor = tone === "danger" ? `${colors.danger}4D` : colors.border;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="items-center rounded-2xl border bg-surface py-3 active:opacity-60"
      style={{ borderColor, opacity: disabled ? 0.5 : 1 }}
    >
      <Text className="text-sm font-semibold" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
}

function SettingsRow({
  icon,
  label,
  children,
  last,
}: {
  /** Material Community Icons nomi (masalan "format-size") yoki manba
   * ilovadagi ("Uzbek Women's Health Tracker" — src/App.tsx) aynan emoji —
   * ikkalasi ham string, kebab-case bo'lsa ikonka nomi deb hisoblanadi. */
  icon: string;
  label: string;
  children?: React.ReactNode;
  last?: boolean;
}) {
  const isIconName = /^[a-z0-9-]+$/.test(icon);
  return (
    <View className={clsx("flex-row items-center justify-between gap-3 py-2.5", !last && "border-b border-border")}>
      <View className="flex-row items-center gap-3">
        <LinearGradient
          colors={gradientStops(colors.primary)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" }}
        >
          {isIconName ? <MaterialCommunityIcons name={icon as never} size={18} color="#FFFFFF" /> : <Emoji e={icon} />}
        </LinearGradient>
        <Text className="font-medium text-text-primary">{label}</Text>
      </View>
      {children}
    </View>
  );
}

function Toggle({ checked, onPress }: { checked: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={clsx("h-8 w-14 rounded-full p-1", checked ? "bg-primary" : "bg-surface-muted")}>
      <View className={clsx("h-6 w-6 rounded-full bg-white", checked && "ml-6")} />
    </Pressable>
  );
}
