import { describe, expect, it } from "vitest";
import { detectsMedicalConcern } from "./community-safety";

describe("detectsMedicalConcern", () => {
  it("tibbiy-shoshilinch kalit so'zli matnni aniqlaydi", () => {
    expect(detectsMedicalConcern("Menda 3 kundan beri qon ketmoqda, nima qilay?")).toBe(true);
  });

  it("katta-kichik harfga sezgir emas", () => {
    expect(detectsMedicalConcern("SHIFOKORGA borishim kerakmi?")).toBe(true);
  });

  it("oddiy, xavotirsiz postni belgilamaydi", () => {
    expect(detectsMedicalConcern("Bugun ajoyib kayfiyatdaman, hamma bilan baham ko'rgim keldi!")).toBe(false);
  });
});
