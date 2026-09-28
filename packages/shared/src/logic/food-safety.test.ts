import { describe, expect, it } from "vitest";
import {
  PREGNANCY_FOODS,
  findPregnancyFood,
  normalizeFoodTerm,
  searchPregnancyFoods,
} from "./food-safety";

/** Testlarda nom sifatida id'ning o'zi emas, o'zbekcha nomga yaqin
 *  matn kerak — i18n lug'atiga bog'lanmaslik uchun kichik jadval. */
const NAMES: Record<string, string> = {
  boiled_milk: "Qaynatilgan sut",
  raw_milk: "Xom (qaynatilmagan) sut",
  coffee: "Kofe",
  wild_mushroom: "Qo'ziqorin (yovvoyi)",
  alcohol: "Alkogol",
};
const nameOf = (id: string) => NAMES[id] ?? id;

describe("normalizeFoodTerm", () => {
  it("har xil apostroflarni bir xil qiladi", () => {
    const variants = ["qo'ziqorin", "qoʻziqorin", "qo’ziqorin", "qo`ziqorin", "QOZIQORIN"];
    const normalized = new Set(variants.map(normalizeFoodTerm));
    expect(normalized).toEqual(new Set(["qoziqorin"]));
  });

  it("ortiqcha bo'shliqlarni yig'ishtiradi", () => {
    expect(normalizeFoodTerm("  xom   sut ")).toBe("xom sut");
  });
});

describe("searchPregnancyFoods", () => {
  it("bo'sh so'rovda butun ro'yxatni qaytaradi", () => {
    expect(searchPregnancyFoods("", nameOf)).toHaveLength(PREGNANCY_FOODS.length);
    expect(searchPregnancyFoods("   ", nameOf)).toHaveLength(PREGNANCY_FOODS.length);
  });

  it("aniq mos kelgan nom birinchi turadi", () => {
    // "sut" — "Qaynatilgan sut" ichida ham, "Xom sut" ichida ham bor;
    // taxallusi ("sut") aynan mos kelgani yuqori chiqishi kerak.
    const ids = searchPregnancyFoods("sut", nameOf).map((f) => f.id);
    expect(ids[0]).toBe("boiled_milk");
    expect(ids).toContain("raw_milk");
  });

  it("ruscha yozilishni ham topadi", () => {
    expect(searchPregnancyFoods("кофе", nameOf).map((f) => f.id)).toContain("coffee");
  });

  it("apostrofsiz yozilganda ham topadi", () => {
    expect(searchPregnancyFoods("qoziqorin", nameOf)[0]?.id).toBe("wild_mushroom");
  });

  it("topilmasa bo'sh ro'yxat qaytaradi", () => {
    expect(searchPregnancyFoods("zzzqqq", nameOf)).toEqual([]);
  });
});

describe("ro'yxat yaxlitligi", () => {
  it("id'lar takrorlanmaydi", () => {
    const ids = PREGNANCY_FOODS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("har uchala javob turi mavjud", () => {
    const verdicts = new Set(PREGNANCY_FOODS.map((f) => f.verdict));
    expect(verdicts).toEqual(new Set(["safe", "limit", "avoid"]));
  });

  it("alkogol hech qachon 'mumkin' bo'lmaydi", () => {
    // Bu shunchaki tekshiruv emas, QO'RIQCHI: ro'yxat qo'lda
    // tahrirlanadi va bu qatorning tasodifan o'zgarishi jiddiy.
    expect(findPregnancyFood("alcohol")?.verdict).toBe("avoid");
    expect(findPregnancyFood("raw_fish")?.verdict).toBe("avoid");
    expect(findPregnancyFood("raw_milk")?.verdict).toBe("avoid");
  });

  it("noma'lum id uchun null", () => {
    expect(findPregnancyFood("yoq")).toBeNull();
  });
});
