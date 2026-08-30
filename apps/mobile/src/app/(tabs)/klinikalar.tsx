import { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Navigation as NavigationIcon, MapPin, ShieldCheck } from "lucide-react-native";
import clsx from "clsx";
import type { Clinic, ClinicSpecialty } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Button, Card, ScreenHeader, SegmentedControl, StatTile, TextField } from "@/components/ui";
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

export default function ClinicsScreen() {
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
      <ScrollView className="flex-1 px-4 pt-4" contentContainerClassName="gap-3 pb-32">
        <ScreenHeader title={dict.clinics.title} subtitle={dict.clinics.seedDataNotice} />

        <TextField
          value={search}
          onChangeText={setSearch}
          placeholder={dict.clinics.searchPlaceholder}
          icon={<Text style={{ fontSize: 16 }}>🔍</Text>}
        />

        <View className="flex-row gap-3">
          <StatTile icon={<MapPin size={16} color="#FFFFFF" />} label={dict.clinics.foundCountLabel} value={String(filtered.length)} tone="secondary" active />
          <StatTile
            icon={<ShieldCheck size={16} color="#FFFFFF" />}
            label={dict.clinics.freeScreeningBadge}
            value={String(filtered.filter((c) => c.freeScreening).length)}
            tone="accent"
            active
          />
        </View>

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
          filtered.map((clinic) => (
            <Card key={clinic.id} className="gap-2">
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1 flex-row items-start gap-2.5">
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-accent/15">
                    <Text style={{ fontSize: 16 }}>🏥</Text>
                  </View>
                  <Text className="flex-1 pt-1.5 font-semibold text-text-primary">{clinic.name}</Text>
                </View>
                {clinic.freeScreening && <Badge tone="success">{dict.clinics.freeScreeningBadge}</Badge>}
              </View>
              <View className="flex-row items-start gap-1.5">
                <Text style={{ marginTop: 1 }}>📍</Text>
                <Text className="flex-1 text-sm text-text-secondary">{clinic.address}</Text>
              </View>
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
                    <Text>📞</Text>
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
                    <NavigationIcon size={16} color="#4B5563" />
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

function FilterChip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={clsx("rounded-full border px-3 py-1.5", active ? "border-primary bg-primary" : "border-border bg-surface")}>
      <Text className={clsx("text-xs font-medium", active ? "text-white" : "text-text-secondary")}>{label}</Text>
    </Pressable>
  );
}
