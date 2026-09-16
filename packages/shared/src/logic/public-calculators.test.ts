import { describe, expect, it } from "vitest";
import { calcDueDateEstimate, calcHcgEstimateFromLmp, calcOvulationEstimate, calcPregnancyMonth, getHcgReferenceRange } from "./public-calculators";

describe("calcDueDateEstimate", () => {
  it("adds 280 days to LMP and reports the current week", () => {
    const result = calcDueDateEstimate("2026-01-01", "2026-01-01");
    expect(result?.dueDate).toBe("2026-10-08");
    expect(result?.currentWeek).toBe(1);
    expect(result?.trimester).toBe(1);
  });

  it("returns null for an empty date", () => {
    expect(calcDueDateEstimate("", "2026-01-01")).toBeNull();
  });

  it("reports week 20 (trimester 2) 19 weeks after LMP", () => {
    const result = calcDueDateEstimate("2026-01-01", "2026-05-21"); // 140 kun = 20 hafta
    expect(result?.currentWeek).toBe(21);
    expect(result?.trimester).toBe(2);
  });
});

describe("calcOvulationEstimate", () => {
  it("places ovulation 14 days before the next period for a default 28-day cycle", () => {
    const result = calcOvulationEstimate("2026-01-01", 28);
    expect(result?.nextPeriodDate).toBe("2026-01-29");
    expect(result?.ovulationDate).toBe("2026-01-15");
    expect(result?.fertileWindowStart).toBe("2026-01-10");
    expect(result?.fertileWindowEnd).toBe("2026-01-16");
  });

  it("shifts ovulation later for a longer cycle", () => {
    const result = calcOvulationEstimate("2026-01-01", 35);
    expect(result?.ovulationDate).toBe("2026-01-22");
  });

  it("rejects an out-of-range cycle length", () => {
    expect(calcOvulationEstimate("2026-01-01", 5)).toBeNull();
    expect(calcOvulationEstimate("2026-01-01", 90)).toBeNull();
  });
});

describe("calcPregnancyMonth", () => {
  it("maps early weeks to month 1", () => {
    expect(calcPregnancyMonth(1)).toBe(1);
    expect(calcPregnancyMonth(4)).toBe(1);
  });

  it("maps week 40 to month 10", () => {
    expect(calcPregnancyMonth(40)).toBe(10);
  });

  it("clamps out-of-range weeks", () => {
    expect(calcPregnancyMonth(0)).toBe(1);
    expect(calcPregnancyMonth(100)).toBe(10);
  });
});

describe("getHcgReferenceRange / calcHcgEstimateFromLmp", () => {
  it("finds the matching row for a given week", () => {
    const row = getHcgReferenceRange(6);
    expect(row?.weekLabel).toBe("6 hafta");
  });

  it("returns null past the table's range", () => {
    expect(getHcgReferenceRange(1)).toBeNull();
  });

  it("derives the current week from LMP and returns its hCG row", () => {
    const result = calcHcgEstimateFromLmp("2026-01-01", "2026-01-22"); // 21 kun = 4-hafta boshi... 22 kun -> hafta 4
    expect(result?.currentWeek).toBe(4);
    expect(result?.weekLabel).toBe("4 hafta");
  });

  it("returns null when LMP is in the future relative to today", () => {
    expect(calcHcgEstimateFromLmp("2026-02-01", "2026-01-01")).toBeNull();
  });
});
