"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Clinic } from "@mammoai/shared";

// Yandex/Google Maps API kaliti berilmagan — OpenStreetMap (kalitsiz, ochiq litsenziya)
// ishlatiladi. Keyin haqiqiy kalit bo'lsa, TileLayer manzilini almashtirish yetarli.
const markerIcon = L.icon({
  iconUrl: "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 26 16 26s16-15 16-26C32 7.163 24.837 0 16 0z" fill="#F43F7F"/>
      <circle cx="16" cy="16" r="6.5" fill="#FFFFFF"/>
    </svg>`),
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -38],
});

function FitBounds({ clinics }: { clinics: Clinic[] }) {
  const map = useMap();
  useEffect(() => {
    if (clinics.length === 0) return;
    const bounds = L.latLngBounds(clinics.map((c) => [c.lat, c.lng]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 13 });
  }, [clinics, map]);
  return null;
}

export function ClinicsMap({
  clinics,
  onSelect,
}: {
  clinics: Clinic[];
  onSelect?: (clinic: Clinic) => void;
}) {
  const center: [number, number] = clinics[0] ? [clinics[0].lat, clinics[0].lng] : [41.2995, 69.2401]; // Toshkent

  return (
    <div className="h-80 w-full overflow-hidden rounded-[28px] border border-border">
      <MapContainer center={center} zoom={12} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds clinics={clinics} />
        {clinics.map((c) => (
          <Marker key={c.id} position={[c.lat, c.lng]} icon={markerIcon} eventHandlers={{ click: () => onSelect?.(c) }}>
            <Popup>
              <strong>{c.name}</strong>
              <br />
              {c.address}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
