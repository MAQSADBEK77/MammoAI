import clsx from "clsx";
import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from "react";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        size === "md" ? "px-5 py-2.5 text-sm" : "px-3.5 py-1.5 text-sm",
        variant === "primary" &&
          "bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-900/20 hover:from-blue-600 hover:to-blue-800",
        variant === "secondary" &&
          "bg-slate-100 text-slate-700 hover:bg-slate-200",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100",
        variant === "danger" && "bg-red-50 text-red-600 hover:bg-red-100",
        className
      )}
      {...props}
    />
  );
}

export function LinkButton({
  className,
  variant = "primary",
  href,
  children,
}: {
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors",
        variant === "primary" &&
          "bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-900/20 hover:from-blue-600 hover:to-blue-800",
        variant === "secondary" && "bg-slate-100 text-slate-700 hover:bg-slate-200",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  dark = false,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  dark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className={clsx(
          "text-sm font-medium",
          dark ? "text-blue-100" : "text-slate-700"
        )}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className={clsx("text-xs", dark ? "text-blue-300/60" : "text-slate-400")}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function Input({
  className,
  dark = false,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { dark?: boolean }) {
  return (
    <input
      className={clsx(
        "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors",
        dark
          ? "border-white/10 bg-white/5 text-white placeholder:text-blue-300/40 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
          : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  dark = false,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { dark?: boolean }) {
  return (
    <select
      className={clsx(
        "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors",
        dark
          ? "border-white/10 bg-white/5 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 [&>option]:text-slate-900"
          : "border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "green" | "yellow" | "red" | "blue";
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-700",
    yellow: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}
