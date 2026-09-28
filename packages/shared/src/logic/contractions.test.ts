import { describe, expect, it } from "vitest";
import { summarizeContractions, type Contraction } from "./contractions";

const NOW = new Date("2026-09-27T12:00:00Z");

/** `minutesAgo` daqiqa oldin boshlangan, `durationSec` soniya davom etgan. */
function at(minutesAgo: number, durationSec: number): Contraction {
  const start = new Date(NOW.getTime() - minutesAgo * 60_000);
  return { startedAt: start.toISOString(), endedAt: new Date(start.getTime() + durationSec * 1000).toISOString() };
}

describe("summarizeContractions", () => {
  it("ma'lumot bo'lmasa bo'sh xulosa qaytaradi", () => {
    expect(summarizeContractions([], NOW)).toEqual({
      count: 0,
      averageDurationSec: null,
      averageIntervalMin: null,
      meetsRule: false,
    });
  });

  it("o'rtacha davomiylik va oraliqni hisoblaydi", () => {
    const list = [at(20, 60), at(15, 70), at(10, 80)];
    const s = summarizeContractions(list, NOW);
    expect(s.count).toBe(3);
    expect(s.averageDurationSec).toBe(70);
    expect(s.averageIntervalMin).toBe(5);
  });

  it("5-1-1 bajarilganda signal beradi", () => {
    // Bir soat davomida har 5 daqiqada, har biri 65 soniya.
    const list = Array.from({ length: 13 }, (_, i) => at(60 - i * 5, 65));
    expect(summarizeContractions(list, NOW).meetsRule).toBe(true);
  });

  it("qisqarishlar KALTA bo'lsa qoida bajarilmaydi", () => {
    // Oraliq to'g'ri, lekin har biri atigi 40 soniya.
    const list = Array.from({ length: 13 }, (_, i) => at(60 - i * 5, 40));
    expect(summarizeContractions(list, NOW).meetsRule).toBe(false);
  });

  it("oraliq UZOQ bo'lsa qoida bajarilmaydi", () => {
    const list = Array.from({ length: 7 }, (_, i) => at(60 - i * 10, 70));
    expect(summarizeContractions(list, NOW).meetsRule).toBe(false);
  });

  it("qisqa vaqtdagi tez-tez qisqarishlar qoidani bajarmaydi", () => {
    // 20 daqiqada beshta — oraliq va davomiylik to'g'ri, lekin qoida
    // BIR SOAT davom etishini talab qiladi. Busiz ayol erta boradi.
    const list = Array.from({ length: 5 }, (_, i) => at(20 - i * 5, 70));
    const s = summarizeContractions(list, NOW);
    expect(s.averageIntervalMin).toBe(5);
    expect(s.meetsRule).toBe(false);
  });

  it("bir soatdan eskilari hisobga olinmaydi", () => {
    const list = [at(200, 70), at(180, 70), at(10, 70)];
    expect(summarizeContractions(list, NOW).count).toBe(1);
  });

  it("davom etayotgan qisqarish hisobga olinmaydi", () => {
    // Uning davomiyligi hali noma'lum — o'rtachani buzardi.
    const ongoing: Contraction = { startedAt: new Date(NOW.getTime() - 60_000).toISOString(), endedAt: null };
    expect(summarizeContractions([at(10, 70), ongoing], NOW).count).toBe(1);
  });
});
