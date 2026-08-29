"use client";

import { type AnchorHTMLAttributes, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost";

function buttonClasses(variant: ButtonVariant, className?: string) {
  return clsx(
    "tap-target inline-flex items-center justify-center gap-2 rounded-full px-6 font-semibold transition active:scale-[0.98] disabled:opacity-50",
    variant === "primary" && "bg-gradient-to-br from-primary to-primary-dark text-white shadow-md shadow-primary/25 hover:brightness-105",
    variant === "secondary" && "bg-secondary-light text-text-primary hover:brightness-95",
    variant === "ghost" && "bg-transparent text-text-secondary hover:bg-surface-muted",
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

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("rounded-3xl bg-surface p-5 shadow-md shadow-text-primary/5", className)} {...props}>
      {children}
    </div>
  );
}

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
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

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-surface-muted">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
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
