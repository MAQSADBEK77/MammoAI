import { describe, it, expect } from "vitest";
import { buildCycleHistory } from "./cycle-history";

function period(start: string, days: number) {
  const out: { date: string; flow: "medium" }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + i);
    out.push({ date: d.toISOString().slice(0, 10), flow: "medium" });
  }
  return out;
}

describe("buildCycleHistory (HISTORY-01)", () => {
  it("qayd yo'q bo'lsa bo'sh ro'yxat — soxta sikl yasamaydi", () => {
    expect(buildCycleHistory([], "2026-06-01")).toEqual([]);
  });

  it("eng yangi sikl BIRINCHI bo'lib keladi", () => {
    const logs = [...period("2026-01-01", 5), ...period("2026-01-29", 5), ...period("2026-02-26", 5)];
    const out = buildCycleHistory(logs, "2026-03-05");
    expect(out.map((c) => c.start)).toEqual(["2026-02-26", "2026-01-29", "2026-01-01"]);
  });

  it("tugagan siklda uzunlik ikki boshlanish orasidagi farq", () => {
    const logs = [...period("2026-01-01", 5), ...period("2026-01-29", 5)];
    const out = buildCycleHistory(logs, "2026-02-10");
    const completed = out.find((c) => !c.ongoing)!;
    expect(completed.start).toBe("2026-01-01");
    expect(completed.lengthDays).toBe(28);
    expect(completed.end).toBe("2026-01-28");
  });

  it("joriy sikl 'ongoing' va uzunligi BUGUNGACHA", () => {
    const logs = [...period("2026-01-01", 5), ...period("2026-01-29", 5)];
    const out = buildCycleHistory(logs, "2026-02-10");
    expect(out[0].ongoing).toBe(true);
    expect(out[0].end).toBeNull();
    // 29-yanvardan 10-fevralgacha = 13 kun (ikkala chekka ham hisobda).
    expect(out[0].lengthDays).toBe(13);
  });

  it("qayd etilgan hayz kunlari 'period' deb belgilanadi", () => {
    const logs = [...period("2026-01-01", 5), ...period("2026-01-29", 5)];
    const completed = buildCycleHistory(logs, "2026-02-10").find((c) => !c.ongoing)!;
    expect(completed.days.slice(0, 5)).toEqual(["period", "period", "period", "period", "period"]);
  });

  it("ovulyatsiya sikl OXIRIDAN sanaladi (lyuteal faza)", () => {
    const logs = [...period("2026-01-01", 5), ...period("2026-01-29", 5)];
    const completed = buildCycleHistory(logs, "2026-02-10", { lutealPhaseDays: 14 }).find((c) => !c.ongoing)!;
    // 28 kunlik sikl, lyuteal 14 → ovulyatsiya indeksi 14 (ya'ni 15-kun).
    expect(completed.days[14]).toBe("ovulation");
    expect(completed.days[13]).toBe("fertile");
    expect(completed.days[15]).toBe("fertile");
    // Oynadan tashqarisi belgisiz.
    expect(completed.days[20]).toBeNull();
  });

  it("shaxsiy lyuteal faza hisobga olinadi", () => {
    const logs = [...period("2026-01-01", 5), ...period("2026-01-29", 5)];
    const completed = buildCycleHistory(logs, "2026-02-10", { lutealPhaseDays: 11 }).find((c) => !c.ongoing)!;
    expect(completed.days[17]).toBe("ovulation");
    expect(completed.days[14]).toBe("fertile");
  });

  it("JORIY siklda ovulyatsiya ko'rsatilmaydi — sikl uzunligi hali noma'lum", () => {
    const logs = [...period("2026-01-01", 5), ...period("2026-01-29", 5)];
    const current = buildCycleHistory(logs, "2026-02-20")[0];
    expect(current.ongoing).toBe(true);
    expect(current.days.some((d) => d === "ovulation" || d === "fertile")).toBe(false);
  });
});
