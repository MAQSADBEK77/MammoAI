import { describe, expect, it } from "vitest";
import { extractUzPhoneDigits } from "./phone";

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
