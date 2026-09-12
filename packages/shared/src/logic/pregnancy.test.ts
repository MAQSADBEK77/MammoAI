import { describe, expect, it } from "vitest";
import {
  dueDateFromLmp,
  lmpFromDueDate,
  getPregnancyStatus,
  getMilestoneForWeek,
  getEmbryoImageWeek,
  getVitalTone,
} from "./pregnancy";

describe("dueDateFromLmp / lmpFromDueDate", () => {
  it("280 kunlik standart qoidani qo'llaydi (o'zaro teskari)", () => {
    const due = dueDateFromLmp("2026-01-01");
    expect(due).toBe("2026-10-08");
    expect(lmpFromDueDate(due)).toBe("2026-01-01");
  });
});

describe("getPregnancyStatus", () => {
  it("LMP va due date ikkalasi ham bo'lmasa null qaytaradi", () => {
    expect(getPregnancyStatus({ lastMenstrualPeriod: null, dueDate: null })).toBeNull();
  });

  it("faqat dueDate berilsa, LMP shundan hisoblab olinadi", () => {
    const status = getPregnancyStatus({ lastMenstrualPeriod: null, dueDate: "2026-10-08" }, "2026-01-01");
    expect(status?.lastMenstrualPeriod).toBe("2026-01-01");
    expect(status?.currentWeek).toBe(1);
  });

  it("1-hafta va 1-trimestrni to'g'ri hisoblaydi", () => {
    const status = getPregnancyStatus({ lastMenstrualPeriod: "2026-01-01", dueDate: null }, "2026-01-01");
    expect(status?.currentWeek).toBe(1);
    expect(status?.currentDay).toBe(0);
    expect(status?.trimester).toBe(1);
  });

  it("14-haftada 2-trimestrga o'tadi", () => {
    const status = getPregnancyStatus({ lastMenstrualPeriod: "2026-01-01", dueDate: null }, "2026-04-02"); // ~13 hafta 1 kun keyin
    expect(status?.trimester).toBe(2);
  });

  it("28-haftada 3-trimestrga o'tadi", () => {
    const status = getPregnancyStatus({ lastMenstrualPeriod: "2026-01-01", dueDate: null }, "2026-07-16");
    expect(status?.trimester).toBe(3);
  });

  it("42-haftadan oshmaydi (yuqori chegara)", () => {
    const status = getPregnancyStatus({ lastMenstrualPeriod: "2026-01-01", dueDate: null }, "2027-01-01");
    expect(status?.currentWeek).toBe(42);
  });
});

describe("getMilestoneForWeek", () => {
  it("har bir hafta uchun bosqichni topadi (chegaradan tashqariga chiqmaydi)", () => {
    expect(getMilestoneForWeek(1).sizeComparisonKey).toBe("size.poppySeed");
    expect(getMilestoneForWeek(40).sizeComparisonKey).toBe("size.watermelon");
    expect(getMilestoneForWeek(100).sizeComparisonKey).toBe("size.watermelon"); // chegaradan tashqari — oxirgisiga tushadi
  });
});

describe("getEmbryoImageWeek", () => {
  it("mavjud haftalar uchun aynan o'sha haftani qaytaradi", () => {
    expect(getEmbryoImageWeek(1)).toBe(1);
    expect(getEmbryoImageWeek(20)).toBe(20);
    expect(getEmbryoImageWeek(42)).toBe(42);
  });

  it("to'plamda yo'q 2-hafta uchun eng yaqiniga (1) tushadi", () => {
    expect(getEmbryoImageWeek(2)).toBe(1);
  });

  it("1-42 chegarasidan tashqarini qisqartiradi", () => {
    expect(getEmbryoImageWeek(0)).toBe(1);
    expect(getEmbryoImageWeek(-5)).toBe(1);
    expect(getEmbryoImageWeek(50)).toBe(42);
  });

  it("kasr sonni yaqin butun songa yaxlitlaydi", () => {
    expect(getEmbryoImageWeek(19.6)).toBe(20);
  });
});

describe("getVitalTone", () => {
  it("vazn uchun har doim null (tone emas, delta ko'rsatiladi)", () => {
    expect(getVitalTone("weight", "60")).toBeNull();
  });

  it("yurak urishi normal oraliqda (60-100) 'normal' beradi", () => {
    expect(getVitalTone("heart_rate", "75")).toBe("normal");
    expect(getVitalTone("heart_rate", "45")).toBe("attention");
    expect(getVitalTone("heart_rate", "120")).toBe("attention");
  });

  it("harorat normal oraliqda (36.1-37.2) 'normal' beradi", () => {
    expect(getVitalTone("temperature", "36.6")).toBe("normal");
    expect(getVitalTone("temperature", "38.5")).toBe("attention");
  });

  it("qon bosimi to'g'ri formatda va oraliqda bo'lsa 'normal' beradi", () => {
    expect(getVitalTone("blood_pressure", "115/75")).toBe("normal");
    expect(getVitalTone("blood_pressure", "160/100")).toBe("attention");
    expect(getVitalTone("blood_pressure", "noto'g'ri-format")).toBeNull();
  });
});
