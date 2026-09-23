import { describe, expect, it } from "vitest";
import { buildDoctorReport, type DoctorReportInput } from "./doctor-report";
import type { ChecklistItem, CycleLog } from "../types";

function log(date: string, extra: Partial<CycleLog> = {}): CycleLog {
  return { id: date, userId: "u", date, flow: null, mood: null, symptoms: [], ...extra } as CycleLog;
}

function item(type: string, status: ChecklistItem["status"]): ChecklistItem {
  return {
    id: type,
    userId: "u",
    type: type as ChecklistItem["type"],
    status,
    dueDate: "2026-09-01",
    completedAt: status === "done" ? "2026-09-02" : null,
    createdAt: "2026-08-01",
    isFree: true,
  };
}

const base: DoctorReportInput = { today: "2026-09-23", profile: null, logs: [], checklist: [], summary: null };

describe("buildDoctorReport", () => {
  it("yozuvlar bo'lmasa ham yiqilmaydi va bo'sh hisobot qaytaradi", () => {
    const r = buildDoctorReport(base);
    expect(r.lastPeriodStart).toBeNull();
    expect(r.cyclesObserved).toBe(0);
    expect(r.periodCovered).toBeNull();
    // Ma'lumot yo'q — bu ham OGOHLANTIRISH holati, aks holda shifokor
    // bo'sh hisobotni "hammasi joyida" deb o'qishi mumkin.
    expect(r.hasLimitedData).toBe(true);
  });

  it("oxirgi hayz boshlanishini topadi — shifokorning birinchi savoli", () => {
    const logs = [log("2026-07-01", { flow: "medium" }), log("2026-07-29", { flow: "medium" }), log("2026-08-26", { flow: "medium" })];
    expect(buildDoctorReport({ ...base, logs }).lastPeriodStart).toBe("2026-08-26");
  });

  it("sikl uzunliklari va eng qisqa/uzunini hisoblaydi", () => {
    const logs = [log("2026-06-01", { flow: "medium" }), log("2026-07-01", { flow: "medium" }), log("2026-07-26", { flow: "medium" })];
    const r = buildDoctorReport({ ...base, logs });
    expect(r.cycleLengths).toEqual([30, 25]);
    expect(r.shortestCycle).toBe(25);
    expect(r.longestCycle).toBe(30);
    expect(r.averageCycleLength).toBe(28);
  });

  it("simptomlarni ALOHIDA kunlar bo'yicha sanab, eng ko'plarini oldinga qo'yadi", () => {
    const logs = [
      log("2026-09-01", { symptoms: ["cramps", "headache"] }),
      log("2026-09-02", { symptoms: ["cramps"] }),
      log("2026-09-03", { symptoms: ["cramps", "bloating"] }),
    ];
    const r = buildDoctorReport({ ...base, logs });
    expect(r.topSymptoms[0]).toEqual({ symptom: "cramps", days: 3 });
    expect(r.topSymptoms).toHaveLength(3);
  });

  it("muddati o'tgan tekshiruvlarni alohida ajratadi — suhbat shulardan boshlanadi", () => {
    const checklist = [item("pap_test", "overdue"), item("gyn_annual_checkup", "done"), item("flora_smear", "pending")];
    const r = buildDoctorReport({ ...base, checklist });
    expect(r.overdueCheckups.map((c) => c.type)).toEqual(["pap_test"]);
    expect(r.completedCheckups.map((c) => c.type)).toEqual(["gyn_annual_checkup"]);
  });

  it("3 tadan kam sikl kuzatilgan bo'lsa ma'lumot kamligini belgilaydi", () => {
    const few = [log("2026-08-01", { flow: "medium" }), log("2026-08-29", { flow: "medium" })];
    expect(buildDoctorReport({ ...base, logs: few }).hasLimitedData).toBe(true);

    const enough = [
      log("2026-06-01", { flow: "medium" }),
      log("2026-06-29", { flow: "medium" }),
      log("2026-07-27", { flow: "medium" }),
      log("2026-08-24", { flow: "medium" }),
    ];
    expect(buildDoctorReport({ ...base, logs: enough }).hasLimitedData).toBe(false);
  });

  it("qamragan davrni yozuvlarning eng eski va eng yangisidan oladi", () => {
    const logs = [log("2026-09-10"), log("2026-07-05"), log("2026-08-20")];
    expect(buildDoctorReport({ ...base, logs }).periodCovered).toEqual({ from: "2026-07-05", to: "2026-09-10" });
  });
});
