"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { BloodType, CycleResponse, Goal, Language } from "@mammoai/shared";
import { BLOOD_TYPES, getModeAccentColors, formatUzPhoneInput, extractUzPhoneDigits } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Button, Card } from "@/components/ui";
import { Switch, Select, MenuItem } from "@mui/material";
import clsx from "clsx";
import { PhotoCameraOutlined as Camera, Check, EditOutlined as Pencil, FormatSizeOutlined as Type, VisibilityOutlined as Eye, AccessTimeOutlined as CalendarClock, EditNoteOutlined as NotebookPen } from "@mui/icons-material";

// Profil "REJIMNI TANLANG" — App.pdf §5 dagi 7 ta maqsaddan uchtasi shu yerdan
// tezkor almashtiriladi (qolganlari faqat onboarding'da tanlanadi).
const MODES: { goal: Goal; icon: string }[] = [
  { goal: "cycle", icon: "🌸" },
  { goal: "pregnancy", icon: "🤰" },
  { goal: "planning_pregnancy", icon: "🌱" },
];

// Til tanlash — qon guruhi kabi oddiy dropdown (App.pdf'dan tashqari, foydalanuvchi
// so'roviga ko'ra: "krillcha va ingliz tili qo'shilsin, til o'zgartirish qon
// guruhini o'zgartirish kabi sodda bo'lsin").
const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: "uz", label: "O'zbekcha (lotin)" },
  { value: "uz-cyrl", label: "Ўзбекча (кирилл)" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

const AVATAR_SIZE = 256;

/** Rasmni kichik kvadrat (256x256) JPEG'ga siqib, base64 data URI qaytaradi —
 * bazaga engil saqlash uchun (alohida fayl-saqlash xizmati ulanmagan). */
function resizeImageToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas mavjud emas"));
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error("Rasmni o'qib bo'lmadi"));
    img.src = URL.createObjectURL(file);
  });
}

