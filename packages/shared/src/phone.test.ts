import { describe, expect, it } from "vitest";
import {
  extractPhoneDigits,
  extractUzPhoneDigits,
  formatPhoneInput,
  formatUzPhoneInput,
  normalizeKnownPhone,
  phoneCountryByCode,
  phoneCountryOfNumber,
} from "./phone";

describe("extractUzPhoneDigits", () => {
  it("FIX-05: turli formatdagi bir xil raqamni bir xil kanonik qatorga keltiradi", () => {
    // Bu tenglik regressiyaning o'zi — findUserByIdentifier/createUserWithIdentifier
    // shu funksiya orqali normalizatsiya qilingan qiymatga tayanadi
    // (apps/web/src/app/api/auth/phone-code/{start,verify}/route.ts).
    expect(extractUzPhoneDigits("+998 90 123 45 67")).toBe("+998901234567");
    expect(extractUzPhoneDigits("998901234567")).toBe("+998901234567");
    expect(extractUzPhoneDigits("90-123-45-67")).toBe("+998901234567");
    expect(extractUzPhoneDigits("+998901234567")).toBe("+998901234567");
  });

  it("to'liq bo'lmagan yoki noto'g'ri raqam uchun null qaytaradi", () => {
    expect(extractUzPhoneDigits("+998 90 123")).toBeNull();
    expect(extractUzPhoneDigits("")).toBeNull();
    expect(extractUzPhoneDigits("abc")).toBeNull();
  });
});

describe("PHONE-02 — Qirg'iziston va boshqa mamlakatlar", () => {
  const KG = phoneCountryByCode("KG");

  it("qirg'iz raqamini formatlaydi", () => {
    expect(formatPhoneInput("555123456", KG)).toBe("+996 55 512 34 56");
    expect(formatPhoneInput("+996555123456", KG)).toBe("+996 55 512 34 56");
  });

  it("qirg'iz raqamini E.164 ga o'giradi", () => {
    expect(extractPhoneDigits("+996 55 512 34 56", KG)).toBe("+996555123456");
    expect(extractPhoneDigits("+996 55 512", KG)).toBeNull();
  });

  it("prefiks ikki marta yozilsa ham bir marta hisoblanadi", () => {
    // Foydalanuvchi ko'pincha raqamni prefiksi bilan joylashtiradi.
    expect(formatPhoneInput("996996555123", KG)).toBe("+996 99 655 51 23");
  });

  it("raqamning o'zidan mamlakatni aniqlaydi", () => {
    expect(phoneCountryOfNumber("+998901234567")?.code).toBe("UZ");
    expect(phoneCountryOfNumber("+996555123456")?.code).toBe("KG");
    expect(phoneCountryOfNumber("+79161234567")).toBeNull();
  });

  it("server mijoz tanloviga ishonmaydi: faqat ma'lum kodlar", () => {
    expect(normalizeKnownPhone("+998 90 123 45 67")).toBe("+998901234567");
    expect(normalizeKnownPhone("996555123456")).toBe("+996555123456");
    expect(normalizeKnownPhone("+79161234567")).toBeNull();
    expect(normalizeKnownPhone("+99890123")).toBeNull();
    expect(normalizeKnownPhone(null)).toBeNull();
  });

  it("eski funksiyalar o'zgarishsiz ishlaydi", () => {
    expect(formatUzPhoneInput("901234567")).toBe("+998 90 123 45 67");
    expect(extractUzPhoneDigits("+998 90 123 45 67")).toBe("+998901234567");
  });
});
