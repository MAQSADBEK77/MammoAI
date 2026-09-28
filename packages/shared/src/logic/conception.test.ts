import { describe, expect, it } from "vitest";
import { fertileWindowCoverage, monthsTryingSince, resolveConceptionStage, type ConceptionInput } from "./conception";

function base(over: Partial<ConceptionInput> = {}): ConceptionInput {
  return { age: 28, monthsTrying: 3, hasKnownRiskFactor: false, ...over };
}

describe("resolveConceptionStage — chegara yoshga bog'liq", () => {
  it("35 yoshgacha 12 oy kutiladi", () => {
    expect(resolveConceptionStage(base({ age: 28, monthsTrying: 11 }))).toEqual({ kind: "on-track", monthsTrying: 11, monthsLeft: 1 });
    expect(resolveConceptionStage(base({ age: 28, monthsTrying: 12 })).kind).toBe("evaluate-now");
  });

  it("35-40 yoshda 6 oy — yarim barobar qisqa", () => {
    // Bu chegarani bilmaslik ayolni yarim yil yo'qotishi mumkin.
    expect(resolveConceptionStage(base({ age: 36, monthsTrying: 5 }))).toEqual({ kind: "on-track", monthsTrying: 5, monthsLeft: 1 });
    expect(resolveConceptionStage(base({ age: 36, monthsTrying: 6 }))).toEqual({ kind: "evaluate-now", monthsTrying: 6, reason: "duration" });
  });

  it("40 dan katta bo'lsa kutilmaydi", () => {
    expect(resolveConceptionStage(base({ age: 41, monthsTrying: 0 }))).toEqual({ kind: "evaluate-now", monthsTrying: 0, reason: "age" });
  });

  it("aniq yosh chegaralari: 35 va 40 qaysi tomonga tushadi", () => {
    // 35 — qisqa chegara boshlanadi; 40 — hali "darhol" emas.
    expect(resolveConceptionStage(base({ age: 34, monthsTrying: 6 })).kind).toBe("on-track");
    expect(resolveConceptionStage(base({ age: 35, monthsTrying: 6 })).kind).toBe("evaluate-now");
    expect(resolveConceptionStage(base({ age: 40, monthsTrying: 1 })).kind).toBe("on-track");
    expect(resolveConceptionStage(base({ age: 41, monthsTrying: 1 }))).toEqual({ kind: "evaluate-now", monthsTrying: 1, reason: "age" });
  });
});

describe("resolveConceptionStage — xavf omili va noma'lum muddat", () => {
  it("xavf omili bo'lsa muddat kutilmaydi", () => {
    expect(resolveConceptionStage(base({ monthsTrying: 1, hasKnownRiskFactor: true }))).toEqual({
      kind: "evaluate-now",
      monthsTrying: 1,
      reason: "risk",
    });
  });

  it("muddat noma'lum bo'lsa avval shuni so'raymiz", () => {
    expect(resolveConceptionStage(base({ monthsTrying: null }))).toEqual({ kind: "unknown-duration" });
  });

  it("yosh va xavf omili muddat noma'lum bo'lsa ham ustun turadi", () => {
    // Javobni kutib turish bu ikki holatda vaqt yo'qotish demak.
    expect(resolveConceptionStage(base({ age: 42, monthsTrying: null })).kind).toBe("evaluate-now");
    expect(resolveConceptionStage(base({ monthsTrying: null, hasKnownRiskFactor: true })).kind).toBe("evaluate-now");
  });
});

describe("monthsTryingSince", () => {
  it("to'liq oylarni sanaydi", () => {
    expect(monthsTryingSince("2026-01-15", "2026-09-27")).toBe(8);
    expect(monthsTryingSince("2026-01-15", "2026-01-14")).toBe(null); // kelajak
    expect(monthsTryingSince("2026-09-01", "2026-09-27")).toBe(0);
  });

  it("oy kuni yetmasa oy hisoblanmaydi", () => {
    // 15-yanvardan 14-fevralgacha hali bir oy bo'lmagan.
    expect(monthsTryingSince("2026-01-15", "2026-02-14")).toBe(0);
    expect(monthsTryingSince("2026-01-15", "2026-02-15")).toBe(1);
  });

  it("yo'q yoki buzuq sana — noma'lum", () => {
    expect(monthsTryingSince(null, "2026-09-27")).toBe(null);
    expect(monthsTryingSince("shunchaki matn", "2026-09-27")).toBe(null);
  });
});

describe("fertileWindowCoverage", () => {
  it("oynadagi kunlarni sanaydi, tashqaridagilarni hisoblamaydi", () => {
    const r = fertileWindowCoverage("2026-09-20", "2026-09-25", ["2026-09-19", "2026-09-21", "2026-09-24", "2026-09-30"]);
    expect(r).toEqual({ total: 6, covered: 2 });
  });

  it("bir kun ikki marta belgilansa bir marta sanaladi", () => {
    expect(fertileWindowCoverage("2026-09-20", "2026-09-22", ["2026-09-21", "2026-09-21"]).covered).toBe(1);
  });

  it("hech narsa belgilanmasa nol", () => {
    expect(fertileWindowCoverage("2026-09-20", "2026-09-25", [])).toEqual({ total: 6, covered: 0 });
  });
});
