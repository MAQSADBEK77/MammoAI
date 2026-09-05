import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type PressableProps,
  type ViewProps,
} from "react-native";
import { useEffect, useRef, type ReactNode } from "react";
import clsx from "clsx";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  Button as PaperButton,
  IconButton as PaperIconButton,
  Card as PaperCard,
  Chip as PaperChip,
  SegmentedButtons,
  ProgressBar as PaperProgressBar,
  TextInput as PaperTextInput,
  TouchableRipple,
} from "react-native-paper";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, Easing } from "react-native-reanimated";
import { colors, glass, gradients } from "@mammoai/shared";
import { useModeAccent } from "@/lib/theme";
import { Emoji } from "@/components/Emoji";

// Foydalanuvchi so'roviga ko'ra ("hamma joyga Material UI ishlat — iconlardan
// tortib buttonlargacha hammasiga 100%") — mobil UI-kit qatlami endi
// react-native-paper (React Native uchun Material Design) ustiga qurilgan.
// Eski komponent nomlari/prop shakllari saqlab qolindi (haqiqiy MD ripple,
// soya, tipografiya endi ostida ishlaydi). Brend gradienti (pushti/binafsha/
// moviy-yashil) asosiy tugma va kartalarda saqlanadi — lib/paper-theme.tsx.

type Variant = "primary" | "secondary" | "ghost" | "dark";

export function Button({
  variant = "primary",
  children,
  className,
  disabled,
  onPress,
}: PressableProps & { variant?: Variant; children: React.ReactNode; className?: string }) {
  const content = typeof children === "string" ? <Text className={clsx("text-base font-semibold", variant === "primary" || variant === "dark" ? "text-white" : "text-text-primary")}>{children}</Text> : children;

  // Asosiy tugma — gradient fon (rangi joriy rejimga qarab butunlay o'zgaradi:
  // Hayz=pushti, Homiladorlik=binafsha, Tayyorgarlik=moviy-yashil), haqiqiy
  // Material bosish effekti uchun TouchableRipple ichida.
  const accent = useModeAccent();
  if (variant === "primary") {
    return (
      <TouchableRipple
        disabled={disabled ?? undefined}
        onPress={onPress as () => void}
        borderless
        className={clsx("overflow-hidden rounded-full", disabled && "opacity-50", className)}
        style={{ borderRadius: 999 }}
      >
        <LinearGradient
          colors={[accent.primary, accent.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 24 }}
        >
          {content}
        </LinearGradient>
      </TouchableRipple>
    );
  }

  return (
    <PaperButton
      mode={variant === "dark" ? "contained" : variant === "ghost" ? "text" : "contained"}
      disabled={disabled ?? undefined}
      onPress={onPress as () => void}
      className={className}
      buttonColor={variant === "dark" ? "#241127" : variant === "secondary" ? "#C4B5FD" : undefined}
      textColor={variant === "secondary" ? "#1F2937" : variant === "ghost" ? "#4B5563" : undefined}
      contentStyle={{ minHeight: 48 }}
      style={{ borderRadius: 999, justifyContent: "center" }}
      labelStyle={{ fontWeight: "600", fontSize: 16 }}
    >
      {children}
    </PaperButton>
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
  const bg =
    tone === "surface" ? "#FFFFFF" : tone === "dark" ? "#241127" : tone === "primary" ? "#F43F7F" : "rgba(255,255,255,0.7)";
  return (
    <PaperIconButton
      icon={() => icon}
      onPress={onPress}
      size={size * 0.45}
      containerColor={bg}
      style={{ width: size, height: size, margin: 0, ...shadowStyle("card") }}
    />
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
    <PaperCard
      mode="contained"
      className={clsx("rounded-[28px] p-5", variantClass, className)}
      style={[{ borderRadius: 28 }, variant === "flat" ? undefined : shadowStyle("card"), style]}
      {...props}
    >
      {children}
    </PaperCard>
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
  /** Oddiy matn bo'lsa avtomatik <Text> ichiga o'raladi; ReactNode (masalan
   * salomlashuv matni + <Emoji/>) bo'lsa, o'zicha (tayyor holda) chiziladi. */
  title: ReactNode;
  subtitle?: string;
  /** Mavjud bo'lsa, sarlavha chap tomonida kichik doiraviy avatar ko'rsatiladi
   * (referens kitlardagi "Good Morning / Hello Mummy!" uslubi). */
  avatarUri?: string | null;
  /** O'ng tomonda ko'rsatiladigan slot (masalan, qo'ng'iroq ikonasi). */
  right?: ReactNode;
}) {
  const titleNode =
    typeof title === "string" ? (
      <Text className="text-2xl font-bold text-text-primary" numberOfLines={1}>
        {title}
      </Text>
    ) : (
      title
    );

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
                  <Emoji e="👋" size={22} />
                </View>
              )}
            </View>
          )}
          <View className="flex-1">
            {titleNode}
            {subtitle && <Text className="mt-0.5 text-sm text-text-secondary">{subtitle}</Text>}
          </View>
        </View>
        {right}
      </View>
    );
  }

  return (
    <View className="mb-5">
      {titleNode}
      {subtitle && <Text className="mt-1 text-sm text-text-secondary">{subtitle}</Text>}
    </View>
  );
}

