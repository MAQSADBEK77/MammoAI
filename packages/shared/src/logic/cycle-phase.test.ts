import { describe, expect, it } from "vitest";
import { getCyclePhase, getFertilityLevel } from "./cycle-phase";

describe("getCyclePhase", () => {
  const CYCLE = 28;
  const PERIOD = 5;

  it("hayz kunlarini (1..periodLength) 'menstrual' deb belgilaydi", () => {
    expect(getCyclePhase(1, CYCLE, PERIOD)).toBe("menstrual");
    expect(getCyclePhase(5, CYCLE, PERIOD)).toBe("menstrual");
  });

  it("hayzdan keyin, ovulyatsiyadan oldingi kunlarni 'follicular' deb belgilaydi", () => {
    expect(getCyclePhase(6, CYCLE, PERIOD)).toBe("follicular");
    expect(getCyclePhase(12, CYCLE, PERIOD)).toBe("follicular");
  });

  it("ovulyatsiya oynasini (ovulationDay ±1) to'g'ri belgilaydi (28 kunlik sikl uchun 13-15)", () => {
    expect(getCyclePhase(13, CYCLE, PERIOD)).toBe("ovulation");
    expect(getCyclePhase(14, CYCLE, PERIOD)).toBe("ovulation");
    expect(getCyclePhase(15, CYCLE, PERIOD)).toBe("ovulation");
  });

  it("ovulyatsiyadan keyingi kunlarni 'luteal' deb belgilaydi", () => {
    expect(getCyclePhase(16, CYCLE, PERIOD)).toBe("luteal");
    expect(getCyclePhase(28, CYCLE, PERIOD)).toBe("luteal");
  });

  it("qisqaroq sikl uchun ham to'g'ri ishlaydi (21 kun, 4 kun hayz)", () => {
    // ovulationDay = 21 - 14 = 7, oyna 6-8
    expect(getCyclePhase(4, 21, 4)).toBe("menstrual");
    expect(getCyclePhase(5, 21, 4)).toBe("follicular");
    expect(getCyclePhase(7, 21, 4)).toBe("ovulation");
    expect(getCyclePhase(10, 21, 4)).toBe("luteal");
  });
});

describe("getFertilityLevel", () => {
  it("ovulyatsiya — yuqori unumdorlik", () => {
    expect(getFertilityLevel("ovulation")).toBe("high");
  });

  it("follikulyar — o'rta unumdorlik", () => {
    expect(getFertilityLevel("follicular")).toBe("medium");
  });

  it("hayz va luteal — past unumdorlik", () => {
    expect(getFertilityLevel("menstrual")).toBe("low");
    expect(getFertilityLevel("luteal")).toBe("low");
  });
});
