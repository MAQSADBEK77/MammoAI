import { Image, Pressable, StyleSheet, Text, TextInput, View, type PressableProps, type ViewProps } from "react-native";
import { useEffect, type ReactNode } from "react";
import clsx from "clsx";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, Easing } from "react-native-reanimated";
import { glass, gradients } from "@mammoai/shared";
import { useModeAccent } from "@/lib/theme";

type Variant = "primary" | "secondary" | "ghost" | "dark";

const VARIANT_CLASSES: Record<Variant, { bg: string; text: string }> = {
  primary: { bg: "bg-primary", text: "text-white" },
  secondary: { bg: "bg-secondary-light", text: "text-text-primary" },
  ghost: { bg: "bg-transparent", text: "text-text-secondary" },
  dark: { bg: "bg-nav", text: "text-white" },
};

export function Button({
  variant = "primary",
  children,
  className,
  disabled,
  ...props
}: PressableProps & { variant?: Variant; children: React.ReactNode; className?: string }) {
  const v = VARIANT_CLASSES[variant];
  const content = typeof children === "string" ? <Text className={clsx("text-base font-semibold", v.text)}>{children}</Text> : children;

  // Primary tugma — gradient fon, rangi joriy rejimga qarab butunlay o'zgaradi
  // (Figma referens: Hayz=pushti, Homiladorlik=binafsha, Tayyorgarlik=moviy-yashil).
  const accent = useModeAccent();
  if (variant === "primary") {
    return (
      <Pressable
        disabled={disabled}
        className={clsx("overflow-hidden rounded-full active:scale-[0.98]", disabled && "opacity-50", className)}
        {...props}
      >
        <LinearGradient
          colors={[accent.primary, accent.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 24 }}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      disabled={disabled}
      className={clsx(
        "min-h-[48px] flex-row items-center justify-center gap-2 rounded-full px-6 active:scale-[0.98]",
        v.bg,
        disabled && "opacity-50",
        className
      )}
      {...props}
    >
      {content}
    </Pressable>
  );
}

/**
 * Doiraviy ikona-tugma — referens kitlardagi suzuvchi oq/shisha doira tugmalar
 * (orqaga qaytish, qo'ng'iroq, menyu) uchun. `tone` fonni belgilaydi.
 */
export function IconButton({
  icon,
  onPress,
  tone = "surface",
  size = 44,
}: {
  icon: ReactNode;
  onPress?: () => void;
  tone?: "surface" | "glass" | "dark" | "primary";
  size?: number;
}) {
  const toneClass =
    tone === "surface" ? "bg-surface" : tone === "dark" ? "bg-nav" : tone === "primary" ? "bg-primary" : "bg-white/70 border border-white/60";
  return (
    <Pressable
      onPress={onPress}
      className={clsx("items-center justify-center rounded-full active:scale-95", toneClass)}
      style={{ width: size, height: size, ...shadowStyle("card") }}
    >
      {icon}
    </Pressable>
  );
}

type CardVariant = "default" | "glass" | "flat";

export function Card({
  className,
  children,
  style,
  variant = "default",
  ...props
}: ViewProps & { className?: string; variant?: CardVariant }) {
  const variantClass = variant === "flat" ? "bg-surface-muted" : variant === "glass" ? "bg-white/60 border border-white/70" : "bg-surface";
  return (
    <View
      className={clsx("rounded-[28px] p-5", variantClass, className)}
      style={[variant === "flat" ? undefined : shadowStyle("card"), style]}
      {...props}
    >
      {children}
    </View>
  );
}

/** Ichki style obyektlarini qayta yozmaslik uchun umumiy soya presetlari. */
export function shadowStyle(kind: "soft" | "card" = "card") {
  return kind === "soft"
    ? { shadowColor: "#3B1B45", shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 4 }
    : { shadowColor: "#1F2937", shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 2 };
}

export function ScreenHeader({
  title,
  subtitle,
  avatarUri,
  right,
}: {
  title: string;
  subtitle?: string;
  /** Mavjud bo'lsa, sarlavha chap tomonida kichik doiraviy avatar ko'rsatiladi
   * (referens kitlardagi "Good Morning / Hello Mummy!" uslubi). */
  avatarUri?: string | null;
  /** O'ng tomonda ko'rsatiladigan slot (masalan, qo'ng'iroq ikonasi). */
  right?: ReactNode;
}) {
  if (avatarUri !== undefined || right) {
    return (
      <View className="mb-5 flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          {avatarUri !== undefined && (
            <View className="h-12 w-12 overflow-hidden rounded-full bg-primary-light">
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} className="h-full w-full" />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <Text className="text-lg">👋</Text>
                </View>
              )}
            </View>
          )}
          <View className="flex-1">
            <Text className="text-2xl font-bold text-text-primary" numberOfLines={1}>
              {title}
            </Text>
            {subtitle && <Text className="mt-0.5 text-sm text-text-secondary">{subtitle}</Text>}
          </View>
        </View>
        {right}
      </View>
    );
  }

  return (
    <View className="mb-5">
      <Text className="text-2xl font-bold text-text-primary">{title}</Text>
      {subtitle && <Text className="mt-1 text-sm text-text-secondary">{subtitle}</Text>}
    </View>
  );
}

