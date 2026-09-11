import { describe, expect, it } from "vitest";
import {
  ADULT_GOALS,
  MINOR_GOALS,
  goalToLandingTab,
  isPregnancyGoal,
  needsHeightWeight,
  needsCycleInfo,
  needsPersonalHealthQuestions,
  getModeAccentColors,
} from "./goal";

describe("goalToLandingTab", () => {
  it("partner_tracking — 'partner' bo'limiga yo'naltiradi", () => {
    expect(goalToLandingTab("partner_tracking")).toBe("partner");
  });

  it("pregnancy va planning_pregnancy — 'pregnancy' bo'limiga yo'naltiradi", () => {
    expect(goalToLandingTab("pregnancy")).toBe("pregnancy");
    expect(goalToLandingTab("planning_pregnancy")).toBe("pregnancy");
  });

  it("checkups — 'checkups' bo'limiga yo'naltiradi", () => {
    expect(goalToLandingTab("checkups")).toBe("checkups");
  });

  it("qolgan barcha maqsadlar (cycle, wellbeing, understand_body, skin) — 'cycle'ga tushadi", () => {
    expect(goalToLandingTab("cycle")).toBe("cycle");
    expect(goalToLandingTab("wellbeing")).toBe("cycle");
    expect(goalToLandingTab("understand_body")).toBe("cycle");
    expect(goalToLandingTab("skin")).toBe("cycle");
  });
});

describe("isPregnancyGoal", () => {
  it("faqat aynan 'pregnancy' uchun true (planning_pregnancy uchun EMAS)", () => {
    expect(isPregnancyGoal("pregnancy")).toBe(true);
    expect(isPregnancyGoal("planning_pregnancy")).toBe(false);
  });
});

describe("needsHeightWeight", () => {
  it("homiladorlik/tayyorgarlik maqsadlarida bo'y-vazn so'raladi", () => {
    expect(needsHeightWeight("pregnancy")).toBe(true);
    expect(needsHeightWeight("planning_pregnancy")).toBe(true);
    expect(needsHeightWeight("cycle")).toBe(false);
  });
});

describe("needsCycleInfo", () => {
  it("pregnancy va partner_tracking'da sikl ma'lumoti so'ralmaydi", () => {
    expect(needsCycleInfo("pregnancy")).toBe(false);
    expect(needsCycleInfo("partner_tracking")).toBe(false);
  });

  it("boshqa maqsadlarda so'raladi", () => {
    expect(needsCycleInfo("cycle")).toBe(true);
    expect(needsCycleInfo("planning_pregnancy")).toBe(true);
  });
});

describe("needsPersonalHealthQuestions", () => {
  it("faqat partner_tracking'da shaxsiy sog'liq savollari so'ralmaydi", () => {
    expect(needsPersonalHealthQuestions("partner_tracking")).toBe(false);
    expect(needsPersonalHealthQuestions("cycle")).toBe(true);
    expect(needsPersonalHealthQuestions("pregnancy")).toBe(true);
  });
});

describe("ADULT_GOALS / MINOR_GOALS", () => {
  it("18+ ro'yxatida partner_tracking bor, kichiklar ro'yxatida yo'q", () => {
    expect(ADULT_GOALS).toContain("partner_tracking");
    expect(MINOR_GOALS).not.toContain("partner_tracking");
  });

  it("ikkala ro'yxat ham bo'sh emas va bir-biriga mos kelmaydi", () => {
    expect(ADULT_GOALS.length).toBeGreaterThan(0);
    expect(MINOR_GOALS.length).toBeGreaterThan(0);
  });
});

describe("getModeAccentColors", () => {
  it("pregnancy — binafsha rang beradi", () => {
    expect(getModeAccentColors("pregnancy").primary).toBe("#7C3AED");
  });

  it("planning_pregnancy — moviy-yashil (teal) rang beradi, pregnancy'dan farqli", () => {
    const planning = getModeAccentColors("planning_pregnancy");
    const pregnancy = getModeAccentColors("pregnancy");
    expect(planning.primary).toBe("#0D9488");
    expect(planning.primary).not.toBe(pregnancy.primary);
  });

  it("cycle va boshqa maqsadlar — standart pushti rang beradi", () => {
    expect(getModeAccentColors("cycle").primary).toBe("#F43F7F");
    expect(getModeAccentColors("wellbeing").primary).toBe("#F43F7F");
  });
});
