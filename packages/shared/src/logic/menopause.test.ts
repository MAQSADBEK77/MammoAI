import { describe, expect, it } from "vitest";
import {
  MRS_ITEMS,
  isPostmenopausalBleeding,
  resolveMenopauseStage,
  scoreMrs,
  shouldSeeDoctorForMenopause,
  shouldSuggestMenopauseMode,
} from "./menopause";

describe("resolveMenopauseStage", () => {
  it("12 oy hayzsiz — menopauza", () => {
    expect(resolveMenopauseStage({ age: 52, monthsSinceLastPeriod: 12, cyclesIrregular: false })).toBe("menopause");
    expect(resolveMenopauseStage({ age: 52, monthsSinceLastPeriod: 11, cyclesIrregular: false })).not.toBe("menopause");
  });

  it("menopauzadan olti yil o'tgach — postmenopauza", () => {
    expect(resolveMenopauseStage({ age: 58, monthsSinceLastPeriod: 80, cyclesIrregular: false })).toBe("postmenopause");
  });

  it("yoshning O'ZI yetarli emas: 45 da muntazam sikl bo'lishi mumkin", () => {
    // Lekin 45 dan keyin sikl o'zgarishi shunchalik keng tarqalganki,
    // rejimni taklif qilish o'rinli — majburlash emas.
    expect(resolveMenopauseStage({ age: 46, monthsSinceLastPeriod: 1, cyclesIrregular: false })).toBe("perimenopause");
    expect(resolveMenopauseStage({ age: 30, monthsSinceLastPeriod: 1, cyclesIrregular: false })).toBe("premenopause");
  });

  it("erta menopauza ham ushlanadi — yosh kichik bo'lsa ham", () => {
    // 38 yoshda 12 oy hayzsiz — bu yoshga qaramay menopauza.
    expect(resolveMenopauseStage({ age: 38, monthsSinceLastPeriod: 14, cyclesIrregular: true })).toBe("menopause");
  });

  it("40+ va tartibsiz sikl — perimenopauza", () => {
    expect(resolveMenopauseStage({ age: 41, monthsSinceLastPeriod: 2, cyclesIrregular: true })).toBe("perimenopause");
    expect(resolveMenopauseStage({ age: 32, monthsSinceLastPeriod: 2, cyclesIrregular: true })).toBe("premenopause");
  });

  it("rejim faqat tegishli bosqichlarda taklif qilinadi", () => {
    expect(shouldSuggestMenopauseMode({ age: 47, monthsSinceLastPeriod: 2, cyclesIrregular: false })).toBe(true);
    expect(shouldSuggestMenopauseMode({ age: 28, monthsSinceLastPeriod: 1, cyclesIrregular: false })).toBe(false);
  });
});

describe("scoreMrs", () => {
  it("11 ta savol, uch domen", () => {
    expect(MRS_ITEMS).toHaveLength(11);
    expect(new Set(MRS_ITEMS.map((i) => i.domain))).toEqual(new Set(["somatic", "psychological", "urogenital"]));
  });

  it("og'irlik chegaralari MRS qo'llanmasi bo'yicha", () => {
    const all = (v: number) => Object.fromEntries(MRS_ITEMS.map((i) => [i.id, v]));
    expect(scoreMrs({}).severity).toBe("none");
    expect(scoreMrs({ hot_flashes: 4 }).severity).toBe("none"); // 4 ball
    expect(scoreMrs({ hot_flashes: 4, sleep_problems: 1 }).severity).toBe("mild"); // 5
    expect(scoreMrs({ hot_flashes: 4, sleep_problems: 4, anxiety: 1 }).severity).toBe("moderate"); // 9
    expect(scoreMrs(all(4)).severity).toBe("severe");
    expect(scoreMrs(all(4)).total).toBe(44);
  });

  it("domenlar bo'yicha ajratadi", () => {
    const r = scoreMrs({ hot_flashes: 3, anxiety: 2, vaginal_dryness: 4 });
    expect(r.byDomain).toEqual({ somatic: 3, psychological: 2, urogenital: 4 });
  });

  it("javob berilmagan savollarni sanaydi va noto'g'ri qiymatni cheklaydi", () => {
    const r = scoreMrs({ hot_flashes: 9, irritability: -2 });
    expect(r.total).toBe(4); // 4 + 0
    expect(r.unanswered).toBe(9);
  });

  it("o'rtacha va og'ir holatda shifokor tavsiya etiladi", () => {
    expect(shouldSeeDoctorForMenopause(scoreMrs({ hot_flashes: 1 }))).toBe(false);
    expect(shouldSeeDoctorForMenopause(scoreMrs({ hot_flashes: 4, sleep_problems: 4, anxiety: 1 }))).toBe(true);
  });
});

describe("isPostmenopausalBleeding", () => {
  it("menopauzadan keyingi qon ketish — har doim belgi", () => {
    // Bu bachadon saratonining eng erta belgisi. Ilovada u hech qachon
    // "normal" deb ko'rsatilmasligi kerak.
    expect(isPostmenopausalBleeding("menopause", true)).toBe(true);
    expect(isPostmenopausalBleeding("postmenopause", true)).toBe(true);
  });

  it("perimenopauzada qon ketish kutilgan narsa", () => {
    expect(isPostmenopausalBleeding("perimenopause", true)).toBe(false);
    expect(isPostmenopausalBleeding("menopause", false)).toBe(false);
  });
});
