import { describe, expect, it } from "vitest";
import { resolvePregnancyText } from "./pregnancy-i18n";

const uz = { sizeLabel: "limon", babyDevelopment: "Homila yutinadi.", motherChanges: "Birinchi trimestr tugaydi." };

describe("resolvePregnancyText", () => {
  it("tarjima bor — o'z tilida beriladi", () => {
    const ru = { sizeLabel: "лимон", babyDevelopment: "Плод глотает.", motherChanges: "Первый триместр завершается." };
    expect(resolvePregnancyText({ uz, ru }, "ru")).toEqual(ru);
  });

  it("tarjima YO'Q — o'zbekchaga tushadi, bo'sh ekran chiqmaydi", () => {
    expect(resolvePregnancyText({ uz, ru: null }, "ru")).toEqual(uz);
    expect(resolvePregnancyText({ uz }, "en")).toEqual(uz);
  });

  it("tarjima QISMAN — faqat yetishmagan maydon o'zbekcha qoladi", () => {
    const out = resolvePregnancyText({ uz, en: { sizeLabel: "a lemon" } }, "en");
    expect(out.sizeLabel).toBe("a lemon");
    expect(out.babyDevelopment).toBe(uz.babyDevelopment);
  });

  it("faqat bo'shliqdan iborat matn 'yo'q' deb hisoblanadi", () => {
    const out = resolvePregnancyText({ uz, ru: { sizeLabel: "   ", babyDevelopment: "Плод глотает." } }, "ru");
    expect(out.sizeLabel).toBe("limon");
    expect(out.babyDevelopment).toBe("Плод глотает.");
  });

  it("o'zbek va kirill — har doim o'zbekcha manba (kirill avtomatik o'giriladi)", () => {
    const ru = { sizeLabel: "лимон", babyDevelopment: "x", motherChanges: "y" };
    expect(resolvePregnancyText({ uz, ru }, "uz")).toEqual(uz);
    expect(resolvePregnancyText({ uz, ru }, "uz-cyrl")).toEqual(uz);
  });
});
