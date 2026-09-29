import { describe, expect, it } from "vitest";
import { sizeArtSlug } from "./size-art";

describe("sizeArtSlug", () => {
  it("bazadagi nomlarni topadi", () => {
    expect(sizeArtSlug("qovun")).toBe("qovun");
    expect(sizeArtSlug("anor")).toBe("pomegranate");
    expect(sizeArtSlug("romaine salat")).toBe("lettuce");
  });

  it("apostrofning har qanday shakli bilan ishlaydi", () => {
    // Nom admin panelda qo'lda kiritiladi — apostrof tufayli rasm
    // yo'qolib qolmasligi kerak.
    for (const v of ["kokos yong'og'i", "kokos yongʻogʻi", "kokos yong`og`i"]) {
      expect(sizeArtSlug(v)).toBe("coconut");
    }
  });

  it("katta/kichik variantlar bir rasmni ishlatadi", () => {
    expect(sizeArtSlug("katta tarvuz")).toBe("watermelon");
    expect(sizeArtSlug("tarvuz")).toBe("watermelon");
    expect(sizeArtSlug("kichik tarvuz")).toBe("watermelon-small");
    expect(sizeArtSlug("katta qovun")).toBe("qovun");
  });

  it("noma'lum yoki bo'sh nomda null", () => {
    expect(sizeArtSlug("kartoshka")).toBeNull();
    expect(sizeArtSlug("")).toBeNull();
    expect(sizeArtSlug(null)).toBeNull();
    expect(sizeArtSlug(undefined)).toBeNull();
  });

  it("registr farq qilmaydi", () => {
    expect(sizeArtSlug("QOVUN")).toBe("qovun");
  });
});
