import { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text, Pressable, Linking } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import clsx from "clsx";
import type { Clinic, ClinicSpecialty } from "@mammoai/shared";
import { getClinicRating, getClinicHours, isTopClinic } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Button, Card, LoadingSpinner, ScreenHeader, SegmentedControl, StatTile, TextField } from "@/components/ui";
import { Emoji } from "@/components/Emoji";
import { ClinicsMap } from "@/components/ClinicsMap";

const SPECIALTIES: ClinicSpecialty[] = [
  "gynecology",
  "oncology",
  "radiology",
  "general",
  "endocrinology",
  "reproductology",
  "laparoscopy",
];

/** "Asosiy" (asosiy.tsx) tabining Klinikalar bo'limi — ilgari alohida
 * /klinikalar ekrani edi, endi Asosiy ichiga bo'lim sifatida qo'shildi.
 * O'zining SafeAreaView/ScrollView'i yo'q. */
export function ClinicsScreen() {
  const { dict } = useI18n();
  const { checklistItemId } = useLocalSearchParams<{ checklistItemId?: string }>();

  const [clinics, setClinics] = useState<Clinic[] | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const [filter, setFilter] = useState<ClinicSpecialty | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.clinics.list().then(setClinics);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (clinics ?? []).filter(
      (c) =>
        (filter === "all" || c.specialties.includes(filter)) &&
        (!q || c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q))
    );
  }, [clinics, filter, search]);

  if (!clinics) {
    return <LoadingSpinner label={dict.common.loading} />;
  }

  function track(clinic: Clinic, action: "view" | "call" | "directions") {
    api.referrals.log({ clinicId: clinic.id, checklistItemId: checklistItemId ?? null, action }).catch(() => {});
  }

  return (
    <View className="gap-4">
      <ScreenHeader title={dict.clinics.title} subtitle={dict.clinics.seedDataNotice} />

      <TextField
        value={search}
        onChangeText={setSearch}
        placeholder={dict.clinics.searchPlaceholder}
        icon={<Emoji e="🔍" size={16} />}
      />

      <Animated.View entering={FadeInUp.duration(450)} className="flex-row gap-3">
        <StatTile icon={<MaterialCommunityIcons name="map-marker-outline" size={16} color="#FFFFFF" />} label={dict.clinics.foundCountLabel} value={String(filtered.length)} tone="secondary" active />
        <StatTile
          icon={<MaterialCommunityIcons name="shield-check-outline" size={16} color="#FFFFFF" />}
          label={dict.clinics.freeScreeningBadge}
          value={String(filtered.filter((c) => c.freeScreening).length)}
          tone="accent"
          active
        />
      </Animated.View>

      <SegmentedControl
        value={view}
        onChange={setView}
        options={[
          { value: "list", label: dict.clinics.listView },
          { value: "map", label: dict.clinics.mapView },
        ]}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-4">
        <FilterChip active={filter === "all"} label={dict.clinics.filterAll} onPress={() => setFilter("all")} />
        {SPECIALTIES.map((s) => (
          <FilterChip key={s} active={filter === s} label={dict.clinics.specialties[s]} onPress={() => setFilter(s)} />
        ))}
      </ScrollView>

      {view === "map" ? (
        <ClinicsMap clinics={filtered} />
      ) : (
        filtered.map((clinic) => {
          const rating = getClinicRating(clinic.id);
          const isTop = isTopClinic(rating);
          return (
            <Card key={clinic.id} className="gap-3">
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1 gap-1.5">
                  {isTop && (
                    <View className="flex-row items-center gap-1 self-start rounded-full bg-primary-light/60 px-2.5 py-1">
                      <MaterialCommunityIcons name="star" size={13} color="#D62A63" />
                      <Text className="text-xs font-bold text-primary-dark">{dict.clinics.topClinicBadge}</Text>
                    </View>
                  )}
                  <Text className="font-bold text-text-primary">{clinic.name}</Text>
                </View>
                <View className="flex-row items-center gap-1 pt-1">
                  <MaterialCommunityIcons name="star" size={16} color="#E7A83F" />
                  <Text className="text-sm font-bold text-text-primary">{rating.toFixed(1)}</Text>
                </View>
              </View>

              {clinic.freeScreening && <Badge tone="success">{dict.clinics.freeScreeningBadge}</Badge>}

              <View className="gap-1">
                <View className="flex-row items-center gap-1.5">
                  <MaterialCommunityIcons name="map-marker-outline" size={16} color="#9CA3AF" />
                  <Text className="flex-1 text-sm text-text-secondary">{clinic.address}</Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <MaterialCommunityIcons name="clock-outline" size={16} color="#9CA3AF" />
                  <Text className="flex-1 text-sm text-text-secondary">{getClinicHours(clinic.id)}</Text>
                </View>
              </View>

              <View className="flex-row flex-wrap gap-1.5">
                {clinic.specialties.map((s) => (
                  <Badge key={s}>{dict.clinics.specialties[s]}</Badge>
                ))}
              </View>

              <View className="flex-row gap-2 pt-1">
                <View className="flex-1">
                  <Button
                    variant="secondary"
                    onPress={() => {
                      track(clinic, "call");
                      Linking.openURL(`tel:${clinic.phone}`);
                    }}
                  >
                    <MaterialCommunityIcons name="phone-outline" size={16} color="#1F2937" />
                    <Text className="text-sm font-semibold text-text-primary">{dict.clinics.callButton}</Text>
                  </Button>
                </View>
                <View className="flex-1">
                  <Button
                    variant="primary"
                    onPress={() => {
                      track(clinic, "directions");
                      Linking.openURL(`https://www.openstreetmap.org/directions?to=${clinic.lat}%2C${clinic.lng}`);
                    }}
                  >
                    <MaterialCommunityIcons name="navigation-outline" size={16} color="#FFFFFF" />
                    <Text className="text-sm font-semibold text-white">{dict.clinics.directionsButton}</Text>
                  </Button>
                </View>
              </View>
            </Card>
          );
        })
      )}
    </View>
  );
}

function FilterChip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={clsx("rounded-full border px-3 py-1.5 active:scale-95", active ? "border-primary bg-primary" : "border-border bg-surface")}
    >
      <Text className={clsx("text-xs font-medium", active ? "text-white" : "text-text-secondary")}>{label}</Text>
    </Pressable>
  );
}
