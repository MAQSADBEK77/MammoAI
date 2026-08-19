"use client";

import clsx from "clsx";
import { useT } from "@/lib/i18n/context";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  withSubtitle?: boolean;
  align?: "center" | "left";
  dark?: boolean;
}

// Aspect ratio (789:560) matches the logo-full.svg viewBox — keeps the pink
// lockup from stretching at any size.
const SIZES = {
  sm: { w: 108, h: 77, sub: "text-xs" },
  md: { w: 176, h: 125, sub: "text-sm" },
  lg: { w: 224, h: 159, sub: "text-base" },
};

export function Logo({
  size = "md",
  withSubtitle = true,
  align = "center",
  dark = true,
}: LogoProps) {
  const s = SIZES[size];
  const t = useT();
  return (
    <div
      className={clsx(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start text-left"
      )}
    >
      <img
        src="/logo-full.svg"
        alt="MammoAI"
        width={s.w}
        height={s.h}
        className="rounded-xl shadow-2xl shadow-pink-900/30"
      />
      {withSubtitle && (
        <p className={clsx(s.sub, dark ? "text-pink-300" : "text-pink-600 dark:text-pink-400")}>
          {t.logo.subtitle}
        </p>
      )}
    </div>
  );
}
