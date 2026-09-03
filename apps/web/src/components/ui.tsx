"use client";

import { type AnchorHTMLAttributes, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import {
  Button as MuiButton,
  IconButton as MuiIconButton,
  Card as MuiCard,
  Chip as MuiChip,
  LinearProgress,
  Backdrop,
  ToggleButtonGroup,
  ToggleButton,
  Avatar,
} from "@mui/material";

// Foydalanuvchi so'roviga ko'ra ("hamma joyga Material UI ishlat — iconlardan
// tortib buttonlargacha hammasiga 100%") — ilovaning umumiy UI-kit qatlami
// endi to'g'ridan-to'g'ri @mui/material komponentlari ustiga qurilgan. Eski
// komponent nomlari/prop shakllari saqlab qolindi, shunda ularni chaqiruvchi
// o'nlab ekranlarni o'zgartirish shart bo'lmadi — faqat shu faylning ICHKI
// implementatsiyasi MUI'ga o'tdi (haqiqiy Material bosish effekti, soya,
// tipografiya). Brend ranglari (pushti/binafsha/moviy-yashil) MUI temasi
// orqali saqlanadi — lib/mui-theme.tsx'ga qarang.

type ButtonVariant = "primary" | "secondary" | "ghost" | "dark";

function buttonSx(variant: ButtonVariant) {
  switch (variant) {
    case "primary":
      return {
        background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
        color: "#fff",
        boxShadow: "0 8px 20px -6px color-mix(in srgb, var(--color-primary) 45%, transparent)",
        "&:hover": { filter: "brightness(1.05)", boxShadow: "0 8px 20px -6px color-mix(in srgb, var(--color-primary) 55%, transparent)" },
      };
    case "secondary":
      return {
        backgroundColor: "var(--color-secondary-light)",
        color: "var(--color-text-primary)",
        "&:hover": { filter: "brightness(0.97)" },
      };
    case "dark":
      return {
        backgroundColor: "var(--color-nav)",
        color: "#fff",
        "&:hover": { filter: "brightness(1.1)" },
      };
    case "ghost":
    default:
      return {
        backgroundColor: "transparent",
        color: "var(--color-text-secondary)",
        "&:hover": { backgroundColor: "var(--color-surface-muted)" },
      };
  }
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> & { variant?: ButtonVariant }) {
  return (
    <MuiButton
      disableElevation
      className={clsx("tap-target", className)}
      sx={{ fontWeight: 700, borderRadius: 999, px: 3, ...buttonSx(variant) }}
      {...(props as object)}
    >
      {children}
    </MuiButton>
  );
}

/** <a> sifatida chiziladi — <button>ni <a> ichiga joylashtirish noto'g'ri HTML bo'lardi. */
export function LinkButton({
  variant = "primary",
  className,
  children,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "color"> & { variant?: ButtonVariant }) {
  return (
    <MuiButton
      component="a"
      disableElevation
      className={clsx("tap-target", className)}
      sx={{ fontWeight: 700, borderRadius: 999, px: 3, display: "inline-flex", ...buttonSx(variant) }}
      {...(props as object)}
    >
      {children}
    </MuiButton>
  );
}

/** Doiraviy shisha/oq ikona-tugma — suzuvchi orqaga/menyu/qo'ng'iroq tugmalari uchun. */
export function IconButton({
  icon,
  onClick,
  tone = "surface",
  size = 44,
  className,
}: {
  icon: ReactNode;
  onClick?: () => void;
  tone?: "surface" | "glass" | "dark" | "primary";
  size?: number;
  className?: string;
}) {
  const toneSx =
    tone === "surface"
      ? { backgroundColor: "var(--color-surface)", boxShadow: "0 4px 14px color-mix(in srgb, var(--color-text-primary) 6%, transparent)", "&:hover": { backgroundColor: "var(--color-surface-muted)" } }
      : tone === "dark"
        ? { backgroundColor: "var(--color-nav)", color: "#fff", "&:hover": { filter: "brightness(1.1)" } }
        : tone === "primary"
          ? { backgroundColor: "var(--color-primary)", color: "#fff", "&:hover": { filter: "brightness(1.05)" } }
          : { backgroundColor: "var(--glass-light-strong)", border: "1px solid var(--glass-border)", backdropFilter: "blur(10px)", "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" } };
  return (
    <MuiIconButton onClick={onClick} className={className} sx={{ width: size, height: size, ...toneSx }}>
      {icon}
    </MuiIconButton>
  );
}

type CardVariant = "default" | "glass" | "flat";

export function Card({
  className,
  children,
  variant = "default",
  /** Karta button/Link ichida ("bosiladigan" ro'yxat elementi) bo'lsa true qiling —
   * hover'da yumshoq ko'tarilish/soya, bosilganda kichrayish qo'shiladi. */
  interactive,
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: CardVariant; interactive?: boolean }) {
  return (
    <MuiCard
      className={clsx(interactive && "cursor-pointer active:scale-[0.99]", className)}
      sx={{
        borderRadius: "28px",
        p: 2.5,
        transition: "all 200ms",
        backgroundColor: variant === "flat" ? "var(--color-surface-muted)" : variant === "glass" ? "var(--glass-light)" : "var(--color-surface)",
        border: variant === "glass" ? "1px solid var(--glass-border)" : "none",
        backdropFilter: variant === "glass" ? "blur(16px)" : "none",
        boxShadow: variant === "default" ? "0 4px 16px color-mix(in srgb, var(--color-text-primary) 5%, transparent)" : "none",
        ...(interactive && {
          "&:hover": { transform: "translateY(-2px)", boxShadow: "0 12px 28px color-mix(in srgb, var(--color-text-primary) 10%, transparent)" },
        }),
      }}
      {...props}
    >
      {children}
    </MuiCard>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  avatarUri,
  right,
}: {
  title: string;
  subtitle?: string;
  avatarUri?: string | null;
  right?: ReactNode;
}) {
  if (avatarUri !== undefined || right) {
    return (
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          {avatarUri !== undefined && (
            <Avatar src={avatarUri ?? undefined} sx={{ width: 48, height: 48, bgcolor: "var(--color-primary-light)" }}>
              {!avatarUri && "👋"}
            </Avatar>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold text-text-primary">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
    );
  }

  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
    </div>
  );
}

export function Badge({
  tone = "muted",
  children,
}: {
  tone?: "muted" | "success" | "warning" | "danger" | "primary";
  children: ReactNode;
}) {
  const toneSx: Record<string, object> = {
    muted: { backgroundColor: "var(--color-surface-muted)", color: "var(--color-text-secondary)" },
    success: { backgroundColor: "color-mix(in srgb, var(--color-success) 15%, transparent)", color: "var(--color-success)" },
    warning: { backgroundColor: "color-mix(in srgb, var(--color-warning) 15%, transparent)", color: "var(--color-warning)" },
    danger: { backgroundColor: "color-mix(in srgb, var(--color-danger) 15%, transparent)", color: "var(--color-danger)" },
    primary: { backgroundColor: "var(--color-primary-light)", color: "var(--color-primary-dark)" },
  };
  return (
    <MuiChip
      label={children}
      size="small"
      sx={{ height: "auto", py: 0.5, fontWeight: 700, fontSize: "0.75rem", "& .MuiChip-label": { px: 1.5 }, ...toneSx[tone] }}
    />
  );
}

/** Suzuvchi shisha-effekt yorliq — gradient qahramon banner ustiga qo'yiladigan statistika. */
export function FloatingTag({ icon, value, label }: { icon?: ReactNode; value: string; label: string }) {
  return (
    <div className="floating-tag flex items-center gap-2 rounded-2xl px-3.5 py-2.5">
      {icon}
      <div>
        <div className="text-base font-extrabold leading-tight text-text-primary">{value}</div>
        <div className="text-[11px] leading-tight text-text-secondary">{label}</div>
      </div>
    </div>
  );
}

/** Katta raqamli statistika plitkasi (referens: "Heart Rate 85 bpm"). */
export function StatTile({
  icon,
  label,
  value,
  unit,
  tone = "muted",
  active,
  interactive,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  unit?: string;
  tone?: "primary" | "secondary" | "accent" | "muted";
  active?: boolean;
  /** Karta bosiladigan bo'lsa (masalan qiymat kiritish uchun) true qiling. */
  interactive?: boolean;
}) {
  const toneBg = active
    ? tone === "primary"
      ? "var(--color-primary)"
      : tone === "secondary"
        ? "var(--color-secondary)"
        : tone === "accent"
          ? "var(--color-accent)"
          : "var(--color-nav)"
    : "var(--color-surface)";
  return (
    <MuiCard
      className={clsx("flex-1", interactive && "cursor-pointer active:scale-[0.98]")}
      sx={{
        borderRadius: "24px",
        p: 2,
        transition: "all 200ms",
        backgroundColor: toneBg,
        boxShadow: active ? "0 8px 20px color-mix(in srgb, var(--color-nav) 20%, transparent)" : "0 4px 16px color-mix(in srgb, var(--color-text-primary) 5%, transparent)",
        ...(interactive && { "&:hover": { transform: "translateY(-2px)", filter: "brightness(1.03)" } }),
      }}
    >
      <div className={clsx("flex items-center gap-1.5 text-xs font-semibold", active ? "text-white/75" : "text-text-secondary")}>
        {icon}
        {label}
      </div>
      <div className={clsx("mt-3 text-2xl font-extrabold", active ? "text-white" : "text-text-primary")}>
        {value}
        {unit && <span className={clsx("text-sm font-semibold", active ? "text-white/75" : "text-text-secondary")}> {unit}</span>}
      </div>
    </MuiCard>
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
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, v) => v && onChange(v)}
      sx={{
        backgroundColor: "var(--color-surface-muted)",
        borderRadius: "999px",
        p: 0.5,
        gap: 0.5,
        width: "100%",
        "& .MuiToggleButtonGroup-grouped": { border: 0, borderRadius: "999px !important", flex: 1 },
      }}
    >
      {options.map((opt) => (
        <ToggleButton
          key={opt.value}
          value={opt.value}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.75rem",
            color: "var(--color-text-secondary)",
            "&.Mui-selected": { backgroundColor: "var(--color-primary)", color: "#fff", "&:hover": { backgroundColor: "var(--color-primary)" } },
          }}
        >
          {opt.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

export function ProgressBar({ value, tone = "primary" }: { value: number; tone?: "primary" | "secondary" | "accent" }) {
  const barColor = tone === "secondary" ? "var(--color-secondary)" : tone === "accent" ? "var(--color-accent)" : "var(--color-primary)";
  return (
    <LinearProgress
      variant="determinate"
      value={Math.min(100, Math.max(0, value))}
      sx={{
        height: 12,
        borderRadius: 999,
        backgroundColor: "var(--color-surface-muted)",
        "& .MuiLinearProgress-bar": { borderRadius: 999, backgroundColor: barColor },
      }}
    />
  );
}

export function IconChip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon?: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <ToggleButton
      value={label}
      selected={!!active}
      onChange={() => onClick?.()}
      sx={{
        flexDirection: "column",
        gap: 0.5,
        borderRadius: "18px !important",
        border: "none",
        px: 1.5,
        py: 1.5,
        textTransform: "none",
        fontSize: "0.75rem",
        fontWeight: 500,
        color: "var(--color-text-secondary)",
        backgroundColor: "var(--color-surface-muted)",
        "&.Mui-selected": {
          backgroundColor: "var(--color-primary)",
          color: "#fff",
          boxShadow: "0 6px 16px color-mix(in srgb, var(--color-primary) 30%, transparent)",
          "&:hover": { backgroundColor: "var(--color-primary)" },
        },
      }}
    >
      {icon && <span className="text-xl leading-none">{icon}</span>}
      <span className="text-center leading-tight">{label}</span>
    </ToggleButton>
  );
}

/**
 * Brendlangan yuklash indikatori — foydalanuvchi ilgari aynan shu 8 nuqtali
 * "orbit" dizaynni so'ragan (globals.css .loader), shuning uchun MUI'ga
 * o'tishda ham saqlab qolindi — faqat orqa fon endi MUI Backdrop orqali
 * (haqiqiy Material modal-fon xatti-harakati bilan).
 */
export function LoadingSpinner({ label: _label }: { label?: string }) {
  return (
    <Backdrop
      open
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        backgroundColor: "color-mix(in srgb, var(--color-background) 30%, transparent)",
        backdropFilter: "blur(12px)",
      }}
    >
      <span className="loader" />
    </Backdrop>
  );
}