export default function ProfilePage() {
  const { dict, language, setLanguage } = useI18n();
  const { user, onboardingProfile, refresh } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingHeader, setEditingHeader] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  const [editingInfo, setEditingInfo] = useState(false);
  const [age, setAge] = useState(String(onboardingProfile?.age ?? ""));
  const [heightCm, setHeightCm] = useState(String(onboardingProfile?.heightCm ?? ""));
  const [weightKg, setWeightKg] = useState(String(onboardingProfile?.weightKg ?? ""));
  const [bloodType, setBloodType] = useState<BloodType | "">(onboardingProfile?.bloodType ?? "");

  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [logsCount, setLogsCount] = useState<number | null>(null);
  const [cycleSettings, setCycleSettings] = useState<CycleResponse["settings"] | null>(null);
  const [actionFlash, setActionFlash] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    api.cycle.get().then((res) => {
      setLogsCount(res.logs.length);
      setCycleSettings(res.settings);
    });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setName(user?.name ?? "");
      setPhone(user?.phone ?? "");
    }, 0);
    return () => clearTimeout(timeout);
  }, [user?.name, user?.phone]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAge(String(onboardingProfile?.age ?? ""));
      setHeightCm(String(onboardingProfile?.heightCm ?? ""));
      setWeightKg(String(onboardingProfile?.weightKg ?? ""));
      setBloodType(onboardingProfile?.bloodType ?? "");
    }, 0);
    return () => clearTimeout(timeout);
  }, [onboardingProfile?.age, onboardingProfile?.heightCm, onboardingProfile?.weightKg, onboardingProfile?.bloodType]);

  if (!user) return null;

  async function save(patch: Parameters<typeof api.me.update>[0]) {
    setSaving(true);
    try {
      await api.me.update(patch);
      await refresh();
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  async function saveHeader() {
    await save({ name: name.trim() || null, phone: extractUzPhoneDigits(phone) });
    setEditingHeader(false);
  }

  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarUploading(true);
    try {
      const dataUri = await resizeImageToDataUri(file);
      await save({ avatarUrl: dataUri });
    } finally {
      setAvatarUploading(false);
    }
  }

  async function changeMode(goal: Goal) {
    if (goal === onboardingProfile?.primaryGoal) return;
    if (!window.confirm(dict.profile.modeChangeConfirm)) return;
    setSaving(true);
    try {
      await api.onboarding.update({ primaryGoal: goal, isPregnant: goal === "pregnancy" });
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function saveInfo() {
    setSaving(true);
    try {
      await api.onboarding.update({
        age: Number(age) || onboardingProfile?.age,
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        bloodType: bloodType || null,
      });
      await refresh();
      setEditingInfo(false);
    } finally {
      setSaving(false);
    }
  }

  async function exportData() {
    setExporting(true);
    try {
      const data = await api.me.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mammoai-malumotlar.json";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  function flash(message: string) {
    setActionFlash(message);
    setTimeout(() => setActionFlash(null), 2000);
  }

  async function shareApp() {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: dict.common.appName, text: dict.profile.shareAppMessage, url });
      } catch {
        // Foydalanuvchi bekor qildi — hech narsa qilinmaydi.
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      flash(dict.profile.shareAppLinkCopied);
    }
  }

  const initials = (user.name?.trim()?.[0] ?? "👋").toUpperCase();
  const daysActive = Math.max(0, Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / 86400000));
  const isCycleMode = onboardingProfile?.primaryGoal === "cycle";

  return (
    <div className="space-y-5 pb-6">
      {/* Profil "shaxsiy" kartasi — Figma referens dizayniga moslab pushti gradient,
          yuklanadigan avatar va tahrirlanadigan ism/telefon. */}
      <div className="bg-aurora-profile animate-fade-in-up space-y-4 rounded-[32px] p-6">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 text-2xl font-extrabold text-white"
          >
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- kichik base64 avatar, next/image shart emas
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
              <Camera sx={{ fontSize: 18 }} className="text-white" />
            </span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />

          <div className="min-w-0 flex-1 space-y-1">
            {editingHeader ? (
              <>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={dict.profile.nameLabel}
                  className="tap-target w-full rounded-xl border border-white/30 bg-white/15 px-3 text-base font-bold text-white placeholder:text-white/60 outline-none focus:border-white"
                />
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone ?? ""}
                  onChange={(e) => setPhone(formatUzPhoneInput(e.target.value))}
                  placeholder={dict.profile.phoneLabel}
                  className="tap-target w-full rounded-xl border border-white/30 bg-white/15 px-3 text-sm text-white placeholder:text-white/60 outline-none focus:border-white"
                />
              </>
            ) : (
              <>
                <p className="truncate text-xl font-extrabold text-white">{user.name?.trim() || dict.profile.noNameFallback}</p>
                <p className="truncate text-sm text-white/80">{user.phone || dict.profile.phonePlaceholder}</p>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (editingHeader) {
                saveHeader();
              } else {
                setPhone(formatUzPhoneInput(user.phone ?? ""));
                setEditingHeader(true);
              }
            }}
            disabled={saving}
            className="tap-target flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 active:scale-95"
          >
            {editingHeader ? <Check sx={{ fontSize: 16 }} /> : <Pencil sx={{ fontSize: 16 }} />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-white/15 px-3.5 py-3">
            <CalendarClock sx={{ fontSize: 18 }} className="text-white" />
            <div>
              <p className="text-sm font-extrabold text-white">{dict.profile.statsDaysValue(daysActive)}</p>
              <p className="text-[11px] text-white/75">{dict.profile.statsDaysLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/15 px-3.5 py-3">
            <NotebookPen sx={{ fontSize: 18 }} className="text-white" />
            <div>
              <p className="text-sm font-extrabold text-white">{logsCount ?? 0}</p>
              <p className="text-[11px] text-white/75">{dict.profile.statsLogsLabel}</p>
            </div>
          </div>
        </div>
      </div>

      {onboardingProfile && (
        <Card className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-text-muted">{dict.profile.modeTitle}</p>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map(({ goal, icon }) => {
              const active = onboardingProfile.primaryGoal === goal;
              // Har bir karta o'z rejimining rangida faollashadi (Hayz=pushti,
              // Homiladorlik=binafsha, Tayyorgarlik=moviy-yashil) — Figma referens.
              const accent = getModeAccentColors(goal);
              return (
                <button
                  key={goal}
                  onClick={() => changeMode(goal)}
                  disabled={saving}
                  className="flex flex-col items-center gap-1.5 rounded-2xl border-2 px-2 py-3 text-center transition active:scale-95"
                  style={{
                    borderColor: active ? accent.primary : "var(--color-border)",
                    backgroundColor: active ? `${accent.primaryLight}66` : "var(--color-surface)",
                  }}
                >
                  <span className="text-xl leading-none">{icon}</span>
                  <span className="text-xs font-semibold" style={{ color: active ? accent.primaryDark : "var(--color-text-secondary)" }}>
                    {dict.profile.modes[goal as keyof typeof dict.profile.modes]}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="space-y-1">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-text-secondary">{dict.profile.personalInfoTitle}</p>
          <button
            onClick={() => (editingInfo ? saveInfo() : setEditingInfo(true))}
            disabled={saving}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-primary-dark transition hover:bg-primary-light/30"
          >
            {editingInfo ? <Check sx={{ fontSize: 14 }} /> : <Pencil sx={{ fontSize: 14 }} />}
            {editingInfo ? dict.profile.doneButton : dict.profile.editButton}
          </button>
        </div>

        <SettingsRow icon="🎂" label={dict.profile.ageLabel} last={!editingInfo && !isCycleMode}>
          {editingInfo ? (
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="tap-target w-20 rounded-xl border border-border bg-surface px-2 text-right text-sm text-text-primary outline-none focus:border-primary"
            />
          ) : (
            <span className="text-sm text-text-secondary">{onboardingProfile?.age ? dict.profile.ageUnit(onboardingProfile.age) : dict.profile.notSet}</span>
          )}
        </SettingsRow>

        <SettingsRow icon="📏" label={dict.profile.heightLabel}>
          {editingInfo ? (
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="tap-target w-20 rounded-xl border border-border bg-surface px-2 text-right text-sm text-text-primary outline-none focus:border-primary"
            />
          ) : (
            <span className="text-sm text-text-secondary">
              {onboardingProfile?.heightCm ? dict.profile.heightUnit(onboardingProfile.heightCm) : dict.profile.notSet}
            </span>
          )}
        </SettingsRow>

        <SettingsRow icon="⚖️" label={dict.profile.weightLabel}>
          {editingInfo ? (
            <input
              type="number"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="tap-target w-20 rounded-xl border border-border bg-surface px-2 text-right text-sm text-text-primary outline-none focus:border-primary"
            />
          ) : (
            <span className="text-sm text-text-secondary">
              {onboardingProfile?.weightKg ? dict.profile.weightUnit(onboardingProfile.weightKg) : dict.profile.notSet}
            </span>
          )}
        </SettingsRow>

        <SettingsRow icon="🩸" label={dict.profile.bloodTypeLabel} last={!isCycleMode}>
          {editingInfo ? (
            <Select
              value={bloodType}
              onChange={(e) => setBloodType(e.target.value as BloodType)}
              size="small"
              sx={{ minWidth: 110, borderRadius: "12px", fontSize: "0.875rem" }}
            >
              <MenuItem value="">{dict.profile.bloodTypeUnknownOption}</MenuItem>
              {BLOOD_TYPES.map((bt) => (
                <MenuItem key={bt} value={bt}>
                  {bt}
                </MenuItem>
              ))}
            </Select>
          ) : (
            <span className="text-sm text-text-secondary">{onboardingProfile?.bloodType || dict.profile.bloodTypeUnknown}</span>
          )}
        </SettingsRow>

        {isCycleMode && cycleSettings && (
          <>
            <SettingsRow icon="📅" label={dict.cycle.cycleLengthLabel}>
              <span className="text-sm text-text-secondary">{dict.cycle.daysUnit(cycleSettings.averageCycleLength)}</span>
            </SettingsRow>
            <SettingsRow icon="🩹" label={dict.cycle.periodLengthLabel} last>
              <span className="text-sm text-text-secondary">{dict.cycle.daysUnit(cycleSettings.averagePeriodLength)}</span>
            </SettingsRow>
          </>
        )}
      </Card>

      <Card className="space-y-1">
        <p className="mb-2 text-sm font-semibold text-text-secondary">{dict.profile.accessibilityTitle}</p>

        <SettingsRow icon="🌐" label={dict.profile.languageLabel}>
          <Select
            value={language}
            onChange={(e) => {
              const lang = e.target.value as Language;
              setLanguage(lang);
              save({ language: lang });
            }}
            size="small"
            sx={{ minWidth: 160, borderRadius: "12px", fontSize: "0.875rem" }}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </SettingsRow>

        <SettingsRow icon={Type} label={dict.profile.fontSizeLabel}>
          <div className="flex gap-2">
            <button
              onClick={() => save({ fontScale: "normal" })}
              className={clsx(
                "tap-target rounded-full px-4 text-sm font-semibold",
                user.fontScale === "normal" ? "bg-primary text-white" : "bg-surface-muted text-text-secondary"
              )}
            >
              {dict.profile.fontSizeNormal}
            </button>
            <button
              onClick={() => save({ fontScale: "large" })}
              className={clsx(
                "tap-target rounded-full px-4 text-sm font-semibold",
                user.fontScale === "large" ? "bg-primary text-white" : "bg-surface-muted text-text-secondary"
              )}
            >
              {dict.profile.fontSizeLarge}
            </button>
          </div>
        </SettingsRow>

        <SettingsRow icon={Eye} label={dict.profile.highContrastLabel}>
          <Toggle checked={user.highContrast} onChange={() => save({ highContrast: !user.highContrast })} />
        </SettingsRow>

        <SettingsRow icon="🔔" label={dict.profile.notificationsLabel} last>
          <Toggle checked={user.notificationsEnabled} onChange={() => save({ notificationsEnabled: !user.notificationsEnabled })} />
        </SettingsRow>
      </Card>

      <Link href="/maxfiylik">
        <Card interactive className="space-y-1">
          <SettingsRow icon="🔒" label={dict.profile.securityTitle} last>
            <span className="text-sm text-primary-dark">{dict.profile.privacyPolicyLink}</span>
          </SettingsRow>
        </Card>
      </Link>

      <Card className="space-y-1">
        <SettingsRow icon="❓" label={dict.profile.helpTitle} last>
          <a href={`tel:${dict.profile.helpPhoneValue.replace(/\s/g, "")}`} className="text-right text-sm font-semibold text-primary-dark">
            {dict.profile.helpPhoneValue}
          </a>
        </SettingsRow>
      </Card>

      <div className="bg-aurora-pregnancy rounded-[28px] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl">✨</div>
          <div>
            <p className="font-semibold text-white">{dict.profile.premiumTitle}</p>
            <p className="mt-1 text-sm text-white/80">{dict.profile.premiumSubtitle}</p>
          </div>
        </div>
      </div>

      <Card className="space-y-1">
        <button
          className="-mx-2 w-[calc(100%+16px)] rounded-2xl px-2 text-left transition hover:bg-surface-muted active:scale-[0.99]"
          onClick={() => flash(dict.profile.rateAppComingSoon)}
        >
          <SettingsRow icon="⭐" label={dict.profile.rateAppButton} />
        </button>
        <button
          className="-mx-2 w-[calc(100%+16px)] rounded-2xl px-2 text-left transition hover:bg-surface-muted active:scale-[0.99]"
          onClick={shareApp}
        >
          <SettingsRow icon="📱" label={dict.profile.shareAppButton} last />
        </button>
      </Card>

      <Button variant="secondary" className="w-full" onClick={exportData} disabled={exporting}>
        {dict.profile.exportButton}
      </Button>

      {(saving || savedFlash || actionFlash) && (
        <p className="text-center text-sm text-text-muted">
          {actionFlash ?? (savedFlash ? dict.profile.savedMessage : dict.common.loading)}
        </p>
      )}
    </div>
  );
}

function SettingsRow({
  icon,
  label,
  children,
  last,
}: {
  /** Lucide komponenti (aniq mos emoji topilmagan holatlar uchun) yoki manba
   * ilovadagi ("Uzbek Women's Health Tracker" — src/App.tsx) aynan emoji. */
  icon: typeof Type | string;
  label: string;
  children?: React.ReactNode;
  last?: boolean;
}) {
  const Icon = typeof icon === "string" ? null : icon;
  return (
    <div className={clsx("flex items-center justify-between gap-3 py-2.5", !last && "border-b border-border")}>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-lg shadow-sm">
          {Icon ? <Icon sx={{ fontSize: 18 }} className="text-white" /> : (icon as string)}
        </div>
        <span className="font-medium text-text-primary">{label}</span>
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <Switch
      checked={checked}
      onChange={onChange}
      sx={{
        "& .MuiSwitch-switchBase.Mui-checked": { color: "#fff" },
        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "var(--color-primary)", opacity: 1 },
      }}
    />
  );
}
