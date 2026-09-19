// OVERNIGHT-18: Klinikalar bo'limidagi "eng yaqinlarini topish" — foydalanuvchi
// brauzer geolokatsiyasidan olingan koordinata bilan klinika koordinatasi
// orasidagi masofani hisoblaydi (Yer sharining egriligini hisobga oladi,
// oddiy Pifagor formulasi kichik masofalarda ham noto'g'ri natija berardi).

const EARTH_RADIUS_KM = 6371;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Ikki koordinata orasidagi masofa, kilometrda (Haversine formulasi). */
export function haversineDistanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}
