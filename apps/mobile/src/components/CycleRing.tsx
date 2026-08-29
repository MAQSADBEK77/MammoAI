// Lunari uslubidagi doiraviy sikl-halqasi — web versiyasi bilan bir xil mantiq
// (apps/web/src/components/CycleRing.tsx).
import { View, Text } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

const SIZE = 200;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CycleRing({
  dayInCycle,
  cycleLength,
  label,
  sublabel,
}: {
  dayInCycle: number;
  cycleLength: number;
  label: string;
  sublabel: string;
}) {
  const progress = Math.min(1, Math.max(0, dayInCycle / cycleLength));
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <View className="self-center" style={{ width: SIZE, height: SIZE }}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Defs>
          <LinearGradient id="cycleRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#F43F7F" />
            <Stop offset="100%" stopColor="#D62A63" />
          </LinearGradient>
        </Defs>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#FFB3CB" strokeWidth={STROKE} />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="url(#cycleRingGradient)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={offset}
        />
      </Svg>
      <View className="absolute inset-0 items-center justify-center">
        <Text className="text-4xl font-extrabold text-text-primary">{dayInCycle}</Text>
        <Text className="text-sm font-medium text-text-secondary">{label}</Text>
        <Text className="mt-2 max-w-[140px] text-center text-xs text-text-muted">{sublabel}</Text>
      </View>
    </View>
  );
}
