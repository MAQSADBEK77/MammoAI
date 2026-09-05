"use client";

import { useEffect, useRef, useState, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
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
import { Emoji } from "./Emoji";

// Foydalanuvchi so'roviga ko'ra ("hamma joyga Material UI ishlat — iconlardan
// tortib buttonlargacha hammasiga 100%") — ilovaning umumiy UI-kit qatlami
// endi to'g'ridan-to'g'ri @mui/material komponentlari ustiga qurilgan. Eski
// komponent nomlari/prop shakllari saqlab qolindi, shunda ularni chaqiruvchi
// o'nlab ekranlarni o'zgartirish shart bo'lmadi — faqat shu faylning ICHKI
// implementatsiyasi MUI'ga o'tdi (haqiqiy Material bosish effekti, soya,
// tipografiya). Brend ranglari (pushti/binafsha/moviy-yashil) MUI temasi
// orqali saqlanadi — lib/mui-theme.tsx'ga qarang.

type ButtonVariant = "primary" | "secondary" | "ghost" | "dark";

// MUI'ning standart `.Mui-disabled` uslubi background/matn rangini ikkalasini
// ham mustaqil kulrang tusga almashtiradi — natijada ba'zi variantlarda ikkalasi
// bir-biriga juda yaqinlashib, matn deyarli o'qilmay qoladi ("background bilan
// text rangi bir xil bo'lib qolgan" xatosi). Tuzatish: disabled holatda ham ASL
// rang juftligi saqlanadi, faqat butun tugma birga xiralashadi (opacity) — bu
// matn/fon orasidagi nisbiy kontrastni har doim saqlaydi.
function buttonSx(variant: ButtonVariant) {
  switch (variant) {
    case "primary":
      return {
        background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
        color: "#fff",
        boxShadow: "0 8px 20px -6px color-mix(in srgb, var(--color-primary) 45%, transparent)",
        "&:hover": { filter: "brightness(1.05)", boxShadow: "0 8px 20px -6px color-mix(in srgb, var(--color-primary) 55%, transparent)" },
        "&.Mui-disabled": {
          background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
          color: "#fff",
          opacity: 0.45,
          boxShadow: "none",
        },
      };
    case "secondary":
      return {
        backgroundColor: "var(--color-secondary-light)",
        color: "var(--color-text-primary)",
        "&:hover": { filter: "brightness(0.97)" },
        "&.Mui-disabled": { backgroundColor: "var(--color-secondary-light)", color: "var(--color-text-primary)", opacity: 0.5 },
      };
    case "dark":
      return {
        backgroundColor: "var(--color-nav)",
        color: "#fff",
        "&:hover": { filter: "brightness(1.1)" },
        "&.Mui-disabled": { backgroundColor: "var(--color-nav)", color: "#fff", opacity: 0.45 },
      };
    case "ghost":
    default:
      return {
        backgroundColor: "transparent",
        color: "var(--color-text-secondary)",
        "&:hover": { backgroundColor: "var(--color-surface-muted)" },
        "&.Mui-disabled": { backgroundColor: "transparent", color: "var(--color-text-secondary)", opacity: 0.5 },
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
  title: ReactNode;
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
              {!avatarUri && <Emoji e="👋" size={22} />}
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
        // BottomNav'dan (z-20) PASTROQ — aks holda sahifa o'z ma'lumotini
        // yuklayotganda bu Backdrop pastki menyuni ham xira/bosilmas qilib
        // qo'yardi ("pastki menyu blur tagida qolib qolishi" degan xato
        // shundan kelib chiqqan edi). Endi pastki menyu har doim ustida —
        // sahifa hali yuklanayotgan bo'lsa ham darhol boshqa bo'limga o'tish
        // mumkin, kutish shart emas.
        zIndex: 15,
        backgroundColor: "color-mix(in srgb, var(--color-background) 30%, transparent)",
        backdropFilter: "blur(12px)",
      }}
    >
      <span className="loader" />
    </Backdrop>
  );
}