const BADGE_TONES: Record<string, string> = {
  muted: "bg-surface-muted text-text-secondary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
  primary: "bg-primary-light text-primary-dark",
};

export function Badge({ tone = "muted", children }: { tone?: keyof typeof BADGE_TONES; children: string }) {
  return (
    <View className={clsx("self-start rounded-full px-3 py-1", BADGE_TONES[tone])}>
      <Text className="text-xs font-semibold">{children}</Text>
    </View>
  );
}

/**
 * Suzuvchi shisha-effekt yorliq — gradient qahramon rasmlari ustiga qo'yiladigan
 * kichik statistika kartochkasi (referens: "32 Completed Week" / "08 Remaining Week").
 */
export function FloatingTag({ icon, value, label }: { icon?: ReactNode; value: string; label: string }) {
  return (
    <View
      className="flex-row items-center gap-2 rounded-2xl bg-white/85 px-3.5 py-2.5"
      style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.7)", ...shadowStyle("soft") }}
    >
      {icon}
      <View>
        <Text className="text-base font-extrabold leading-tight text-text-primary">{value}</Text>
        <Text className="text-[11px] leading-tight text-text-secondary">{label}</Text>
      </View>
    </View>
  );
}

/** Katta raqamli statistika plitkasi (referens: "Heart Rate 85 bpm", "Urine Test 5.2 ph"). */
export function StatTile({
  icon,
  label,
  value,
  unit,
  tone = "muted",
  active,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  unit?: string;
  tone?: "primary" | "secondary" | "accent" | "muted";
  active?: boolean;
}) {
  const toneBg = active
    ? tone === "primary"
      ? "bg-primary"
      : tone === "secondary"
        ? "bg-secondary"
        : tone === "accent"
          ? "bg-accent"
          : "bg-nav"
    : "bg-surface";
  const textTone = active ? "text-white" : "text-text-primary";
  const subTone = active ? "text-white/75" : "text-text-secondary";
  return (
    <View className={clsx("flex-1 gap-3 rounded-3xl p-4", toneBg)} style={active ? shadowStyle("soft") : shadowStyle("card")}>
      <View className="flex-row items-center gap-1.5">
        {icon}
        <Text className={clsx("text-xs font-semibold", subTone)}>{label}</Text>
      </View>
      <Text className={clsx("text-2xl font-extrabold", textTone)}>
        {value}
        {unit && <Text className={clsx("text-sm font-semibold", subTone)}> {unit}</Text>}
      </Text>
    </View>
  );
}