const BADGE_TONES: Record<string, { bg: string; text: string }> = {
  muted: { bg: "#F3F4F6", text: "#4B5563" },
  success: { bg: "#57B89426", text: "#57B894" },
  warning: { bg: "#E7A83F26", text: "#E7A83F" },
  danger: { bg: "#E0506F26", text: "#E0506F" },
  primary: { bg: "#FFB3CB", text: "#D62A63" },
};

export function Badge({ tone = "muted", children }: { tone?: keyof typeof BADGE_TONES; children: ReactNode }) {
  const t = BADGE_TONES[tone];
  return (
    <PaperChip
      compact
      style={{ backgroundColor: t.bg, alignSelf: "flex-start", height: 26 }}
      textStyle={{ color: t.text, fontSize: 12, fontWeight: "700", lineHeight: 14 }}
    >
      {children}
    </PaperChip>
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
    <SegmentedButtons
      value={value}
      onValueChange={(v) => onChange(v as T)}
      buttons={options.map((opt) => ({ value: opt.value, label: opt.label, style: { borderRadius: 999 } }))}
      style={{ borderRadius: 999 }}
    />
  );
}

export function ProgressBar({ value, tone = "primary" }: { value: number; tone?: "primary" | "secondary" | "accent" }) {
  const barColor = tone === "secondary" ? "#7C3AED" : tone === "accent" ? "#0D9488" : "#F43F7F";
  return (
    <View className="overflow-hidden rounded-full">
      <PaperProgressBar progress={Math.min(100, Math.max(0, value)) / 100} color={barColor} style={{ height: 12, borderRadius: 999, backgroundColor: "#F3F4F6" }} />
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
  icon?: ReactNode;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableRipple onPress={onPress} borderless style={{ borderRadius: 18, flex: 1 }}>
      <View
        className={clsx("min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 py-3", active ? "bg-primary" : "bg-surface-muted")}
      >
        {icon}
        <Text className={clsx("text-center text-xs font-medium leading-tight", active ? "text-white" : "text-text-secondary")}>{label}</Text>
      </View>
    </TouchableRipple>
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
    <PaperTextInput
      mode="outlined"
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      left={icon ? <PaperTextInput.Icon icon={() => icon} /> : undefined}
      outlineStyle={{ borderRadius: 16, borderColor: "#E5E7EB" }}
      style={{ minHeight: 48, backgroundColor: "#FFFFFF" }}
      contentStyle={{ fontSize: 16, color: "#1F2937" }}
    />
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
 * Brendlangan yuklash indikatori — foydalanuvchi ilgari aynan shu 8 nuqtali
 * "orbit" dizaynni so'ragan, shuning uchun Material UI'ga o'tishda ham
 * saqlab qolindi (joriy rejim rangida, Hayz/Homiladorlik/Tayyorgarlik).
 * Butun ekranni blur fon bilan qoplaydi, spinner markazda suzadi.
 */
export function LoadingSpinner({ label: _label }: { label?: string }) {
  const accent = useModeAccent();
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
      <View className="flex-1 items-center justify-center">
        <View style={{ width: ORBIT_RADIUS * 2, height: ORBIT_RADIUS * 2 }}>
          {Array.from({ length: ORBIT_DOT_COUNT }).map((_, i) => (
            <OrbitDot key={i} index={i} color={accent.primary} />
          ))}
        </View>
      </View>
    </View>
  );
}

export { gradients, glass };

// iOS'dagi native "wheel" tanlagichga o'xshab, ScrollView'ning `snapToInterval`i
// orqali (qo'shimcha kutubxonasiz — RN buni o'zi qo'llab-quvvatlaydi). Generic
// <T> — sonlar (yosh, sm, kg) HAM, oy kabi nomlangan qiymatlar HAM (label
// orqali) ishlatilishi mumkin.
const WHEEL_ITEM_HEIGHT = 48;
const WHEEL_VISIBLE_ROWS = 5;

export function WheelPicker<T>({
  options,
  value,
  onChange,
  label,
  suffix,
  compact,
}: {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  /** Har bir qatorda ko'rsatiladigan matn — berilmasa, qiymatning o'zi (String()). */
  label?: (option: T) => ReactNode;
  /** Har bir qatorga qo'shiladigan birlik yorlig'i (masalan "sm", "kg", "fut"). */
  suffix?: string;
  /** Bir nechta ustunni yonma-yon joylashtirish uchun (fut+dyuym, kun/oy/yil) —
   * markazlashtirilgan `max-w-xs` o'rniga to'liq enini egallaydi, tashqi flex
   * konteyner eni belgilaydi. */
  compact?: boolean;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const padCount = Math.floor(WHEEL_VISIBLE_ROWS / 2);
  const index = options.indexOf(value);

  // Tashqi `value` o'zgarganda (masalan oy almashganda kun ustuni qayta
  // hisoblanganda) ham mos qatorga scroll qilamiz.
  useEffect(() => {
    if (index === -1) return;
    const id = requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: index * WHEEL_ITEM_HEIGHT, animated: false }));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.length]);

  function handleMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.min(Math.max(Math.round(e.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT), 0), options.length - 1);
    const picked = options[idx];
    if (picked !== value) onChange(picked);
  }

  return (
    <View className={clsx("relative w-full self-center", !compact && "max-w-xs")} style={{ height: WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ROWS }}>
      {/* Markaziy tanlangan qatorni ko'rsatuvchi doimiy band — scroll ustida. */}
      <View
        pointerEvents="none"
        className="absolute inset-x-0 z-10 rounded-2xl border-2"
        style={{ height: WHEEL_ITEM_HEIGHT, top: (WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ROWS) / 2 - WHEEL_ITEM_HEIGHT / 2, borderColor: colors.primary, backgroundColor: `${colors.primaryLight}40` }}
      />
      {/* Yuqori/pastki xiralashish — iOS wheel'idagi kabi (LinearGradient, mask-image RN'da yo'q). */}
      <LinearGradient
        pointerEvents="none"
        colors={[colors.background, `${colors.background}00`]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: WHEEL_ITEM_HEIGHT * 1.5, zIndex: 5 }}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[`${colors.background}00`, colors.background]}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: WHEEL_ITEM_HEIGHT * 1.5, zIndex: 5 }}
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumEnd}
      >
        <View style={{ height: WHEEL_ITEM_HEIGHT * padCount }} />
        {options.map((opt, i) => (
          <View key={i} style={{ height: WHEEL_ITEM_HEIGHT }} className="flex-row items-center justify-center gap-1">
            <Text className="text-lg font-semibold text-text-primary">{label ? label(opt) : String(opt)}</Text>
            {suffix && <Text className="text-sm font-normal text-text-muted">{suffix}</Text>}
          </View>
        ))}
        <View style={{ height: WHEEL_ITEM_HEIGHT * padCount }} />
      </ScrollView>
    </View>
  );
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function parseYMD(value: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

function formatYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * "Kun / Oy / Yil" — uchta WheelPicker yonma-yon, iOS'dagi sana tanlagichga
 * o'xshab (foydalanuvchi so'rovi: "iphonedagidek scroll orqali qilishi kerak
 * hamma joyida"). Qiymat har doim "YYYY-MM-DD" ko'rinishida.
 */
export function DateWheelPicker({
  value,
  onChange,
  monthLabels,
  minYear,
  maxYear,
}: {
  value: string;
  onChange: (value: string) => void;
  /** 12 ta oy nomi, 0-indeks = Yanvar (dict.common.months). */
  monthLabels: string[];
  minYear: number;
  maxYear: number;
}) {
  const today = new Date();
  const parsed = parseYMD(value);
  const year = parsed && parsed.year >= minYear && parsed.year <= maxYear ? parsed.year : Math.min(Math.max(today.getFullYear(), minYear), maxYear);
  const month = parsed?.month ?? today.getMonth() + 1;
  const maxDay = daysInMonth(year, month);
  const day = Math.min(parsed?.day ?? today.getDate(), maxDay);

  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y++) years.push(y);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  function update(next: { year?: number; month?: number; day?: number }) {
    const y = next.year ?? year;
    const m = next.month ?? month;
    const d = Math.min(next.day ?? day, daysInMonth(y, m));
    onChange(formatYMD(y, m, d));
  }

  // `value` bo'sh bo'lsa — g'ildirak baribir bugungi kunni ko'rsatadi, shuning
  // uchun tashqi holat ham darhol shu bilan mos qilinadi.
  useEffect(() => {
    if (!parsed) onChange(formatYMD(year, month, day));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View className="w-full max-w-xs flex-row gap-2 self-center">
      <WheelPicker compact options={days} value={day} onChange={(d) => update({ day: d })} />
      <WheelPicker compact options={months} value={month} label={(m) => monthLabels[m - 1]} onChange={(m) => update({ month: m })} />
      <WheelPicker compact options={years} value={year} onChange={(y) => update({ year: y })} />
    </View>
  );
}