// iOS'dagi "wheel" pastga-tepaga varaqlanadigan tanlagichga o'xshab, scroll-snap
// orqali (yosh/bo'y/vazn/sana kabi raqamli tanlovlar uchun — uchinchi tomon
// kutubxonasiz). Generic <T> — sonlar (yosh, sm, kg) HAM, oy kabi nomlangan
// qiymatlar HAM (label orqali) ishlatilishi mumkin.
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
  const containerRef = useRef<HTMLDivElement>(null);
  const settleTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const padCount = Math.floor(WHEEL_VISIBLE_ROWS / 2);
  const index = options.indexOf(value);

  // Tashqi `value` o'zgarganda (masalan oy almashganda kun ustuni qayta
  // hisoblanganda) ham mos qatorga scroll qilamiz — faqat birinchi renderdan
  // tashqari, chunki foydalanuvchi hozir scroll qilayotgan bo'lishi mumkin.
  useEffect(() => {
    if (index === -1 || !containerRef.current) return;
    containerRef.current.scrollTop = index * WHEEL_ITEM_HEIGHT;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.length]);

  function settle() {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.min(Math.max(Math.round(el.scrollTop / WHEEL_ITEM_HEIGHT), 0), options.length - 1);
    el.scrollTo({ top: idx * WHEEL_ITEM_HEIGHT, behavior: "smooth" });
    const picked = options[idx];
    if (picked !== value) onChange(picked);
  }

  function handleScroll() {
    if (settleTimeout.current) clearTimeout(settleTimeout.current);
    settleTimeout.current = setTimeout(settle, 120);
  }

  // Zamonaviy brauzerlarda `scrollend` — debounce'dan aniqroq va tezroq.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !("onscrollend" in window)) return;
    el.addEventListener("scrollend", settle);
    return () => el.removeEventListener("scrollend", settle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={clsx("relative w-full", !compact && "mx-auto max-w-xs")} style={{ height: WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ROWS }}>
      {/* Markaziy tanlangan qatorni ko'rsatuvchi doimiy band — scroll ustida. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 rounded-2xl border-2 border-primary bg-primary-light/15"
        style={{ height: WHEEL_ITEM_HEIGHT }}
      />
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="tap-target h-full overflow-y-auto scroll-smooth"
        style={{
          scrollSnapType: "y mandatory",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
          maskImage: "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
        }}
      >
        <div style={{ height: WHEEL_ITEM_HEIGHT * padCount }} />
        {options.map((opt, i) => (
          <div
            key={i}
            className="flex items-center justify-center text-lg font-semibold text-text-primary"
            style={{ height: WHEEL_ITEM_HEIGHT, scrollSnapAlign: "center" }}
          >
            {label ? label(opt) : String(opt)}
            {suffix && <span className="ml-1 text-sm font-normal text-text-muted">{suffix}</span>}
          </div>
        ))}
        <div style={{ height: WHEEL_ITEM_HEIGHT * padCount }} />
      </div>
    </div>
  );
}

function daysInMonth(year: number, month: number): number {
  // Oyning 0-kuni — aslida OLDINGI oyning oxirgi kuni (JS Date xususiyati).
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
 * hamma joyida" — avvalgi HTML <input type="date"> o'rnini bosadi). Qiymat
 * har doim "YYYY-MM-DD" ko'rinishida — mavjud state/API bilan bir xil.
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

  // `value` bo'sh (hali umuman tanlanmagan) bo'lsa — g'ildirak baribir BIRON
  // sanani ko'rsatadi (bugungi kun), shuning uchun tashqi holat ham darhol
  // shu bilan mos qilinadi (aks holda "Keyingisi" tugmasi foydalanuvchi biror
  // g'ildirakni chindan siljitmaguncha faollashmay qolardi — ekranda sana
  // ko'rinib turgani holda).
  useEffect(() => {
    if (!parsed) onChange(formatYMD(year, month, day));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-xs gap-2">
      <WheelPicker compact options={days} value={day} onChange={(d) => update({ day: d })} />
      <WheelPicker compact options={months} value={month} label={(m) => monthLabels[m - 1]} onChange={(m) => update({ month: m })} />
      <WheelPicker compact options={years} value={year} onChange={(y) => update({ year: y })} />
    </div>
  );
}
