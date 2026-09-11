import { describe, expect, it } from "vitest";
import { getClinicRating, getClinicHours, isTopClinic } from "./clinic-display";

describe("getClinicRating", () => {
  it("4.3–4.9 oralig'ida qiymat qaytaradi", () => {
    const rating = getClinicRating("clinic-123");
    expect(rating).toBeGreaterThanOrEqual(4.3);
    expect(rating).toBeLessThanOrEqual(4.9);
  });

  it("bir xil id uchun har doim BIR XIL natija (deterministik, tasodifiy emas)", () => {
    expect(getClinicRating("clinic-abc")).toBe(getClinicRating("clinic-abc"));
  });

  it("boshqa id — boshqa (ehtimol) reyting", () => {
    // Hash-asoslangan, kafolatlangan farq emas, lekin amalda deyarli har doim farq qiladi.
    expect(getClinicRating("clinic-a")).not.toBe(getClinicRating("clinic-b"));
  });
});

describe("getClinicHours", () => {
  it("oldindan belgilangan variantlardan birini qaytaradi", () => {
    const hours = getClinicHours("clinic-123");
    expect(typeof hours).toBe("string");
    expect(hours.length).toBeGreaterThan(0);
  });

  it("bir xil id uchun barqaror natija beradi", () => {
    expect(getClinicHours("clinic-xyz")).toBe(getClinicHours("clinic-xyz"));
  });
});

describe("isTopClinic", () => {
  it("4.7 va undan yuqori reyting — 'Top klinika'", () => {
    expect(isTopClinic(4.7)).toBe(true);
    expect(isTopClinic(4.9)).toBe(true);
  });

  it("4.7 dan past — 'Top' emas", () => {
    expect(isTopClinic(4.6)).toBe(false);
    expect(isTopClinic(4.3)).toBe(false);
  });
});
