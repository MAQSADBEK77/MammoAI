import { describe, expect, it } from "vitest";
import { HEALTH_CONCERNS, bmiFrom, rankHealthConcerns, type HealthConcernRelevanceInput } from "./health-concerns";

const base: HealthConcernRelevanceInput = {
  age: 25,
  isPregnant: false,
  cycleRegularity: "regular",
  healthConditions: [],
  hasGivenBirth: null,
  hormonalContraception: null,
  bmi: null,
};

const idsOf = (input: HealthConcernRelevanceInput) => rankHealthConcerns(input).map((r) => r.rule.id);

describe("rankHealthConcerns", () => {
  it("shifokor bergan 12 ta muammoni saqlaydi", () => {
    expect(HEALTH_CONCERNS).toHaveLength(12);
    expect(new Set(HEALTH_CONCERNS.map((c) => c.id)).size).toBe(12);
  });

  it("homilador bo'lmagan ayolga homiladorlik mavzularini ko'rsatmaydi", () => {
    const ids = idsOf(base);
    expect(ids).not.toContain("pregnancy_complications");
    expect(ids).not.toContain("pregnancy_comorbidity");
  });

  it("homilador ayolda homiladorlik mavzulari birinchi o'rinda turadi", () => {
    const ids = idsOf({ ...base, isPregnant: true });
    expect(ids.slice(0, 2)).toEqual(["pregnancy_complications", "pregnancy_comorbidity"]);
    // Homiladorlikda ma'nosiz mavzular chiqarib tashlanadi.
    expect(ids).not.toContain("contraception");
    expect(ids).not.toContain("infertility");
  });

  it("nomuntazam sikl 'hayz buzilishlari'ni tepaga ko'taradi", () => {
    expect(idsOf({ ...base, cycleRegularity: "irregular" })[0]).toBe("cycle_disorders");
  });

  it("PCOS gormonal buzilishni belgilaydi", () => {
    const ranked = rankHealthConcerns({ ...base, healthConditions: ["pcos"] });
    expect(ranked.find((r) => r.rule.id === "hormonal_imbalance")?.highlighted).toBe(true);
  });

  it("TMI 30 dan yuqori bo'lsa semizlik mavzusi belgilanadi, past bo'lsa yo'q", () => {
    const high = rankHealthConcerns({ ...base, bmi: 32 }).find((r) => r.rule.id === "obesity");
    const normal = rankHealthConcerns({ ...base, bmi: 22 }).find((r) => r.rule.id === "obesity");
    expect(high?.highlighted).toBe(true);
    expect(normal?.highlighted).toBe(false);
  });

  it("yosh chegarasidan tashqaridagi mavzular umuman ko'rsatilmaydi", () => {
    // 16 yoshli foydalanuvchida klimaks mavzulari ma'nosiz.
    const young = idsOf({ ...base, age: 16 });
    expect(young).not.toContain("early_menopause");
    expect(young).not.toContain("menopause_later_life");
    // 60 yoshda esa bepushtlik/kontratseptsiya mavzulari ma'nosiz.
    const older = idsOf({ ...base, age: 60 });
    expect(older).not.toContain("infertility");
    expect(older).not.toContain("contraception");
    expect(older).toContain("menopause_later_life");
  });

  it("hech qanday ma'lumot bo'lmasa shifokor bergan tartib saqlanadi", () => {
    // Ballar teng — kanonik tartib buzilmasligi kerak.
    const ids = idsOf(base);
    const canonical = HEALTH_CONCERNS.filter((c) => ids.includes(c.id)).map((c) => c.id);
    expect(ids).toEqual(canonical);
  });

  it("har bir muammo kamida bitta mavjud tekshiruvga bog'langan", () => {
    for (const concern of HEALTH_CONCERNS) {
      expect(concern.relatedCheckups.length).toBeGreaterThan(0);
    }
  });
});

describe("bmiFrom", () => {
  it("bo'y va vazndan TMI hisoblaydi", () => {
    expect(bmiFrom(170, 65)).toBeCloseTo(22.49, 1);
  });

  it("ma'lumot to'liq bo'lmasa null qaytaradi", () => {
    expect(bmiFrom(null, 65)).toBeNull();
    expect(bmiFrom(170, null)).toBeNull();
    expect(bmiFrom(0, 65)).toBeNull();
  });
});
