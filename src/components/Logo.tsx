import { Activity } from "lucide-react";
import clsx from "clsx";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  withSubtitle?: boolean;
  align?: "center" | "left";
  dark?: boolean;
}

const SIZES = {
  sm: { box: "w-9 h-9", icon: 18, title: "text-lg", sub: "text-xs" },
  md: { box: "w-16 h-16", icon: 32, title: "text-3xl", sub: "text-sm" },
  lg: { box: "w-20 h-20", icon: 40, title: "text-4xl", sub: "text-base" },
};

export function Logo({
  size = "md",
  withSubtitle = true,
  align = "center",
  dark = true,
}: LogoProps) {
  const s = SIZES[size];
  return (
    <div
      className={clsx(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left"
      )}
    >
      <div
        className={clsx(
          s.box,
          "inline-flex items-center justify-center rounded-2xl shadow-2xl shadow-blue-900/30",
          "bg-gradient-to-br from-blue-500 to-blue-700"
        )}
      >
        <Activity size={s.icon} className="text-white" strokeWidth={2.25} />
      </div>
      <div>
        <h1
          className={clsx(
            s.title,
            "font-bold tracking-tight",
            dark ? "text-white" : "text-slate-900"
          )}
        >
          MammoAI
        </h1>
        {withSubtitle && (
          <p className={clsx(s.sub, dark ? "text-blue-300" : "text-blue-600")}>
            Ko&apos;krak saratonini erta aniqlash tizimi
          </p>
        )}
      </div>
    </div>
  );
}
