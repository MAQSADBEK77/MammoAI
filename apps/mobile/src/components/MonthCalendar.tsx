import { Pressable, Text, View } from "react-native";
import clsx from "clsx";
import { localDateStr } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";

export type DayMarker = "period" | "predicted";

export function MonthCalendar({
  monthDate,
  markers,
  ovulationDate,
  today,
  selectedDate,
  onSelectDate,
}: {
  monthDate: Date;
  markers: Record<string, DayMarker>;
  /** Bashorat qilingan ovulyatsiya kuni — kichik nuqta bilan ko'rsatiladi (App.pdf §12). */
  ovulationDate?: string | null;
  today: string;
  /** Foydalanuvchi bosib tanlagan kun — pastdagi ma'lumot paneli shu kunga
   * qarab o'zgaradi (kalendar ostida "prognoz" App.pdf/Figma referens). */
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
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
        <Text className="font-bold text-text-primary">
          {dict.common.months[month]} {year}
        </Text>
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1.5">
            <View className="h-2 w-2 rounded-full bg-primary" />
            <Text className="text-[11px] font-medium text-text-secondary">{dict.cycle.calendarLegendPeriod}</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="h-2 w-2 rounded-full bg-secondary" />
            <Text className="text-[11px] font-medium text-text-secondary">{dict.cycle.calendarLegendOvulation}</Text>
          </View>
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
          const isToday = date === today;
          const isOvulation = date === ovulationDate;
          const isSelected = date === selectedDate;
          return (
            <View key={date} className="h-9 w-[14.28%] items-center justify-center">
              <Pressable
                onPress={() => onSelectDate?.(date)}
                className={clsx(
                  "h-8 w-8 items-center justify-center rounded-full",
                  marker === "period" && "bg-primary",
                  marker === "predicted" && "bg-primary-light",
                  isToday && !marker && !isSelected && "border-2 border-primary",
                  isSelected && "border-2 border-primary-dark"
                )}
              >
                <Text className={clsx("text-sm font-medium", marker === "period" ? "text-white" : "text-text-secondary")}>
                  {Number(date.slice(-2))}
                </Text>
                {isOvulation && <View className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-secondary" />}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
