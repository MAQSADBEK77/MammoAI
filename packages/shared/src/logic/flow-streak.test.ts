import { describe, expect, it } from "vitest";
import { lastFlowStreakStart } from "./flow-streak";

describe("lastFlowStreakStart", () => {
  it("qayd bo'lmasa null", () => {
    expect(lastFlowStreakStart([])).toBeNull();
    expect(lastFlowStreakStart([{ date: "2026-09-01", flow: null }])).toBeNull();
  });

  it("ketma-ket kunlarni bitta seriya deb oladi", () => {
    const logs = [
      { date: "2026-09-29", flow: "medium" },
      { date: "2026-09-30", flow: "light" },
      { date: "2026-10-01", flow: "light" },
    ];
    expect(lastFlowStreakStart(logs)).toBe("2026-09-29");
  });

  it("eski seriyani yangisiga qo'shib yubormaydi", () => {
    const logs = [
      { date: "2026-09-01", flow: "medium" },
      { date: "2026-09-02", flow: "medium" },
      { date: "2026-09-29", flow: "medium" },
    ];
    expect(lastFlowStreakStart(logs)).toBe("2026-09-29");
  });

  it("DOG'LANISH ham hisoblanadi", () => {
    // Butun tuzatishning sababi shu: dog'lanish sikl boshlanishi emas,
    // lekin ayol uni belgilagan — va shundan keyin ilova jim qolardi.
    expect(lastFlowStreakStart([{ date: "2026-09-29", flow: "spotting" }])).toBe("2026-09-29");
  });

  it("tartibsiz kelgan qaydlarda ham to'g'ri ishlaydi", () => {
    const logs = [
      { date: "2026-10-01", flow: "light" },
      { date: "2026-09-29", flow: "medium" },
      { date: "2026-09-30", flow: "medium" },
    ];
    expect(lastFlowStreakStart(logs)).toBe("2026-09-29");
  });
});
