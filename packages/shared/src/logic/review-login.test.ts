import { describe, expect, it } from "vitest";
import { parseReviewLoginCode } from "./review-login";

describe("parseReviewLoginCode", () => {
  it("6 xonali raqamli kodni qabul qiladi (bo'sh joylar olib tashlanadi)", () => {
    expect(parseReviewLoginCode("482913")).toBe("482913");
    expect(parseReviewLoginCode("  482913\n")).toBe("482913");
  });

  it("o'zgaruvchi yo'q yoki bo'sh bo'lsa — yo'l yopiq", () => {
    expect(parseReviewLoginCode(undefined)).toBeNull();
    expect(parseReviewLoginCode(null)).toBeNull();
    expect(parseReviewLoginCode("")).toBeNull();
  });

  it("kirish ekrani qabul qilmaydigan kodni rad etadi", () => {
    expect(parseReviewLoginCode("12345")).toBeNull();
    expect(parseReviewLoginCode("1234567")).toBeNull();
    expect(parseReviewLoginCode("12a456")).toBeNull();
  });
});
