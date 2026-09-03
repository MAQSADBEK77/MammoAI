"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { NavigationOutlined as NavigationIcon, PlaceOutlined, VerifiedUserOutlined } from "@mui/icons-material";
import type { Clinic, ClinicSpecialty } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Card, LinkButton, LoadingSpinner, ScreenHeader, SegmentedControl, StatTile } from "@/components/ui";
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

/** "Asosiy" (/asosiy) sahifasining Klinikalar bo'limi — ilgari alohida
 * /klinikalar sahifasi edi, endi Asosiy ichiga bo'lim sifatida qo'shildi. */
export function ClinicsScreen() {
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

  if (!clinics) return <LoadingSpinner label={dict.common.loading} />;

  async function track(clinic: Clinic, action: "view" | "call" | "directions") {
    api.referrals.log({ clinicId: clinic.id, checklistItemId, action }).catch(() => {});
  }

  return (
    <div className="space-y-4 pb-6">
      <ScreenHeader title={dict.clinics.title} subtitle={dict.clinics.seedDataNotice} />

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={dict.clinics.searchPlaceholder}
          className="tap-target w-full rounded-2xl border border-border bg-surface pl-10 pr-4 text-sm text-text-primary outline-none focus:border-primary"
        />
      </div>

      <div className="animate-fade-in-up grid grid-cols-2 gap-3">
        <StatTile icon={<PlaceOutlined sx={{ fontSize: 16 }} />} label={dict.clinics.foundCountLabel} value={String(filtered.length)} tone="secondary" active />
        <StatTile
          icon={<VerifiedUserOutlined sx={{ fontSize: 16 }} />}
          label={dict.clinics.freeScreeningBadge}
          value={String(filtered.filter((c) => c.freeScreening).length)}
          tone="accent"
          active
        />
      </div>

      <SegmentedControl
        value={view}
        onChange={setView}
        options={[
          { value: "list", label: dict.clinics.listView },
          { value: "map", label: dict.clinics.mapView },
        ]}
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
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
                  <NavigationIcon sx={{ fontSize: 16 }} /> {dict.clinics.directionsButton}
                </LinkButton>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95",
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-surface text-text-secondary hover:border-primary-light hover:bg-primary-light/20 hover:text-primary-dark"
      )}
    >
      {label}
    </button>
  );
}
