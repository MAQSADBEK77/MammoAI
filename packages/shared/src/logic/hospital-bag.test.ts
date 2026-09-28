import { describe, expect, it } from "vitest";
import { HOSPITAL_BAG_ITEMS, bagProgress } from "./hospital-bag";

describe("bagProgress", () => {
  it("bo'sh ro'yxatda nol foiz va tayyor emas", () => {
    const p = bagProgress([]);
    expect(p.checked).toBe(0);
    expect(p.percent).toBe(0);
    expect(p.ready).toBe(false);
    expect(p.missingEssential.length).toBeGreaterThan(0);
  });

  it("hammasi belgilansa 100% va tayyor", () => {
    const p = bagProgress(HOSPITAL_BAG_ITEMS.map((i) => i.id));
    expect(p.percent).toBe(100);
    expect(p.ready).toBe(true);
    expect(p.missingEssential).toEqual([]);
  });

  it("faqat majburiylar belgilansa ham TAYYOR", () => {
    // Avtokreslo yoki idish-tovoq yo'qligi tug'ruqxonaga borishga
    // xalaqit bermaydi — "tayyor emas" deyish yolg'on tashvish bo'lardi.
    const essentials = HOSPITAL_BAG_ITEMS.filter((i) => i.essential).map((i) => i.id);
    const p = bagProgress(essentials);
    expect(p.ready).toBe(true);
    expect(p.percent).toBeLessThan(100);
  });

  it("majburiy bitta narsa yetishmasa tayyor emas", () => {
    const ids = HOSPITAL_BAG_ITEMS.map((i) => i.id).filter((id) => id !== "exchange_card");
    const p = bagProgress(ids);
    expect(p.ready).toBe(false);
    expect(p.missingEssential).toEqual(["exchange_card"]);
  });

  it("noma'lum id sanoqqa qo'shilmaydi", () => {
    expect(bagProgress(["yoq-bunday-narsa"]).checked).toBe(0);
  });

  it("id'lar takrorlanmaydi va uchala guruh bor", () => {
    const ids = HOSPITAL_BAG_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(HOSPITAL_BAG_ITEMS.map((i) => i.group))).toEqual(new Set(["documents", "mother", "baby"]));
  });

  it("hujjatlarning uchtasi majburiy", () => {
    const docs = HOSPITAL_BAG_ITEMS.filter((i) => i.group === "documents" && i.essential);
    expect(docs.map((d) => d.id)).toEqual(["passport", "exchange_card", "test_results"]);
  });
});