/** Pilla-shaklidagi segmentli almashtirgich (referens: "Weeks | Months | Trimesters"). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View className="flex-row gap-1.5 rounded-full bg-surface-muted p-1.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={clsx("min-h-[36px] flex-1 items-center justify-center rounded-full px-3", active ? "bg-primary" : "bg-transparent")}
          >
            <Text className={clsx("text-xs font-semibold", active ? "text-white" : "text-text-secondary")}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProgressBar({ value, tone = "primary" }: { value: number; tone?: "primary" | "secondary" | "accent" }) {
  const barClass = tone === "secondary" ? "bg-secondary" : tone === "accent" ? "bg-accent" : "bg-primary";
  return (
    <View className="h-3 w-full overflow-hidden rounded-full bg-surface-muted">
      <View className={clsx("h-full rounded-full", barClass)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </View>
  );
}

export function IconChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon?: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={clsx(
        "min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 py-3 active:scale-95",
        active ? "bg-primary" : "bg-surface-muted"
      )}
    >
      {icon && <Text className="text-xl leading-none">{icon}</Text>}
      <Text className={clsx("text-center text-xs font-medium leading-tight", active ? "text-white" : "text-text-secondary")}>{label}</Text>
    </Pressable>
  );
}

export function TextField({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  icon,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "phone-pad";
  /** Chap tomonda ko'rsatiladigan ikona (masalan, qidiruv maydonidagi lupa). */
  icon?: ReactNode;
}) {
  return (
    <View className="relative justify-center">
      {icon && <View className="absolute left-4 z-10">{icon}</View>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        className={clsx("min-h-[48px] rounded-2xl border border-border bg-surface pr-4 text-base text-text-primary", icon ? "pl-11" : "pl-4")}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
}

const ORBIT_DOT_COUNT = 8;
const ORBIT_DURATION = 1100;
const ORBIT_RADIUS = 26;
const ORBIT_DOT_SIZE = 10;

/** Bitta "orbit" nuqtasi — o'z navbatida yorqin (to'liq brend rang) bo'lib
 * yonadi, so'ng xiralashib, navbat boshqa nuqtaga o'tguncha shunday turadi
 * (kometa dumi effekti). Rangi joriy rejimga qarab avtomatik almashadi. */
function OrbitDot({ index, color }: { index: number; color: string }) {
  const progress = useSharedValue(0.15);

  useEffect(() => {
    const delay = (index * ORBIT_DURATION) / ORBIT_DOT_COUNT;
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: ORBIT_DURATION * 0.125, easing: Easing.linear }),
          withTiming(0.15, { duration: ORBIT_DURATION * 0.375, easing: Easing.linear }),
          withTiming(0.15, { duration: ORBIT_DURATION * 0.5 })
        ),
        -1
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const angle = ((index * 360) / ORBIT_DOT_COUNT) * (Math.PI / 180);
  const x = ORBIT_RADIUS * Math.sin(angle);
  const y = -ORBIT_RADIUS * Math.cos(angle);

  const style = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: ORBIT_DOT_SIZE,
          height: ORBIT_DOT_SIZE,
          borderRadius: ORBIT_DOT_SIZE / 2,
          backgroundColor: color,
          left: ORBIT_RADIUS + x - ORBIT_DOT_SIZE / 2,
          top: ORBIT_RADIUS + y - ORBIT_DOT_SIZE / 2,
        },
        style,
      ]}
    />
  );
}

/**
 * Brendlangan yuklash indikatori — 8 nuqtali "orbit" spinneri, joriy rejim
 * rangida (Hayz/Homiladorlik/Tayyorgarlik). Butun ekranni blur fon bilan
 * qoplaydi, spinner markazda suzadi.
 */
export function LoadingSpinner({ label }: { label?: string }) {
  const accent = useModeAccent();
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
      <View className="flex-1 items-center justify-center gap-4">
        <View style={{ width: ORBIT_RADIUS * 2, height: ORBIT_RADIUS * 2 }}>
          {Array.from({ length: ORBIT_DOT_COUNT }).map((_, i) => (
            <OrbitDot key={i} index={i} color={accent.primary} />
          ))}
        </View>
        {label && <Text className="text-sm font-medium text-text-secondary">{label}</Text>}
      </View>
    </View>
  );
}

export { gradients, glass };
