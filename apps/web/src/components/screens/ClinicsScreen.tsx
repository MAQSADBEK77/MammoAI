"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  NavigationOutlined as NavigationIcon,
  PlaceOutlined,
  VerifiedUserOutlined,
  Star,
  AccessTimeOutlined,
  PhoneOutlined,
  MyLocationOutlined,
} from "@mui/icons-material";
import type { Clinic, ClinicSpecialty } from "@mammoai/shared";
import { getClinicRating, getClinicHours, isTopClinic, haversineDistanceKm } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Card, LinkButton, LoadingSpinner, ErrorState, ScreenHeader, SegmentedControl, StatTile } from "@/components/ui";
import { Emoji } from "@/components/Emoji";
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
  // CONCERN-01: "Muammolar" ekranidan kelganda kerakli mutaxassis oldindan
  // tanlangan bo'ladi (`?specialty=gynecology`) — ayol 7 ta filtr ichidan
  // qaysi birini bosishni o'zi topib o'tirmasin. Noto'g'ri/noma'lum qiymat
  // e'tiborsiz qoldiriladi ("all"da qolinadi).
  const specialtyParam = searchParams.get("specialty");

  const [clinics, setClinics] = useState<Clinic[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [filter, setFilter] = useState<ClinicSpecialty | "all">(() =>
    SPECIALTIES.includes(specialtyParam as ClinicSpecialty) ? (specialtyParam as ClinicSpecialty) : "all"
  );
  const [search, setSearch] = useState("");

  // OVERNIGHT-18: "eng yaqinlarini topish" — brauzer geolokatsiyasi (foydalanuvchi
  // ruxsat bergandagina). Koordinata FAQAT xotirada saqlanadi (bu ekranda);
  // serverga (admin panelda ko'rinishi uchun) alohida, fire-and-forget
  // so'rov bilan yuboriladi — muvaffaqiyatsiz saqlash foydalanuvchi
  // tajribasiga (masofa bo'yicha saralashga) ta'sir qilmasligi kerak.
  const [nearestMode, setNearestMode] = useState<"off" | "locating" | "on" | "denied" | "unsupported">("off");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  function toggleNearest() {
    if (nearestMode === "on") {
      setNearestMode("off");
      return;
    }
    if (userCoords) {
      setNearestMode("on");
      return;
    }
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setNearestMode("unsupported");
      return;
    }
    setNearestMode("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setNearestMode("on");
        api.me.update({ lastLocationLat: coords.lat, lastLocationLng: coords.lng }).catch(() => {});
      },
      () => setNearestMode("denied"),
      { timeout: 10000, maximumAge: 300000 }
    );
  }

  // FIX-UX-08: so'rov muvaffaqiyatsiz bo'lganda (masalan vaqtinchalik tarmoq
  // uzilishi) .catch() yo'q edi — holat hech qachon yangilanmay, foydalanuvchi
  // abadiy "yuklanmoqda" spinnerini ko'rib qolardi.
  const load = useCallback(() => {
    setLoadError(false);
    setClinics(null);
    api.clinics.list().then(setClinics).catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    // setTimeout(0): `load()` sinxron `setState` chaqiradi (loadError/clinics
    // reset) — effekt ichida to'g'ridan-to'g'ri chaqirilsa ESLint qoidasi
    // ("Calling setState synchronously within an effect") xato beradi
    // (loyihaning boshqa joylarida ham shu naqsh ishlatiladi, masalan profil sahifasi).
    const timeout = setTimeout(load, 0);
    return () => clearTimeout(timeout);
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = (clinics ?? []).filter(
      (c) =>
        (filter === "all" || c.specialties.includes(filter)) &&
        (!q || c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q))
    );
    if (nearestMode !== "on" || !userCoords) return base;
    return [...base].sort(
      (a, b) => haversineDistanceKm(userCoords, { lat: a.lat, lng: a.lng }) - haversineDistanceKm(userCoords, { lat: b.lat, lng: b.lng })
    );
  }, [clinics, filter, search, nearestMode, userCoords]);

  if (loadError) {
    return <ErrorState message={dict.common.errorGeneric} retry={{ label: dict.common.retryButton, onClick: load }} />;
  }
  if (!clinics) return <LoadingSpinner label={dict.common.loading} />;

  async function track(clinic: Clinic, action: "view" | "call" | "directions") {
    api.referrals.log({ clinicId: clinic.id, checklistItemId, action }).catch(() => {});
  }

  return (
    <div className="space-y-4 pb-6">
      <ScreenHeader title={dict.clinics.title} subtitle={dict.clinics.seedDataNotice} />

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
          <Emoji e="🔍" size={16} />
        </span>
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

      {/* OVERNIGHT-18: yoqilganda ro'yxat/xarita ikkalasi ham eng yaqin
          klinikadan boshlab saralanadi — navbat asosidagi (o'zgarmagan)
          tartib o'rniga. */}
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={toggleNearest}
          disabled={nearestMode === "locating"}
          className={clsx(
            "tap-target flex w-fit items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition active:scale-95 disabled:opacity-60",
            nearestMode === "on"
              ? "border-primary bg-primary text-white"
              : "border-border bg-surface text-text-secondary hover:border-primary-light"
          )}
        >
          <MyLocationOutlined sx={{ fontSize: 15 }} />
          {nearestMode === "locating" ? dict.clinics.nearestLocatingLabel : dict.clinics.nearestToggleLabel}
        </button>
        {nearestMode === "denied" && <p className="text-xs text-danger">{dict.clinics.nearestDeniedLabel}</p>}
        {nearestMode === "unsupported" && <p className="text-xs text-text-muted">{dict.clinics.nearestUnsupportedLabel}</p>}
      </div>

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
          {filtered.map((clinic) => {
            const rating = getClinicRating(clinic.id);
            const isTop = isTopClinic(rating);
            const distanceKm = nearestMode === "on" && userCoords ? haversineDistanceKm(userCoords, { lat: clinic.lat, lng: clinic.lng }) : null;
            return (
              <Card key={clinic.id} className="space-y-3" onMouseEnter={() => track(clinic, "view")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5">
                    {isTop && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-light/60 px-2.5 py-1 text-xs font-bold text-primary-dark">
                        <Star sx={{ fontSize: 14 }} /> {dict.clinics.topClinicBadge}
                      </span>
                    )}
                    <p className="font-bold text-text-primary">{clinic.name}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 pt-1 text-sm font-bold text-text-primary">
                    <Star sx={{ fontSize: 16 }} className="text-warning" /> {rating.toFixed(1)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {clinic.freeScreening && <Badge tone="success">{dict.clinics.freeScreeningBadge}</Badge>}
                  {distanceKm != null && (
                    <Badge tone="primary">
                      <MyLocationOutlined sx={{ fontSize: 12 }} /> {dict.clinics.distanceKm(distanceKm)}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="flex items-center gap-1.5 text-sm text-text-secondary">
                    <PlaceOutlined sx={{ fontSize: 16 }} className="shrink-0 text-text-muted" /> {clinic.address}
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-text-secondary">
                    <AccessTimeOutlined sx={{ fontSize: 16 }} className="shrink-0 text-text-muted" /> {getClinicHours(clinic.id)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
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
                    <PhoneOutlined sx={{ fontSize: 18 }} /> {dict.clinics.callButton}
                  </LinkButton>
                  <LinkButton
                    href={`https://www.openstreetmap.org/directions?to=${clinic.lat}%2C${clinic.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => track(clinic, "directions")}
                    variant="primary"
                    className="flex-1"
                  >
                    <NavigationIcon sx={{ fontSize: 18 }} /> {dict.clinics.directionsButton}
                  </LinkButton>
                </div>
              </Card>
            );
          })}
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
