import { describe, expect, it } from "vitest";
import { canUseFeature, isRegisteredUser } from "./registration";

describe("isRegisteredUser", () => {
  it("telefon yoki Telegram bo'lsa — ro'yxatdan o'tgan", () => {
    expect(isRegisteredUser({ phone: "+998901234567" })).toBe(true);
    expect(isRegisteredUser({ telegramUserId: "12345" })).toBe(true);
  });

  it("ikkalasi ham yo'q bo'lsa — anonim", () => {
    expect(isRegisteredUser({ phone: null, telegramUserId: null })).toBe(false);
    expect(isRegisteredUser(null)).toBe(false);
    expect(isRegisteredUser(undefined)).toBe(false);
  });
});

describe("canUseFeature", () => {
  const anon = { phone: null, telegramUserId: null };
  const registered = { phone: "+996555123456" };

  it("asosiy funksiyalar anonim rejimda ham ochiq", () => {
    // Bu testning maqsadi — kelajakda kimdir tasodifan sikl kuzatuvini
    // hisob ortiga yashirib qo'ymasligi.
    for (const f of ["cycle", "calendar", "articles", "checkups", "pregnancy", "clinics", "food"]) {
      expect(canUseFeature(f, anon)).toBe(true);
    }
  });

  it("AI yordamchi, jamiyatga yozish va eslatmalar hisob talab qiladi", () => {
    for (const f of ["ai-chat", "community-post", "reminders", "partner", "doctor-report"]) {
      expect(canUseFeature(f, anon)).toBe(false);
      expect(canUseFeature(f, registered)).toBe(true);
    }
  });
});
