import { describe, it, expect } from "vitest";
import { buildSymptomPatterns } from "./symptom-patterns";
import type { Symptom } from "../types";

type L = { date: string; flow: "medium" | null; symptoms: Symptom[] };

function day(date: string, flow: "medium" | null, symptoms: Symptom[] = []): L {
  return { date, flow, symptoms };
}

/** Uch sikl: 1-yanvar, 29-yanvar, 26-fevral — har biri 5 kunlik hayz. */
function threeCycles(extra: L[] = []): L[] {
  const out: L[] = [];
  for (const start of ["2026-01-01", "2026-01-29", "2026-02-26"]) {
    for (let i = 0; i < 5; i++) {
      const d = new Date(start + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() + i);
      out.push(day(d.toISOString().slice(0, 10), "medium"));
    }
  }
  return [...out, ...extra];
}

describe("buildSymptomPatterns (PATTERN-01)", () => {
  it("qayd yo'q bo'lsa bo'sh ro'yxat", () => {
    expect(buildSymptomPatterns([], "2026-03-10")).toEqual([]);
  });

  it("eng ko'p belgilangan simptomlar birinchi keladi", () => {
    const logs = threeCycles([
      day("2026-01-02", "medium", ["cramps"]),
      day("2026-01-30", "medium", ["cramps"]),
      day("2026-02-27", "medium", ["cramps", "headache"]),
    ]);
    const out = buildSymptomPatterns(logs, "2026-03-05");
    expect(out[0].symptom).toBe("cramps");
    expect(out[0].occurrences).toBe(3);
  });

  it("uchtadan kam uchrasa NAQSH deb aytilmaydi", () => {
    const logs = threeCycles([day("2026-01-02", "medium", ["cramps"]), day("2026-01-30", "medium", ["cramps"])]);
    const out = buildSymptomPatterns(logs, "2026-03-05");
    expect(out[0].occurrences).toBe(2);
    expect(out[0].dominantPhase).toBeNull();
  });

  it("uch marta hayz kunlarida uchrasa — ustun faza 'menstrual'", () => {
    const logs = threeCycles([
      day("2026-01-02", "medium", ["cramps"]),
      day("2026-01-30", "medium", ["cramps"]),
      day("2026-02-27", "medium", ["cramps"]),
    ]);
    const out = buildSymptomPatterns(logs, "2026-03-05");
    // 26-fevral sikli hali TUGAMAGAN, ya'ni faza hisobiga kirmaydi —
    // qolgan ikkitasi hayz kunlarida.
    expect(out[0].dominantPhase).toBe("menstrual");
  });

  it("fazalarga teng tarqalsa — hech qanday da'vo qilinmaydi", () => {
    const logs = threeCycles([
      // 1-sikl: biri hayzda, biri lyutealda; 2-sikl: xuddi shunday.
      day("2026-01-02", "medium", ["headache"]),
      day("2026-01-22", null, ["headache"]),
      day("2026-01-30", "medium", ["headache"]),
      day("2026-02-19", null, ["headache"]),
    ]);
    const out = buildSymptomPatterns(logs, "2026-03-05").find((p) => p.symptom === "headache")!;
    expect(out.occurrences).toBe(4);
    expect(out.dominantPhase).toBeNull();
  });

  it("xaritada simptom belgilangan kun ko'rsatiladi", () => {
    const logs = threeCycles([day("2026-01-03", "medium", ["cramps"])]);
    const out = buildSymptomPatterns(logs, "2026-03-05");
    const firstCycle = out[0].cycles.find((c) => c.start === "2026-01-01")!;
    // 3-yanvar = siklning 3-kuni (indeks 2).
    expect(firstCycle.days[2].logged).toBe(true);
    expect(firstCycle.days[0].logged).toBe(false);
  });
});
