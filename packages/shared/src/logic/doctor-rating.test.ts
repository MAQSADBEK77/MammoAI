import { describe, expect, it } from "vitest";
import {
  RATING_MIN_TO_SHOW,
  canRateDoctor,
  sortDoctorsByRating,
  summarizeDoctorRating,
} from "./doctor-rating";

describe("summarizeDoctorRating", () => {
  it("sharh bo'lmasa — ko'rsatilmaydi", () => {
    expect(summarizeDoctorRating([])).toEqual({ score: 0, count: 0, display: false });
  });

  it("bitta 5 ball ellikta 4.8 dan YUQORI turmaydi", () => {
    // Butun modulning mavjudlik sababi shu: oddiy o'rtacha bilan bitta
    // soxta sharh reytingni sotib olish imkonini berardi.
    const yangi = summarizeDoctorRating([5]);
    const tajribali = summarizeDoctorRating(Array(50).fill(4.8));
    expect(tajribali.score).toBeGreaterThan(yangi.score);
  });

  it("sharh ko'paygan sari haqiqiy o'rtachaga yaqinlashadi", () => {
    const oz = summarizeDoctorRating(Array(3).fill(5));
    const kop = summarizeDoctorRating(Array(100).fill(5));
    expect(kop.score).toBeGreaterThan(oz.score);
    expect(kop.score).toBeLessThanOrEqual(5);
  });

  it("uchtadan kam sharhda raqam ko'rsatilmaydi", () => {
    expect(summarizeDoctorRating([5, 5]).display).toBe(false);
    expect(summarizeDoctorRating(Array(RATING_MIN_TO_SHOW).fill(5)).display).toBe(true);
  });

  it("noto'g'ri qiymatlar e'tiborsiz qoldiriladi", () => {
    expect(summarizeDoctorRating([5, 0, 6, NaN, 4]).count).toBe(2);
  });
});

describe("sortDoctorsByRating", () => {
  it("reytingi bor shifokorlar yuqorida, yangilari yo'qolmaydi", () => {
    const list = [
      { id: "yangi", rating: summarizeDoctorRating([5]) },
      { id: "yaxshi", rating: summarizeDoctorRating(Array(20).fill(4.9)) },
      { id: "o'rtacha", rating: summarizeDoctorRating(Array(20).fill(4.0)) },
    ];
    expect(sortDoctorsByRating(list).map((d) => d.id)).toEqual(["yaxshi", "o'rtacha", "yangi"]);
  });
});

describe("canRateDoctor", () => {
  it("faqat tasdiqlangan tashrifdan keyin", () => {
    expect(canRateDoctor({ visitConfirmed: false, alreadyRated: false })).toBe(false);
    expect(canRateDoctor({ visitConfirmed: true, alreadyRated: false })).toBe(true);
  });

  it("ikkinchi marta baho qo'yib bo'lmaydi", () => {
    expect(canRateDoctor({ visitConfirmed: true, alreadyRated: true })).toBe(false);
  });
});
