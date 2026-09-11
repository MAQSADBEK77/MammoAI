import { describe, expect, it } from "vitest";
import { generateChecklist, CHECKLIST_ITEM_IS_FREE } from "./checklist-rules";

function typesOf(input: Parameters<typeof generateChecklist>[0]): string[] {
  return generateChecklist(input).map((i) => i.type);
}

describe("generateChecklist", () => {
  it("homilador bo'lsa, boshqa hamma narsadan qat'iy nazar FAQAT homiladorlik oqimi qaytadi", () => {
    const items = generateChecklist({ age: 25, familyHistory: true, isPregnant: true, cycleIrregular: true });
    expect(items.map((i) => i.type)).toEqual(["pregnancy_first_visit", "pregnancy_trimester_checkup"]);
  });

  it("20 yoshdan kichik, boshqa xavf omillari yo'q bo'lsa — bo'sh ro'yxat", () => {
    expect(typesOf({ age: 18, familyHistory: false, isPregnant: false, cycleIrregular: false })).toEqual([]);
  });

  it("20+ yoshda yillik ko'rik va pap-test qo'shiladi", () => {
    const types = typesOf({ age: 25, familyHistory: false, isPregnant: false, cycleIrregular: false });
    expect(types).toContain("gyn_annual_checkup");
    expect(types).toContain("pap_test");
  });

  it("40-44 yoshda mammografiya skrining qo'shiladi (45+ emas)", () => {
    const types42 = typesOf({ age: 42, familyHistory: false, isPregnant: false, cycleIrregular: false });
    expect(types42).toContain("mammography_screening");
    expect(types42).not.toContain("free_mammography_45");
  });

  it("45+ yoshda BEPUL mammografiya skrining qo'shiladi (oddiy emas)", () => {
    const types = typesOf({ age: 50, familyHistory: false, isPregnant: false, cycleIrregular: false });
    expect(types).toContain("free_mammography_45");
    expect(types).not.toContain("mammography_screening");
  });

  it("30-39 yoshda oilaviy tarix bo'lsa, mammografiya ERTA boshlanadi", () => {
    const withHistory = typesOf({ age: 35, familyHistory: true, isPregnant: false, cycleIrregular: false });
    const withoutHistory = typesOf({ age: 35, familyHistory: false, isPregnant: false, cycleIrregular: false });
    expect(withHistory).toContain("mammography_screening");
    expect(withoutHistory).not.toContain("mammography_screening");
  });

  it("tsikl tartibsiz bo'lsa, kuzatuv bandi qo'shiladi", () => {
    const types = typesOf({ age: 25, familyHistory: false, isPregnant: false, cycleIrregular: true });
    expect(types).toContain("cycle_irregularity_followup");
  });
});

describe("CHECKLIST_ITEM_IS_FREE", () => {
  it("40-45 yosh oralig'idagi mammografiya PULLIK, 45+ bepul dasturi BEPUL", () => {
    expect(CHECKLIST_ITEM_IS_FREE.mammography_screening).toBe(false);
    expect(CHECKLIST_ITEM_IS_FREE.free_mammography_45).toBe(true);
  });

  it("har bir checklist turi uchun aniq belgilangan (undefined yo'q)", () => {
    for (const value of Object.values(CHECKLIST_ITEM_IS_FREE)) {
      expect(typeof value).toBe("boolean");
    }
  });
});
