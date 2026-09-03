import { Pressable, Text, View } from "react-native";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { localDateStr, type CyclePhase } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";

export type DayMarker = "period" | "predicted";

// Har bir tsikl fazasi uchun fon rangi — PhaseCard bilan bir xil palitra
// (menstrual=primary, follicular=secondary, ovulation=accent, luteal=success),
// shunda kalendar pastidagi faza kartasi bilan ranglar mos keladi.
const PHASE_BG: Record<Exclude<CyclePhase, "menstrual">, string> = {
  follicular: "bg-secondary/15",
  ovulation: "bg-accent/15",
  luteal: "bg-success/15",
};

export function MonthCalendar({
  monthDate,
  markers,
  phaseMarkers,
  ovulationDate,
  today,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: {
  monthDate: Date;
  markers: Record<string, DayMarker>;
  /** Har bir kun uchun hisoblangan tsikl fazasi — istalgan oy uchun (o'tgan/
   * kelgusi) ishlaydi, chunki oxirgi hayz sanasidan davriy formula bilan
   * hisoblanadi. */
  phaseMarkers?: Record<string, CyclePhase>;
  /** Bashorat qilingan ovulyatsiya kuni — kichik nuqta bilan ko'rsatiladi (App.pdf §12). */
  ovulationDate?: string | null;
  today: string;
  /** Foydalanuvchi bosib tanlagan kun — pastdagi ma'lumot paneli shu kunga
   * qarab o'zgaradi (kalendar ostida "prognoz" App.pdf/Figma referens). */
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
  /** Oldingi/keyingi oyga o'tish — berilmasa tugma ko'rsatilmaydi. */
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
}) {
  const { dict } = useI18n();
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (string | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => localDateStr(new Date(year, month, i + 1))),
  ];

  return (
    <View>
      <View className="mb-3 flex-row items-center justify-between">
        <Pressable onPress={onPrevMonth} disabled={!onPrevMonth} className="h-8 w-8 items-center justify-center rounded-full active:bg-surface-muted">
          {onPrevMonth && <ChevronLeft size={18} color="#4B5563" />}
        </Pressable>
        <Text className="font-bold text-text-primary">
          {dict.common.months[month]} {year}
        </Text>
        <Pressable onPress={onNextMonth} disabled={!onNextMonth} className="h-8 w-8 items-center justify-center rounded-full active:bg-surface-muted">
          {onNextMonth && <ChevronRight size={18} color="#4B5563" />}
        </Pressable>
      </View>

      <View className="mb-3 flex-row flex-wrap gap-x-3 gap-y-1.5">
        <View className="flex-row items-center gap-1.5">
          <View className="h-2 w-2 rounded-full bg-primary" />
          <Text className="text-[11px] font-medium text-text-secondary">{dict.cycle.calendarLegendPeriod}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-2 w-2 rounded-full bg-secondary" />
          <Text className="text-[11px] font-medium text-text-secondary">{dict.cycle.calendarLegendFollicular}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-2 w-2 rounded-full bg-accent" />
          <Text className="text-[11px] font-medium text-text-secondary">{dict.cycle.calendarLegendOvulation}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-2 w-2 rounded-full bg-success" />
          <Text className="text-[11px] font-medium text-text-secondary">{dict.cycle.calendarLegendLuteal}</Text>
        </View>
      </View>

      <View className="mb-2 flex-row justify-between">
        {dict.common.weekdaysShort.map((w, i) => (
          <Text key={i} className="w-9 text-center text-xs font-semibold text-text-muted">
            {w}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {cells.map((date, i) => {
          if (!date) return <View key={i} className="h-9 w-[14.28%]" />;
          const marker = markers[date];
          const phase = phaseMarkers?.[date];
          const isToday = date === today;
          const isOvulation = date === ovulationDate;
          const isSelected = date === selectedDate;
          const phaseBg = !marker && phase && phase !== "menstrual" ? PHASE_BG[phase] : null;
          return (
            <View key={date} className="h-9 w-[14.28%] items-center justify-center">
              <Pressable
                onPress={() => onSelectDate?.(date)}
                className={clsx(
                  "h-8 w-8 items-center justify-center rounded-full",
                  marker === "period" && "bg-primary",
                  marker === "predicted" && "bg-primary-light",
                  !marker && !phaseBg && phase === "menstrual" && "bg-primary-light",
                  !marker && phaseBg,
                  isToday && !marker && !isSelected && "border-2 border-primary",
                  isSelected && "border-2 border-primary-dark"
                )}
              >
                <Text className={clsx("text-sm font-medium", marker === "period" ? "text-white" : "text-text-secondary")}>
                  {Number(date.slice(-2))}
                </Text>
                {isOvulation && <View className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-accent" />}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
