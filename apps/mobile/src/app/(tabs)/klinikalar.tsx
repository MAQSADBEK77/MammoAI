import { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Phone, Navigation as NavigationIcon, List, Map as MapIcon } from "lucide-react-native";
import clsx from "clsx";
import type { Clinic, ClinicSpecialty } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Button, Card, ScreenHeader } from "@/components/ui";
import { ClinicsMap } from "@/components/ClinicsMap";

const SPECIALTIES: ClinicSpecialty[] = ["gynecology", "oncology", "radiology", "general"];

export default function ClinicsScreen() {
  const { dict } = useI18n();
  const { checklistItemId } = useLocalSearchParams<{ checklistItemId?: string }>();

  const [clinics, setClinics] = useState<Clinic[] | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const [filter, setFilter] = useState<ClinicSpecialty | "all">("all");

  useEffect(() => {
    api.clinics.list().then(setClinics);
  }, []);

  const filtered = useMemo(
    () => (clinics ?? []).filter((c) => filter === "all" || c.specialties.includes(filter)),
    [clinics, filter]
  );

  if (!clinics) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-text-secondary">{dict.common.loading}</Text>
      </SafeAreaView>
    );
  }

  function track(clinic: Clinic, action: "view" | "call" | "directions") {
    api.referrals.log({ clinicId: clinic.id, checklistItemId: checklistItemId ?? null, action }).catch(() => {});
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="gap-3 pb-8">
        <ScreenHeader title={dict.clinics.title} />
        <Text className="-mt-3 text-xs text-text-muted">{dict.clinics.seedDataNotice}</Text>

        <View className="flex-row gap-2">
          <ViewToggle active={view === "list"} Icon={List} label={dict.clinics.listView} onPress={() => setView("list")} />
          <ViewToggle active={view === "map"} Icon={MapIcon} label={dict.clinics.mapView} onPress={() => setView("map")} />
        </View>

        <View className="flex-row flex-wrap gap-2">
          <FilterChip active={filter === "all"} label={dict.clinics.filterAll} onPress={() => setFilter("all")} />
          {SPECIALTIES.map((s) => (
            <FilterChip key={s} active={filter === s} label={dict.clinics.specialties[s]} onPress={() => setFilter(s)} />
          ))}
        </View>

        {view === "map" ? (
          <ClinicsMap clinics={filtered} />
        ) : (
          filtered.map((clinic) => (
            <Card key={clinic.id} className="gap-2">
              <View className="flex-row items-start justify-between gap-2">
                <Text className="flex-1 font-semibold text-text-primary">{clinic.name}</Text>
                {clinic.freeScreening && <Badge tone="success">{dict.clinics.freeScreeningBadge}</Badge>}
              </View>
              <Text className="text-sm text-text-secondary">{clinic.address}</Text>
              <View className="flex-row flex-wrap gap-1">
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
                    <Phone size={16} color="#241B26" />
                    <Text className="text-sm font-semibold text-text-primary">{dict.clinics.callButton}</Text>
                  </Button>
                </View>
                <View className="flex-1">
                  <Button
                    variant="ghost"
                    onPress={() => {
                      track(clinic, "directions");
                      Linking.openURL(`https://www.openstreetmap.org/directions?to=${clinic.lat}%2C${clinic.lng}`);
                    }}
                  >
                    <NavigationIcon size={16} color="#6E6470" />
                    <Text className="text-sm font-semibold text-text-secondary">{dict.clinics.directionsButton}</Text>
                  </Button>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ViewToggle({ active, Icon, label, onPress }: { active: boolean; Icon: typeof List; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={clsx(
        "min-h-[44px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl border",
        active ? "border-primary bg-primary-light" : "border-border bg-surface"
      )}
    >
      <Icon size={16} color={active ? "#C82F5C" : "#6E6470"} />
      <Text className={clsx("text-sm font-semibold", active ? "text-primary-dark" : "text-text-secondary")}>{label}</Text>
    </Pressable>
  );
}

function FilterChip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={clsx("rounded-full border px-3 py-1.5", active ? "border-primary bg-primary" : "border-border bg-surface")}>
      <Text className={clsx("text-xs font-medium", active ? "text-white" : "text-text-secondary")}>{label}</Text>
    </Pressable>
  );
}
