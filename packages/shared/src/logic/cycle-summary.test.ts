import { describe, it, expect } from "vitest";
import { summarizeCycles } from "./cycle-summary";

/** Hayz kunlarini yasash yordamchisi. */
function period(start: string, days: number) {
  const out: { date: string; flow: "medium" }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + i);
    out.push({ date: d.toISOString().slice(0, 10), flow: "medium" });
  }
  return out;
}

describe("summarizeCycles (SUMMARY-01)", () => {
  it("ma'lumot bo'lmasa hamma maydon null — soxta raqam chiqarmaydi", () => {
    const s = summarizeCycles([], "2026-06-01");
    expect(s.previousCycleLength).toBeNull();
    expect(s.previousPeriodLength).toBeNull();
    expect(s.variation).toBeNull();
    expect(s.completedCycles).toBe(0);
  });

  it("bitta hayz qayd etilgan bo'lsa ham hali TUGAGAN sikl yo'q", () => {
    const s = summarizeCycles(period("2026-03-01", 5), "2026-03-10");
    expect(s.previousCycleLength).toBeNull();
    expect(s.completedCycles).toBe(0);
    // Hayz hali oxirgisi — tugaganini bilmaymiz.
    expect(s.previousPeriodLength).toBeNull();
  });

  it("ikki hayzdan keyin sikl uzunligi va TUGAGAN hayz davomiyligi chiqadi", () => {
    const logs = [...period("2026-03-01", 5), ...period("2026-03-29", 6)];
    const s = summarizeCycles(logs, "2026-04-10");
    expect(s.previousCycleLength).toEqual({ days: 28, status: "normal" });
    // Oxirgisi emas, undan OLDINGI hayz o'lchanadi (oxirgisi davom etayotgan
    // bo'lishi mumkin).
    expect(s.previousPeriodLength).toEqual({ days: 5, status: "normal" });
    // Bitta tugagan sikl — o'zgarish diapazoni hali ma'noli emas.
    expect(s.variation).toBeNull();
    expect(s.completedCycles).toBe(1);
  });

  it("odatiy oraliqdan tashqarisi 'qisqa'/'uzun' deb belgilanadi", () => {
    // 19 kunlik sikl — odatiy 21-35 dan qisqa.
    const shortCycle = [...period("2026-03-01", 5), ...period("2026-03-20", 5), ...period("2026-04-08", 5)];
    const s = summarizeCycles(shortCycle, "2026-04-20");
    expect(s.previousCycleLength?.status).toBe("short");
  });

  it("o'zgarish diapazoni va muntazamlik 2+ tugagan sikldan keyin", () => {
    const logs = [...period("2026-01-01", 5), ...period("2026-01-29", 5), ...period("2026-02-26", 5)];
    const s = summarizeCycles(logs, "2026-03-10");
    expect(s.completedCycles).toBe(2);
    expect(s.variation).toEqual({ min: 28, max: 28, regular: true });
  });

  it("uzun hayz (8 kun) 'uzun' deb belgilanadi", () => {
    const logs = [...period("2026-01-01", 8), ...period("2026-01-29", 5)];
    const s = summarizeCycles(logs, "2026-02-10");
    expect(s.previousPeriodLength).toEqual({ days: 8, status: "long" });
  });
});
