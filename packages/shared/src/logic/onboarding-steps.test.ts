import { describe, expect, it } from "vitest";
import { resolveRestoreStep } from "./onboarding-steps";

const CANONICAL = [
  "welcome",
  "language",
  "account_choice",
  "privacy",
  "name",
  "age",
  "goal",
  "notifications",
  "analyzing",
] as const;

type Step = (typeof CANONICAL)[number];

/** Telegram orqali kirgan ayol uchun ko'rsatiladigan qadamlar. */
const TELEGRAM_STEPS: Step[] = ["language", "privacy", "name", "age", "goal", "notifications", "analyzing"];

describe("resolveRestoreStep", () => {
  it("qadam mavjud bo'lsa — o'sha qadamning o'zi", () => {
    expect(resolveRestoreStep("name", TELEGRAM_STEPS, CANONICAL)).toBe("name");
  });

  it("Telegramdan qaytganda tilni QAYTA so'ramaydi", () => {
    // Aynan foydalanuvchi ko'rsatgan xato: saqlangan qadam
    // `account_choice`, u endi ko'rsatilmaydi — ilgari 0-indeksga,
    // ya'ni `language`ga qaytarardi.
    expect(resolveRestoreStep("account_choice", TELEGRAM_STEPS, CANONICAL)).toBe("privacy");
  });

  it("yo'qolgan qadamdan keyin bir nechta qadam ham yo'q bo'lsa — birinchi mavjudiga", () => {
    const short: Step[] = ["goal", "notifications", "analyzing"];
    expect(resolveRestoreStep("account_choice", short, CANONICAL)).toBe("goal");
  });

  it("qadam kanonik tartibda umuman bo'lmasa — null (joyida qolamiz)", () => {
    expect(resolveRestoreStep("phone_verify" as Step, TELEGRAM_STEPS, CANONICAL)).toBeNull();
  });

  it("oxirgi qadam yo'qolsa — null, oldinga borish joyi yo'q", () => {
    expect(resolveRestoreStep("analyzing", ["name"] as Step[], CANONICAL)).toBeNull();
  });
});
