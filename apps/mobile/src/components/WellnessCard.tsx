// Web'dagi WellnessCard.tsx bilan bir xil naqsh — izoh o'sha yerda.
import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { WATER_GLASS_ML, waterProgressPercent } from "@mammoai/shared";
import type { WellnessResponse } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Button, Card, ProgressBar, TextField } from "@/components/ui";
import { Emoji } from "@/components/Emoji";

export function WellnessCard() {
  const { dict } = useI18n();
  const [data, setData] = useState<WellnessResponse | null>(null);
  const [savingWater, setSavingWater] = useState(false);
  const [calorieInput, setCalorieInput] = useState("");
  const [savingCalories, setSavingCalories] = useState(false);

  useEffect(() => {
    api.wellness.get().then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  const percent = waterProgressPercent(data.today.waterMl);

  async function addGlass() {
    setSavingWater(true);
    try {
      setData(await api.wellness.addWater(WATER_GLASS_ML));
    } finally {
      setSavingWater(false);
    }
  }

  async function addCalories() {
    const kcal = Number(calorieInput);
    if (!Number.isFinite(kcal) || kcal <= 0) return;
    setSavingCalories(true);
    try {
      setData(await api.wellness.addCalories(Math.round(kcal)));
      setCalorieInput("");
    } finally {
      setSavingCalories(false);
    }
  }

  return (
    <Card className="animate-fade-in-up gap-4">
      <Text className="text-base font-bold text-text-primary">{dict.wellness.cardTitle}</Text>

      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Emoji e="💧" size={18} />
            <Text className="text-sm font-semibold text-text-primary">{dict.wellness.waterLabel}</Text>
          </View>
          <Text className="text-sm text-text-secondary">{dict.wellness.waterProgress(data.today.waterMl, data.waterTargetMl)}</Text>
        </View>
        <ProgressBar value={percent} />
        <Button variant="secondary" disabled={savingWater} onPress={addGlass}>
          {dict.wellness.addGlassButton}
        </Button>
      </View>

      <View className="gap-2 border-t border-border pt-3">
        <View className="flex-row items-center gap-1.5">
          <Emoji e="🍽️" size={18} />
          <Text className="text-sm font-semibold text-text-primary">{dict.wellness.caloriesLabel}</Text>
          <Text className="ml-auto text-sm text-text-secondary">{dict.wellness.caloriesUnit(data.today.calories)}</Text>
        </View>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <TextField value={calorieInput} onChangeText={setCalorieInput} placeholder={dict.wellness.addCaloriesPlaceholder} keyboardType="numeric" />
          </View>
          <Button variant="secondary" disabled={savingCalories} onPress={addCalories}>
            {dict.wellness.addCaloriesButton}
          </Button>
        </View>
      </View>
    </Card>
  );
}
