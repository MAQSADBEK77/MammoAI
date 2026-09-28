import { describe, expect, it } from "vitest";
import { EMERGENCY_NUMBER, WARNING_SIGNS, warningSignsByAction } from "./warning-signs";

describe("warningSignsByAction", () => {
  it("eng shoshilinchi birinchi turadi", () => {
    const groups = warningSignsByAction();
    expect(groups.map(([a]) => a)).toEqual(["emergency", "maternity", "today"]);
  });

  it("bitta ham belgi yo'qolmaydi", () => {
    const total = warningSignsByAction().reduce((sum, [, items]) => sum + items.length, 0);
    expect(total).toBe(WARNING_SIGNS.length);
  });

  it("bo'sh guruh qaytarilmaydi", () => {
    const only = warningSignsByAction([{ id: "heavy_bleeding", action: "emergency" }]);
    expect(only).toHaveLength(1);
    expect(only[0][0]).toBe("emergency");
  });
});

describe("ro'yxat yaxlitligi", () => {
  it("id'lar takrorlanmaydi", () => {
    const ids = WARNING_SIGNS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("hayotga xavfli belgilar 'tez yordam' darajasida qoladi", () => {
    // QO'RIQCHI: bu qatorlarning tasodifan pasaytirilishi jiddiy.
    const emergency = new Set(WARNING_SIGNS.filter((s) => s.action === "emergency").map((s) => s.id));
    for (const id of ["heavy_bleeding", "seizure", "fainting"]) {
      expect(emergency.has(id)).toBe(true);
    }
  });

  it("homila harakatining kamayishi kutishga qoldirilmaydi", () => {
    const sign = WARNING_SIGNS.find((s) => s.id === "reduced_movement");
    expect(sign?.action).toBe("maternity");
  });

  it("tez yordam raqami 103", () => {
    expect(EMERGENCY_NUMBER).toBe("103");
  });
});
