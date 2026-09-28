import { describe, expect, it } from "vitest";
import { buildCycleRing } from "./cycle-ring";

const base = {
  lastPeriodStart: "2026-09-01",
  cycleLength: 28,
  periodLength: 5,
  fertileWindowStart: "2026-09-10",
  fertileWindowEnd: "2026-09-15",
  ovulationDay: "2026-09-14",
};

describe("buildCycleRing", () => {
  it("siklning birinchi kuni — boshida turadi", () => {
    const r = buildCycleRing({ ...base, today: "2026-09-01" })!;
    expect(r.cycleDay).toBe(1);
    expect(r.progress).toBe(0);
    expect(r.overdue).toBe(false);
  });

  it("o'rtada — taxminan yarmida", () => {
    const r = buildCycleRing({ ...base, today: "2026-09-15" })!;
    expect(r.cycleDay).toBe(15);
    expect(r.progress).toBeCloseTo(0.5, 1);
  });

  it("hayz bo'lagi birinchi kunlarni qoplaydi", () => {
    const r = buildCycleRing({ ...base, today: "2026-09-10" })!;
    const period = r.segments.find((s) => s.kind === "period")!;
    expect(period.from).toBe(0);
    // 5 kunlik hayz 28 kunlik siklning taxminan 18 foizi.
    expect(period.to).toBeCloseTo(5 / 28, 2);
  });

  it("unumdor oyna sanalardan hisoblanadi", () => {
    const r = buildCycleRing({ ...base, today: "2026-09-10" })!;
    const fertile = r.segments.find((s) => s.kind === "fertile")!;
    expect(fertile.from).toBeCloseTo(9 / 28, 2);
    expect(fertile.to).toBeCloseTo(15 / 28, 2);
    expect(r.ovulationAt).toBeCloseTo(13 / 28, 2);
  });

  it("kechikkan siklda halqa oxirida TURADI, boshiga qaytmaydi", () => {
    // Bu shart: 3 kun kechikkan ayol o'zini siklning boshida ko'rsa,
    // hammasi joyidadek tuyulardi.
    const r = buildCycleRing({ ...base, today: "2026-10-01" })!;
    expect(r.cycleDay).toBe(31);
    expect(r.overdue).toBe(true);
    expect(r.progress).toBe(1);
  });

  it("kelajakdagi sana yoki buzuq uzunlikda null", () => {
    expect(buildCycleRing({ ...base, today: "2026-08-30" })).toBeNull();
    expect(buildCycleRing({ ...base, cycleLength: 5, today: "2026-09-10" })).toBeNull();
    expect(buildCycleRing({ ...base, cycleLength: 90, today: "2026-09-10" })).toBeNull();
  });

  it("unumdor oyna sikldan tashqarida bo'lsa qo'shilmaydi", () => {
    const r = buildCycleRing({
      ...base,
      today: "2026-09-10",
      fertileWindowStart: "2026-10-20",
      fertileWindowEnd: "2026-10-25",
    })!;
    expect(r.segments.some((s) => s.kind === "fertile")).toBe(false);
    expect(r.ovulationAt).not.toBeNull();
  });
});
