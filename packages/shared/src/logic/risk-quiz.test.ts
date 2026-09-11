import { describe, expect, it } from "vitest";
import { computeRiskScore, riskLevelFromScore, RISK_QUIZ_QUESTIONS } from "./risk-quiz";
import type { RiskQuizAnswers } from "../types";

function answers(partial: Partial<RiskQuizAnswers>): RiskQuizAnswers {
  const base: RiskQuizAnswers = {
    age: false,
    family_history: false,
    personal_history: false,
    early_period: false,
    no_children_or_late_pregnancy: false,
    hormone_therapy: false,
    smoking_alcohol: false,
  };
  return { ...base, ...partial };
}

describe("computeRiskScore", () => {
  it("hech qanday 'ha' javob bo'lmasa 0 ball", () => {
    expect(computeRiskScore(answers({}))).toBe(0);
  });

  it("hammasi 'ha' bo'lsa, barcha og'irliklar yig'indisi (12)", () => {
    const all = answers({
      age: true,
      family_history: true,
      personal_history: true,
      early_period: true,
      no_children_or_late_pregnancy: true,
      hormone_therapy: true,
      smoking_alcohol: true,
    });
    const maxPossible = RISK_QUIZ_QUESTIONS.reduce((sum, q) => sum + q.weight, 0);
    expect(computeRiskScore(all)).toBe(maxPossible);
    expect(maxPossible).toBe(12);
  });

  it("faqat bitta savolga 'ha' bo'lsa, o'sha savolning og'irligini beradi", () => {
    expect(computeRiskScore(answers({ family_history: true }))).toBe(3);
    expect(computeRiskScore(answers({ age: true }))).toBe(2);
  });
});

describe("riskLevelFromScore", () => {
  it("0 ball — 'low'", () => {
    expect(riskLevelFromScore(0)).toBe("low");
  });

  it("25% dan kam — 'low'", () => {
    expect(riskLevelFromScore(2)).toBe("low"); // 2/12 ≈ 16.7%
  });

  it("25%-49% oralig'ida — 'medium'", () => {
    expect(riskLevelFromScore(3)).toBe("medium"); // 3/12 = 25%
  });

  it("50%+ — 'high'", () => {
    expect(riskLevelFromScore(6)).toBe("high"); // 6/12 = 50%
    expect(riskLevelFromScore(12)).toBe("high"); // 100%
  });
});
