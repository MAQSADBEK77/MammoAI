import { describe, expect, it } from "vitest";
import {
  dueDateFromLmp,
  lmpFromDueDate,
  getPregnancyStatus,
  resolvePregnancyState,
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

describe("resolvePregnancyState — PREG-STATE-01", () => {
  // Kalkulyator kiritmasi: LMP bugundan 60 kun oldin → ~9-hafta.
  const calculatorInput = { lastMenstrualPeriod: "2026-07-25", dueDate: "2027-05-01" };
  const today = "2026-09-23";

  it("kalkulyator to'ldirilgan, lekin ayol o'zini homilador deb belgilamagan — homilador EMAS", () => {
    const state = resolvePregnancyState({ declaredPregnant: false, profile: calculatorInput }, today);
    expect(state.isPregnant).toBe(false);
    expect(state.status).toBeNull();
  });

  it("ayol o'zini homilador deb belgilagan — hafta hisoblanadi", () => {
    const state = resolvePregnancyState({ declaredPregnant: true, profile: calculatorInput }, today);
    expect(state.isPregnant).toBe(true);
    expect(state.status?.currentWeek).toBe(9);
  });

  it("belgilagan, lekin kalkulyator bo'sh — homilador, ammo hafta noma'lum", () => {
    const state = resolvePregnancyState({ declaredPregnant: true, profile: null }, today);
    expect(state.isPregnant).toBe(true);
    expect(state.status).toBeNull();
  });

  it("tug'ruqdan keyingi davr belgidan QAT'I NAZAR aniqlanadi", () => {
    // Taxminiy sana 30 kun oldin o'tgan — sabr oynasidan (14) keyin,
    // 42 kunlik oyna ichida. Ayol rejimini almashtirgan bo'lsa ham
    // tug'ruqdan keyingi tekshiruvlar kerak bo'lib qolaveradi.
    const afterBirth = { lastMenstrualPeriod: null, dueDate: "2026-08-24" };
    const state = resolvePregnancyState({ declaredPregnant: false, profile: afterBirth }, today);
    expect(state.isPostpartum).toBe(true);
    expect(state.daysSinceDue).toBe(30);
    expect(state.isPregnant).toBe(false);
  });

  it("tug'ruqdan keyingi davrda 'homilador' bayrog'i o'chadi", () => {
    const afterBirth = { lastMenstrualPeriod: null, dueDate: "2026-08-24" };
    const state = resolvePregnancyState({ declaredPregnant: true, profile: afterBirth }, today);
    expect(state.isPostpartum).toBe(true);
    expect(state.isPregnant).toBe(false);
  });

  it("taxminiy sanadan keyingi sabr oynasida hali homilador hisoblanadi", () => {
    // 10 kun o'tgan — GRACE (14) ichida, hali tug'ruq bo'lmagan bo'lishi mumkin.
    const state = resolvePregnancyState({ declaredPregnant: true, profile: { lastMenstrualPeriod: null, dueDate: "2026-09-13" } }, today);
    expect(state.isPostpartum).toBe(false);
    expect(state.isPregnant).toBe(true);
  });

  it("hech qanday ma'lumot yo'q — hech narsa taxmin qilinmaydi", () => {
    const state = resolvePregnancyState({ declaredPregnant: false, profile: null }, today);
    expect(state).toEqual({ isPregnant: false, isPostpartum: false, daysSinceDue: null, status: null });
  });
});

describe("resolvePregnancyState — PREG-END-01: ayolning o'z gapi", () => {
  const profile = { lastMenstrualPeriod: "2026-01-01", dueDate: "2026-10-08" };

  it("homiladorlik to'xtagan bo'lsa hech qanday hafta ko'rsatilmaydi", () => {
    // Ilgari ilova taxminiy sanadan 14 kun o'tgunga qadar
    // "bolangiz endi bodring kattaligida" deb yozishda davom etardi.
    const s = resolvePregnancyState({ declaredPregnant: true, profile, outcome: "loss", endedOn: "2026-06-01" }, "2026-06-20");
    expect(s.isPregnant).toBe(false);
    expect(s.status).toBe(null);
  });

  it("to'xtaganda tug'ruqdan keyingi bandlar ham ochilmaydi", () => {
    // Chaqaloq ko'rigi va emizish eslatmasi bu holatda zarar keltiradi.
    const s = resolvePregnancyState({ declaredPregnant: true, profile, outcome: "loss", endedOn: "2026-06-01" }, "2026-10-20");
    expect(s.isPostpartum).toBe(false);
  });

  it("tug'ruqdan keyingi oyna HAQIQIY sanadan hisoblanadi", () => {
    // Muddatidan oldin tug'gan ayol: taxminiy sana 8-oktabr, haqiqiy 10-sentabr.
    const born = { declaredPregnant: true, profile, outcome: "birth" as const, endedOn: "2026-09-10" };
    expect(resolvePregnancyState(born, "2026-09-11").isPostpartum).toBe(true);
    expect(resolvePregnancyState(born, "2026-10-20").isPostpartum).toBe(true); // 40-kun
    expect(resolvePregnancyState(born, "2026-10-25").isPostpartum).toBe(false); // 45-kun
  });

  it("tug'gandan keyin homiladorlik holati darhol tugaydi", () => {
    const s = resolvePregnancyState(
      { declaredPregnant: true, profile, outcome: "birth", endedOn: "2026-09-10" },
      "2026-09-11"
    );
    expect(s.isPregnant).toBe(false);
    expect(s.status).toBe(null);
  });

  it("natija aytilmagan bo'lsa eski xatti-harakat saqlanadi", () => {
    const s = resolvePregnancyState({ declaredPregnant: true, profile }, "2026-06-20");
    expect(s.isPregnant).toBe(true);
    expect(s.status?.currentWeek).toBeGreaterThan(0);
  });
});
