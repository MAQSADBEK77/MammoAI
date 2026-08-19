import clsx from "clsx";
import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

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
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer",
        size === "md" ? "px-5 py-2.5 text-sm" : "px-3.5 py-1.5 text-sm",
        variant === "primary" &&
          "bg-gradient-to-br from-pink-600 to-pink-800 text-white shadow-lg shadow-pink-900/20 hover:from-pink-700 hover:to-pink-900 hover:shadow-pink-900/30",
        variant === "secondary" &&
          "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
        variant === "ghost" &&
          "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
        variant === "danger" &&
          "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20",
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
        "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]",
        variant === "primary" &&
          "bg-gradient-to-br from-pink-600 to-pink-800 text-white shadow-lg shadow-pink-900/20 hover:from-pink-700 hover:to-pink-900 hover:shadow-pink-900/30",
        variant === "secondary" &&
          "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
        variant === "ghost" &&
          "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
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
        "rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900",
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
          dark ? "text-pink-100" : "text-slate-700 dark:text-slate-200"
        )}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p
          className={clsx(
            "text-xs",
            dark ? "text-pink-300/60" : "text-slate-400 dark:text-slate-500"
          )}
        >
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
          ? "border-white/10 bg-white/5 text-white placeholder:text-pink-300/40 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
          : "border-slate-200 bg-white text-pink-900 placeholder:text-slate-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-pink-400 dark:focus:ring-pink-400/20",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  dark = false,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { dark?: boolean }) {
  return (
    <textarea
      className={clsx(
        "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors",
        dark
          ? "border-white/10 bg-white/5 text-white placeholder:text-pink-300/40 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
          : "border-slate-200 bg-white text-pink-900 placeholder:text-slate-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-pink-400 dark:focus:ring-pink-400/20",
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
          ? "border-white/10 bg-white/5 text-white focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 [&>option]:text-pink-900"
          : "border-slate-200 bg-white text-pink-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:border-pink-400 dark:focus:ring-pink-400/20 dark:[&>option]:text-pink-900",
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
  tone?: "slate" | "green" | "yellow" | "red" | "pink";
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    yellow: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    red: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    pink: "bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-300",
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
