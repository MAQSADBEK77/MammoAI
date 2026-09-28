import { describe, expect, it } from "vitest";
import { resolveNotificationsChoice } from "./notification-choice";

describe("resolveNotificationsChoice", () => {
  it("aniq rozilik — yoqiladi", () => {
    expect(resolveNotificationsChoice(true)).toBe(true);
  });

  it("aniq rad javobi — o'chiriladi", () => {
    expect(resolveNotificationsChoice(false)).toBe(false);
  });

  it("tanlanmagan holat eslatmani O'CHIRMAYDI", () => {
    // Bu testning butun mavjudlik sababi: ilgari bu yerda `!!null`
    // ishlatilgan va 119 ayol jimgina eslatmasiz qolgan.
    expect(resolveNotificationsChoice(null)).toBe(true);
    expect(resolveNotificationsChoice(undefined)).toBe(true);
  });
});
