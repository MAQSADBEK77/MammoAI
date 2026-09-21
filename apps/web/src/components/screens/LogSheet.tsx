"use client";

import clsx from "clsx";
import { Close, CheckOutlined } from "@mui/icons-material";
import type { FlowLevel, Mood, Symptom } from "@mammoai/shared";
import { FLOW_EMOJI, MOOD_EMOJI, SYMPTOM_EMOJI, localDateStr } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { Portal } from "@/components/Portal";
import { Emoji } from "@/components/Emoji";

/**
 * TODAY-03 — kunlik yozuv ekrani (referens dizayn): to'liq ekranli varaq,
 * tepada sana chizig'i, so'ng oq kartalarga bo'lingan bo'limlar (Oqim →
 * Simptomlar → Kayfiyat → Ilg'or), pastda doimiy "Saqlash" tugmasi.
 *
 * Ma'lumot/saqlash mantig'i BU YERDA EMAS — hammasi CycleScreen'da qoladi
 * (bir xil `openLogging`/`saveLog` oqimi "classic" ko'rinish uchun ham
 * ishlaydi). Bu komponent faqat ko'rinish + tanlovni yuqoriga uzatish.
 */

interface LogSheetProps {
  date: string;
  today: string;
  onChangeDate: (date: string) => void;

  flowLevels: FlowLevel[];
  flow: FlowLevel | null;
  onToggleFlow: (f: FlowLevel) => void;

  symptomList: Symptom[];
  symptoms: Symptom[];
  onToggleSymptom: (s: Symptom) => void;

  moods: Mood[];
  mood: Mood | null;
  onToggleMood: (m: Mood) => void;

  /** "Ilg'or" bo'lim (bazal harorat) — mazmuni CycleScreen'dan keladi. */
  advanced: React.ReactNode;

  onClose: () => void;
  onSave: () => void;
  onDelete: (() => void) | null;
  saving: boolean;
  deleting: boolean;
}

export function LogSheet({
  date,
  today,
  onChangeDate,
  flowLevels,
  flow,
  onToggleFlow,
  symptomList,
  symptoms,
  onToggleSymptom,
  moods,
  mood,
  onToggleMood,
  advanced,
  onClose,
  onSave,
  onDelete,
  saving,
  deleting,
}: LogSheetProps) {
  const { dict } = useI18n();

  // Sana chizig'i — tanlangan kunni markazga oladi, kelajakdagi kunlar
  // bosilmaydi (hali bo'lmagan kun uchun simptom qayd etish mantiqsiz).
  const strip = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + (i - 3));
    return { value: localDateStr(d), dateObj: d };
  });

  return (
<Portal>
          <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Sarlavha + sana chizig'i — skroll paytida ham ko'rinib turadi. */}
      <div className="shrink-0 bg-surface shadow-sm" style={{ paddingTop: "var(--tg-safe-area-top)" }}>
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            aria-label={dict.common.close}
            className="tap-target flex h-10 w-10 items-center justify-center rounded-full text-text-primary active:scale-95"
          >
            <Close sx={{ fontSize: 24 }} />
          </button>
          <p className="text-base font-bold text-text-primary">{dict.cycle.dailyCheckinTitle}</p>
          <span className="h-10 w-10" />
        </div>

        <div className="mx-auto grid w-full max-w-md grid-cols-7 gap-1 px-3 pb-3">
          {strip.map(({ value, dateObj }) => {
            const isSelected = value === date;
            const isFuture = value > today;
            return (
              <button
                key={value}
                type="button"
                disabled={isFuture}
                onClick={() => onChangeDate(value)}
                className="tap-target flex flex-col items-center gap-1 disabled:opacity-30"
              >
                <span className="text-[10px] font-bold uppercase text-text-muted">
                  {value === today ? dict.cycle.heroTodayLabel : dict.common.weekdaysShort[dateObj.getDay()]}
                </span>
                <span
                  className={clsx(
                    "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold",
                    isSelected ? "bg-primary text-white" : "text-text-primary"
                  )}
                >
                  {dateObj.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-md space-y-3 p-4">
          <Section title={dict.cycle.flowLabel}>
            {flowLevels.map((f) => (
              <IconCell
                key={f}
                emoji={FLOW_EMOJI[f]}
                label={dict.cycle.flowLevels[f]}
                active={flow === f}
                onClick={() => onToggleFlow(f)}
              />
            ))}
          </Section>

          <Section title={dict.cycle.symptomsLabel}>
            {symptomList.map((s) => (
              <IconCell
                key={s}
                emoji={SYMPTOM_EMOJI[s]}
                label={dict.cycle.symptoms[s]}
                active={symptoms.includes(s)}
                onClick={() => onToggleSymptom(s)}
              />
            ))}
          </Section>

          <Section title={dict.cycle.moodLabel}>
            {moods.map((m) => (
              <IconCell
                key={m}
                emoji={MOOD_EMOJI[m]}
                label={dict.cycle.moods[m]}
                active={mood === m}
                onClick={() => onToggleMood(m)}
              />
            ))}
          </Section>

          <div className="rounded-3xl bg-surface p-4 shadow-sm">{advanced}</div>

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="tap-target w-full rounded-full py-3 text-sm font-semibold text-danger disabled:opacity-60"
            >
              {dict.cycle.deleteLogButton}
            </button>
          )}
        </div>
      </div>

      {/* Doimiy saqlash tugmasi — uzun ro'yxatda pastga scroll qilish shart
          bo'lmasligi uchun (referensdagi kabi). */}
      <div
        className="shrink-0 bg-surface px-4 pt-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + var(--tg-safe-area-bottom) + 12px)" }}
      >
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="tap-target mx-auto flex w-full max-w-md items-center justify-center rounded-full bg-primary py-4 text-lg font-bold text-white active:scale-[0.99] disabled:opacity-60"
        >
          {dict.common.save}
        </button>
      </div>
    </div>
    </Portal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-surface p-4 shadow-sm">
      <p className="mb-3 text-base font-bold text-text-primary">{title}</p>
      <div className="grid grid-cols-4 gap-x-1 gap-y-4 sm:gap-x-2">{children}</div>
    </div>
  );
}

/** Referensdagi element: dumaloq ikonka, ostida yozuv; tanlansa gardish
 * brend rangiga o'tadi va kichik belgi chiqadi. */
function IconCell({
  emoji,
  label,
  active,
  onClick,
}: {
  emoji: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="tap-target flex flex-col items-center gap-1.5 active:scale-95">
      <span
        className={clsx(
          "relative flex h-12 w-12 items-center justify-center rounded-full border-2 transition sm:h-14 sm:w-14",
          active ? "border-primary bg-primary-light/40" : "border-border bg-surface"
        )}
      >
        <Emoji e={emoji} size={26} />
        {active && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
            <CheckOutlined sx={{ fontSize: 13 }} className="text-white" />
          </span>
        )}
      </span>
      <span className="text-center text-[11px] font-semibold leading-tight text-text-secondary">{label}</span>
    </button>
  );
}
