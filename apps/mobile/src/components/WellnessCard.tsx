// Web'dagi WellnessCard.tsx bilan bir xil naqsh — izoh o'sha yerda.
import { useEffect, useState } from "react";
import { View, Text, Alert } from "react-native";
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

  // FIX3-27: ikkalasi ham TO'LIQ WellnessResponse'ni qaytaradi (suv VA
  // kaloriya birga) — parallel bosilsa, kechroq kelgan javob avvalgisini
  // to'liq almashtirib, bittasini vaqtincha "yo'qolgan" qilib ko'rsatishi
  // mumkin edi. Ikkalasini bir-biriga qarshi disable qilib ketma-ket
  // yuborishga majburlaymiz.
  async function addGlass() {
    if (savingWater || savingCalories) return;
    setSavingWater(true);
    try {
      setData(await api.wellness.addWater(WATER_GLASS_ML));
    } catch {
      // FIX3-26: xato bo'lsa hech qanday signal yo'q edi — foydalanuvchi
      // suv qo'shdim deb o'ylardi, aslida saqlanmagan.
      Alert.alert(dict.common.errorGeneric);
    } finally {
      setSavingWater(false);
    }
  }

  async function addCalories() {
    if (savingCalories || savingWater) return;
    const kcal = Number(calorieInput);
    if (!Number.isFinite(kcal) || kcal <= 0) return;
    setSavingCalories(true);
    try {
      setData(await api.wellness.addCalories(Math.round(kcal)));
      setCalorieInput("");
    } catch {
      Alert.alert(dict.common.errorGeneric);
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
        <Button variant="secondary" disabled={savingWater || savingCalories} onPress={addGlass}>
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
          <Button variant="secondary" disabled={savingCalories || savingWater} onPress={addCalories}>
            {dict.wellness.addCaloriesButton}
          </Button>
        </View>
      </View>
    </Card>
  );
}
