import { describe, expect, it } from "vitest";
import {
  MRS_ITEMS,
  isPostmenopausalBleeding,
  resolveMenopauseStage,
  scoreMrs,
  shouldSeeDoctorForMenopause,
  shouldShowMenopauseSuggestion,
  shouldSuggestMenopauseMode,
  monthsSinceDate,
  MRS_TOTAL_MAX,
  MRS_DOMAIN_MAX,
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

describe("MENO-02 — rejimni taklif qilish konteksti", () => {
  const peri = { age: 48, monthsSinceLastPeriod: 2, cyclesIrregular: true };

  it("45+ va tartibsiz sikl — hayz rejimidagi ayolga taklif ko'rsatiladi", () => {
    expect(shouldShowMenopauseSuggestion({ ...peri, currentGoal: "cycle", dismissed: false })).toBe(true);
  });

  it("homilador yoki tayyorgarlik rejimida HECH QACHON taklif qilinmaydi", () => {
    expect(shouldShowMenopauseSuggestion({ ...peri, currentGoal: "pregnancy", dismissed: false })).toBe(false);
    expect(shouldShowMenopauseSuggestion({ ...peri, currentGoal: "planning_pregnancy", dismissed: false })).toBe(false);
  });

  it("hamkor rejimida ko'rsatilmaydi — ayolning o'zi emas, boshqa odam ko'radi", () => {
    expect(shouldShowMenopauseSuggestion({ ...peri, currentGoal: "partner_tracking", dismissed: false })).toBe(false);
  });

  it("allaqachon shu rejimda bo'lsa takrorlanmaydi", () => {
    expect(shouldShowMenopauseSuggestion({ ...peri, currentGoal: "perimenopause", dismissed: false })).toBe(false);
  });

  it("'hozir emas' deyilgan bo'lsa qayta so'ralmaydi", () => {
    expect(shouldShowMenopauseSuggestion({ ...peri, currentGoal: "cycle", dismissed: true })).toBe(false);
  });

  it("30 yoshli ayolga tartibsiz sikl bo'lsa ham taklif qilinmaydi", () => {
    expect(
      shouldShowMenopauseSuggestion({ age: 30, monthsSinceLastPeriod: 2, cyclesIrregular: true, currentGoal: "cycle", dismissed: false })
    ).toBe(false);
  });

  // Brauzer sinovida topilgan haqiqiy xato: test akkauntning oxirgi qayd
  // etilgan hayzi bir yildan eski edi va 22 yoshli foydalanuvchiga klimaks
  // rejimi taklif qilindi. Yosh ayolda bu amenoreya — boshqa holat.
  it("22 yoshda 14 oy hayzsizlik — bu klimaks EMAS, taklif chiqmaydi", () => {
    expect(
      shouldShowMenopauseSuggestion({ age: 22, monthsSinceLastPeriod: 14, cyclesIrregular: true, currentGoal: "cycle", dismissed: false })
    ).toBe(false);
  });

  it("yosh noma'lum bo'lsa taklif qilinmaydi — taxmin qilinmaydi", () => {
    expect(
      shouldShowMenopauseSuggestion({ age: null, monthsSinceLastPeriod: 14, cyclesIrregular: true, currentGoal: "cycle", dismissed: false })
    ).toBe(false);
  });

  it("41 yoshda 14 oy hayzsizlik — taklif o'rinli", () => {
    expect(
      shouldShowMenopauseSuggestion({ age: 41, monthsSinceLastPeriod: 14, cyclesIrregular: false, currentGoal: "cycle", dismissed: false })
    ).toBe(true);
  });
});

describe("monthsSinceDate — kalendar oylari", () => {
  it("aniq 12 oy o'tgan — menopauza chegarasi", () => {
    expect(monthsSinceDate("2025-01-15", "2026-01-15")).toBe(12);
  });

  it("bir kun yetmasa hali 11 oy — chegaradan tasodifan o'tib ketmaydi", () => {
    expect(monthsSinceDate("2025-01-15", "2026-01-14")).toBe(11);
  });

  it("sana yo'q bo'lsa null — '0 oy' deb taxmin qilish taklifni noto'g'ri bekor qilardi", () => {
    expect(monthsSinceDate(null, "2026-01-15")).toBeNull();
    expect(monthsSinceDate("", "2026-01-15")).toBeNull();
  });

  it("kelajakdagi sana manfiy emas, 0 qaytaradi", () => {
    expect(monthsSinceDate("2026-05-01", "2026-01-15")).toBe(0);
  });
});

describe("MRS maksimal ballari savollardan hisoblanadi", () => {
  it("jami 11 savol x 4 = 44", () => {
    expect(MRS_TOTAL_MAX).toBe(44);
  });

  it("domenlar bo'yicha: somatik 16, psixologik 16, urogenital 12", () => {
    expect(MRS_DOMAIN_MAX).toEqual({ somatic: 16, psychological: 16, urogenital: 12 });
  });

  it("domenlar yig'indisi umumiy maksimalga teng", () => {
    const sum = Object.values(MRS_DOMAIN_MAX).reduce((a, b) => a + b, 0);
    expect(sum).toBe(MRS_TOTAL_MAX);
  });
});
