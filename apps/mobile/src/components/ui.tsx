import { Pressable, Text, TextInput, View, type PressableProps, type ViewProps } from "react-native";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost";

const VARIANT_CLASSES: Record<Variant, { bg: string; text: string }> = {
  primary: { bg: "bg-primary", text: "text-white" },
  secondary: { bg: "bg-secondary-light", text: "text-text-primary" },
  ghost: { bg: "bg-transparent", text: "text-text-secondary" },
};

export function Button({
  variant = "primary",
  children,
  className,
  disabled,
  ...props
}: PressableProps & { variant?: Variant; children: React.ReactNode; className?: string }) {
  const v = VARIANT_CLASSES[variant];
  return (
    <Pressable
      disabled={disabled}
      className={clsx("min-h-[48px] flex-row items-center justify-center gap-2 rounded-full px-6", v.bg, disabled && "opacity-50", className)}
      {...props}
    >
      {typeof children === "string" ? (
        <Text className={clsx("text-base font-semibold", v.text)}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

export function Card({ className, children, style, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={clsx("rounded-3xl bg-surface p-5", className)}
      style={[{ shadowColor: "#1F2937", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }, style]}
      {...props}
    >
      {children}
    </View>
  );
}

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
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

export function ProgressBar({ value }: { value: number }) {
  return (
    <View className="h-3 w-full overflow-hidden rounded-full bg-surface-muted">
      <View className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
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
      className={clsx("min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-2xl px-3 py-3", active ? "bg-primary" : "bg-surface-muted")}
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
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "phone-pad";
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      className="min-h-[48px] rounded-2xl border border-border bg-surface px-4 text-base text-text-primary"
      placeholderTextColor="#9CA3AF"
    />
  );
}
