"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Navigation as NavigationIcon, List, Map as MapIcon } from "lucide-react";
import type { Clinic, ClinicSpecialty } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Card, LinkButton, ScreenHeader } from "@/components/ui";
import clsx from "clsx";

// Leaflet DOM/window'ga tayanadi — faqat client'da render qilinadi.
const ClinicsMap = dynamic(() => import("@/components/ClinicsMap").then((m) => m.ClinicsMap), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse rounded-2xl bg-surface-muted" />,
});

const SPECIALTIES: ClinicSpecialty[] = [
  "gynecology",
  "oncology",
  "radiology",
  "general",
  "endocrinology",
  "reproductology",
  "laparoscopy",
];

export default function ClinicsPage() {
  const { dict } = useI18n();
  const searchParams = useSearchParams();
  const checklistItemId = searchParams.get("checklistItemId");

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

  if (!clinics) return <p className="text-text-secondary">{dict.common.loading}</p>;

  async function track(clinic: Clinic, action: "view" | "call" | "directions") {
    api.referrals.log({ clinicId: clinic.id, checklistItemId, action }).catch(() => {});
  }

  return (
    <div className="space-y-4 pb-6">
      <ScreenHeader title={dict.clinics.title} />
      <p className="-mt-3 text-xs text-text-muted">{dict.clinics.seedDataNotice}</p>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={dict.clinics.searchPlaceholder}
          className="tap-target w-full rounded-2xl border border-border bg-surface pl-10 pr-4 text-sm text-text-primary outline-none focus:border-primary"
        />
      </div>

      <div className="flex gap-2">
        <ViewToggle active={view === "list"} icon={List} label={dict.clinics.listView} onClick={() => setView("list")} />
        <ViewToggle active={view === "map"} icon={MapIcon} label={dict.clinics.mapView} onClick={() => setView("map")} />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={filter === "all"} label={dict.clinics.filterAll} onClick={() => setFilter("all")} />
        {SPECIALTIES.map((s) => (
          <FilterChip key={s} active={filter === s} label={dict.clinics.specialties[s]} onClick={() => setFilter(s)} />
        ))}
      </div>

      {view === "map" ? (
        <ClinicsMap clinics={filtered} onSelect={(c) => track(c, "view")} />
      ) : (
        <div className="space-y-3">
          {filtered.map((clinic) => (
            <Card key={clinic.id} className="space-y-2" onMouseEnter={() => track(clinic, "view")}>
              <div className="flex items-start justify-between gap-2">
                <p className="flex items-start gap-2.5 font-semibold text-text-primary">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-base">🏥</span>
                  <span className="pt-1.5">{clinic.name}</span>
                </p>
                {clinic.freeScreening && <Badge tone="success">{dict.clinics.freeScreeningBadge}</Badge>}
              </div>
              <p className="flex items-start gap-1.5 text-sm text-text-secondary">
                <span className="mt-0.5 shrink-0">📍</span> {clinic.address}
              </p>
              <div className="flex flex-wrap gap-1">
                {clinic.specialties.map((s) => (
                  <Badge key={s}>{dict.clinics.specialties[s]}</Badge>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <LinkButton
                  href={`tel:${clinic.phone}`}
                  onClick={() => track(clinic, "call")}
                  variant="secondary"
                  className="flex-1"
                >
                  📞 {dict.clinics.callButton}
                </LinkButton>
                <LinkButton
                  href={`https://www.openstreetmap.org/directions?to=${clinic.lat}%2C${clinic.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => track(clinic, "directions")}
                  variant="ghost"
                  className="flex-1"
                >
                  <NavigationIcon size={16} /> {dict.clinics.directionsButton}
                </LinkButton>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ViewToggle({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof List;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "tap-target flex flex-1 items-center justify-center gap-2 rounded-2xl border text-sm font-semibold",
        active ? "border-primary bg-primary-light text-primary-dark" : "border-border bg-surface text-text-secondary"
      )}
    >
      <Icon size={16} /> {label}
    </button>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-full border px-3 py-1.5 text-xs font-medium",
        active ? "border-primary bg-primary text-white" : "border-border bg-surface text-text-secondary"
      )}
    >
      {label}
    </button>
  );
}
