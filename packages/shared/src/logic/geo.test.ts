import { describe, expect, it } from "vitest";
import { haversineDistanceKm } from "./geo";

describe("haversineDistanceKm", () => {
  it("bir xil koordinata uchun 0 qaytaradi", () => {
    expect(haversineDistanceKm({ lat: 41.311, lng: 69.279 }, { lat: 41.311, lng: 69.279 })).toBeCloseTo(0, 5);
  });

  it("Toshkent va Samarqand orasidagi taxminiy masofani to'g'ri hisoblaydi", () => {
    // Haqiqiy masofa taxminan 260-270 km (havo chizig'i bo'yicha).
    const tashkent = { lat: 41.2995, lng: 69.2401 };
    const samarkand = { lat: 39.6542, lng: 66.9597 };
    const km = haversineDistanceKm(tashkent, samarkand);
    expect(km).toBeGreaterThan(250);
    expect(km).toBeLessThan(280);
  });

  it("simmetrik — A dan B gacha B dan A gachaga teng", () => {
    const a = { lat: 41.0, lng: 69.0 };
    const b = { lat: 40.5, lng: 70.5 };
    expect(haversineDistanceKm(a, b)).toBeCloseTo(haversineDistanceKm(b, a), 10);
  });
});
