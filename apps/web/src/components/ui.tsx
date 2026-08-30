"use client";

import { type AnchorHTMLAttributes, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "dark";

function buttonClasses(variant: ButtonVariant, className?: string) {
  return clsx(
    "tap-target inline-flex items-center justify-center gap-2 rounded-full px-6 font-semibold transition active:scale-[0.98] disabled:opacity-50",
    variant === "primary" && "bg-gradient-to-br from-primary to-primary-dark text-white shadow-md shadow-primary/25 hover:brightness-105",
    variant === "secondary" && "bg-secondary-light text-text-primary hover:brightness-95",
    variant === "ghost" && "bg-transparent text-text-secondary hover:bg-surface-muted",
    variant === "dark" && "bg-nav text-white hover:brightness-110",
    className
  );
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button className={buttonClasses(variant, className)} {...props}>
      {children}
    </button>
  );
}

/** <a> sifatida chiziladi — <button>ni <a> ichiga joylashtirish noto'g'ri HTML bo'lardi. */
export function LinkButton({
  variant = "primary",
  className,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: ButtonVariant }) {
  return (
    <a className={buttonClasses(variant, className)} {...props}>
      {children}
    </a>
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
  const toneClass =
    tone === "surface"
      ? "bg-surface shadow-md shadow-text-primary/5 hover:bg-surface-muted"
      : tone === "dark"
        ? "bg-nav text-white hover:brightness-110"
        : tone === "primary"
          ? "bg-primary text-white hover:brightness-105"
          : "floating-tag hover:bg-white/90";
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx("inline-flex items-center justify-center rounded-full transition active:scale-95", toneClass, className)}
      style={{ width: size, height: size }}
    >
      {icon}
    </button>
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
    <div
      className={clsx(
        "rounded-[28px] p-5 transition-all duration-200",
        variant === "flat" ? "bg-surface-muted" : variant === "glass" ? "glass-card" : "bg-surface shadow-md shadow-text-primary/5",
        interactive && "cursor-pointer hover:-translate-y-0.5 hover:shadow-xl hover:shadow-text-primary/10 active:translate-y-0 active:scale-[0.99]",
        className
      )}
      {...props}
    >
      {children}
    </div>
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
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary-light">
              {avatarUri ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUri} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg">👋</span>
              )}
            </div>
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
  const toneClasses: Record<string, string> = {
    muted: "bg-surface-muted text-text-secondary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/15 text-danger",
    primary: "bg-primary-light text-primary-dark",
  };
  return (
    <span className={clsx("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", toneClasses[tone])}>
      {children}
    </span>
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
      ? "bg-primary"
      : tone === "secondary"
        ? "bg-secondary"
        : tone === "accent"
          ? "bg-accent"
          : "bg-nav"
    : "bg-surface shadow-md shadow-text-primary/5";
  const textTone = active ? "text-white" : "text-text-primary";
  const subTone = active ? "text-white/75" : "text-text-secondary";
  return (
    <div
      className={clsx(
        "flex-1 rounded-3xl p-4 transition-all duration-200",
        toneBg,
        active && "shadow-lg shadow-nav/20",
        interactive && "cursor-pointer hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 active:scale-[0.98]"
      )}
    >
      <div className={clsx("flex items-center gap-1.5 text-xs font-semibold", subTone)}>
        {icon}
        {label}
      </div>
      <div className={clsx("mt-3 text-2xl font-extrabold", textTone)}>
        {value}
        {unit && <span className={clsx("text-sm font-semibold", subTone)}> {unit}</span>}
      </div>
    </div>
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
    <div className="flex gap-1.5 rounded-full bg-surface-muted p-1.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={clsx(
              "tap-target flex-1 rounded-full px-3 text-xs font-semibold transition active:scale-95",
              active ? "bg-primary text-white shadow" : "bg-transparent text-text-secondary hover:bg-white/70 hover:text-text-primary"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function ProgressBar({ value, tone = "primary" }: { value: number; tone?: "primary" | "secondary" | "accent" }) {
  const barClass = tone === "secondary" ? "bg-secondary" : tone === "accent" ? "bg-accent" : "bg-primary";
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-surface-muted">
      <div className={clsx("h-full rounded-full transition-all", barClass)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
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
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "tap-target flex flex-col items-center gap-1.5 rounded-2xl px-3 py-3 text-xs font-medium transition",
        active ? "bg-primary text-white shadow-md shadow-primary/25" : "bg-surface-muted text-text-secondary hover:bg-primary-light/40"
      )}
    >
      {icon && <span className="text-xl leading-none">{icon}</span>}
      <span className="text-center leading-tight">{label}</span>
    </button>
  );
}
