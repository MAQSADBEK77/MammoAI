import { WebView } from "react-native-webview";
import type { Clinic } from "@mammoai/shared";

// Yandex/Google Maps API kaliti berilmagan — WebView ichida keyless OpenStreetMap +
// Leaflet (CDN'dan) ko'rsatiladi. Web versiyasidagi bilan bir xil mantiq
// (apps/web/src/components/ClinicsMap.tsx), faqat native WebView orqali.
function buildHtml(clinics: Clinic[]): string {
  const points = clinics.map((c) => ({ lat: c.lat, lng: c.lng, name: c.name, address: c.address }));
  const center = points[0] ?? { lat: 41.2995, lng: 69.2401 };

  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>html,body,#map{height:100%;margin:0;padding:0;}</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  const map = L.map('map').setView([${center.lat}, ${center.lng}], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  const points = ${JSON.stringify(points)};
  const markers = points.map(p => L.marker([p.lat, p.lng]).addTo(map).bindPopup('<b>' + p.name + '</b><br>' + p.address));
  if (markers.length) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.2));
  }
</script>
</body></html>`;
}

export function ClinicsMap({ clinics }: { clinics: Clinic[] }) {
  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html: buildHtml(clinics) }}
      style={{ height: 320, borderRadius: 28, overflow: "hidden" }}
    />
  );
}
