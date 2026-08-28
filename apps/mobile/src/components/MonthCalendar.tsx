import { Pressable, Text, View } from "react-native";
import clsx from "clsx";

export type DayMarker = "period" | "predicted" | "fertile";

const WEEKDAY_LABELS_UZ = ["D", "S", "S", "Ch", "P", "J", "Sh"];

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function MonthCalendar({
  monthDate,
  markers,
  today,
  onSelectDate,
}: {
  monthDate: Date;
  markers: Record<string, DayMarker>;
  today: string;
  onSelectDate?: (date: string) => void;
}) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (string | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toDateStr(new Date(year, month, i + 1))),
  ];

  return (
    <View>
      <View className="mb-2 flex-row justify-between">
        {WEEKDAY_LABELS_UZ.map((w, i) => (
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
          return (
            <View key={date} className="h-9 w-[14.28%] items-center justify-center">
              <Pressable
                onPress={() => onSelectDate?.(date)}
                className={clsx(
                  "h-8 w-8 items-center justify-center rounded-full",
                  marker === "period" && "bg-primary",
                  marker === "predicted" && "bg-primary-light",
                  marker === "fertile" && "bg-accent-light",
                  isToday && !marker && "border-2 border-primary"
                )}
              >
                <Text className={clsx("text-sm font-medium", marker === "period" ? "text-white" : "text-text-secondary")}>
                  {Number(date.slice(-2))}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
