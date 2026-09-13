import { describe, expect, it } from "vitest";
import { tashkentDateStr } from "./date";

describe("tashkentDateStr", () => {
  // FIX2-16: server (Vercel Node) muhitida `TZ` o'rnatilmagan — bu funksiya
  // runtime sozlamasidan MUSTAQIL ravishda har doim Toshkent (UTC+5) mahalliy
  // sanasini qaytarishi kerak, oddiy `toISOString()` (UTC) emas.
  it("UTC kecha bo'lsa ham, Toshkentda ertalab bo'lgan sanani qaytaradi (UTC+5)", () => {
    // 2026-01-14 20:00 UTC = 2026-01-15 01:00 Toshkentda (UTC+5) — UTC hali
    // "14"-sanada, lekin Toshkentda allaqachon "15".
    const d = new Date("2026-01-14T20:00:00Z");
    expect(tashkentDateStr(d)).toBe("2026-01-15");
  });

  it("UTC kunduzi ikkalasi ham bir xil sanada bo'lganda mos keladi", () => {
    const d = new Date("2026-01-15T10:00:00Z");
    expect(tashkentDateStr(d)).toBe("2026-01-15");
  });
});
