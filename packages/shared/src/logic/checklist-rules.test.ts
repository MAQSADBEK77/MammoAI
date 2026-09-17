import { describe, expect, it } from "vitest";
import { generateChecklist, CHECKLIST_ITEM_IS_FREE, CHECKUP_CATEGORY, CHECKUP_OFFICIAL_TRACK, type ChecklistRuleInput } from "./checklist-rules";

const BASE: ChecklistRuleInput = {
  age: 25,
  familyHistory: false,
  isPregnant: false,
  cycleIrregular: false,
  sexuallyActive: false,
  pregnancyWeek: null,
  isPostpartum: false,
  isPerimenopause: false,
  isTryingToConceive: false,
};

function typesOf(input: Partial<ChecklistRuleInput>): string[] {
  return generateChecklist({ ...BASE, ...input }).map((i) => i.type);
}

describe("generateChecklist", () => {
  it("homilador bo'lsa, boshqa hamma narsadan qat'iy nazar FAQAT homiladorlik oqimi qaytadi (eski pregnancy_first_visit emas)", () => {
    const types = typesOf({ age: 25, familyHistory: true, isPregnant: true, cycleIrregular: true, pregnancyWeek: 12 });
    expect(types).toContain("prenatal_screening_stage1");
    expect(types).not.toContain("pregnancy_first_visit");
    expect(types).not.toContain("cycle_irregularity_followup"); // homiladorlik boshqasini bekor qiladi
  });

  it("18 yoshda, boshqa xavf omillari yo'q bo'lsa ham asosiy umumiy profilaktika bandlari chiqadi", () => {
    const types = typesOf({ age: 18 });
    expect(types).toContain("annual_preventive_exam");
    expect(types).toContain("flora_smear");
    expect(types).not.toContain("cervical_cancer_screening"); // sexuallyActive: false
  });

  // FIX3-06: spekulyum bilan INVAZIV ko'rik jinsiy faol BO'LMAGANLARGA
  // tavsiya qilinmasligi kerak (odatiy klinik amaliyot) — flora_smear esa
  // kamroq invaziv, jinsiy faollikdan qat'iy nazar davom etadi.
  it("pelvic_exam_speculum faqat jinsiy faol bo'lganda, flora_smear faollikdan qat'iy nazar chiqadi", () => {
    const active = typesOf({ age: 25, sexuallyActive: true });
    const inactive = typesOf({ age: 25, sexuallyActive: false });
    expect(active).toContain("pelvic_exam_speculum");
    expect(inactive).not.toContain("pelvic_exam_speculum");
    expect(active).toContain("flora_smear");
    expect(inactive).toContain("flora_smear");
  });

  it("eski (endi ishlab chiqarilmaydigan) turlar hech qachon qaytmaydi", () => {
    const types = typesOf({ age: 42 });
    expect(types).not.toContain("gyn_annual_checkup");
    expect(types).not.toContain("pap_test");
    expect(types).not.toContain("mammography_screening");
    expect(types).not.toContain("free_mammography_45");
  });

  it("jinsiy hayoti faol bo'lganda bachadon bo'yni skrininggi/JYYI/kontratseptsiya qo'shiladi, aks holda yo'q", () => {
    const active = typesOf({ age: 22, sexuallyActive: true });
    const inactive = typesOf({ age: 22, sexuallyActive: false });
    expect(active).toEqual(expect.arrayContaining(["cervical_cancer_screening", "sti_panel", "contraception_counseling"]));
    for (const t of ["cervical_cancer_screening", "sti_panel", "contraception_counseling"]) {
      expect(inactive).not.toContain(t);
    }
  });

  it("30+ yoshda oilaviy tarix bo'lsa mammografiya ERTA (40 emas, 30 yoshdan) boshlanadi", () => {
    const withHistory = typesOf({ age: 32, familyHistory: true });
    const withoutHistory = typesOf({ age: 32, familyHistory: false });
    expect(withHistory).toContain("breast_cancer_screening_mammography");
    expect(withoutHistory).not.toContain("breast_cancer_screening_mammography");
  });

  it("40+ yoshda oilaviy tarixsiz ham mammografiya skrininggi qo'shiladi", () => {
    expect(typesOf({ age: 45, familyHistory: false })).toContain("breast_cancer_screening_mammography");
  });

  it("homiladorlik skrininggi haftaga qarab to'g'ri bosqichlarni tanlaydi", () => {
    const early = typesOf({ isPregnant: true, pregnancyWeek: 12 });
    expect(early).toContain("prenatal_screening_stage1");
    expect(early).not.toContain("group_b_strep_screening"); // hali 35-haftaga yiroq, lekin oynada — tekshiramiz alohida

    const late = typesOf({ isPregnant: true, pregnancyWeek: 36 });
    expect(late).toContain("group_b_strep_screening");
    expect(late).not.toContain("prenatal_screening_stage1"); // 14-haftadan o'tgan
  });

  it("tug'ruqdan keyingi oynada postpartum_home_visit qo'shiladi", () => {
    expect(typesOf({ isPostpartum: true })).toContain("postpartum_home_visit");
  });

  it("perimenopauza maqsadi + 45+ yoshda menopause_checkup qo'shiladi", () => {
    const types = typesOf({ age: 50, isPerimenopause: true });
    expect(types).toContain("menopause_checkup");
    expect(typesOf({ age: 50, isPerimenopause: false })).not.toContain("menopause_checkup");
  });

  // WEB3-05: 45-49 yoshli, isPerimenopause=true foydalanuvchi menopause_checkup
  // OLADI (yuqoridagi test) — shuning uchun 15-49 filialidan annual_preventive_exam
  // takror qo'shilmasligi kerak (ikkalasi ham umumiy konsultatsiya turi).
  it("45-49 yoshda, perimenopauza maqsadi tanlangan bo'lsa, annual_preventive_exam takrorlanmaydi", () => {
    const types = typesOf({ age: 47, isPerimenopause: true });
    expect(types).toContain("menopause_checkup");
    expect(types).not.toContain("annual_preventive_exam");
  });

  // FIX3-03: annual_preventive_exam 49 yoshda tugaydi, menopause_checkup esa
  // faqat perimenopauza MAQSADIGA bog'liq — 50+ yoshli, lekin boshqa maqsad
  // tanlagan foydalanuvchi umuman umumiy konsultatsiya bandisiz qolmasligi kerak.
  it("50+ yoshda, perimenopauza maqsadi tanlanmagan bo'lsa ham, umumiy konsultatsiya bandi bor", () => {
    const types = typesOf({ age: 55, isPerimenopause: false });
    expect(types).toContain("annual_preventive_exam");
  });

  it("homiladorlikni rejalashtirayotganda preconception_checkup va torch_panel qo'shiladi", () => {
    const types = typesOf({ age: 28, isTryingToConceive: true, sexuallyActive: true });
    expect(types).toContain("preconception_checkup");
    expect(types).toContain("torch_panel");
  });

  it("tsikl tartibsiz bo'lsa, kuzatuv bandi qo'shiladi (o'zgarishsiz eski mantiq)", () => {
    expect(typesOf({ cycleIrregular: true })).toContain("cycle_irregularity_followup");
  });

  it("davriy (yillik) bandlar recurrenceDays bilan, bir martalik bandlar recurrenceDays'siz qaytadi", () => {
    const items = generateChecklist({ ...BASE, age: 25, sexuallyActive: true });
    const annual = items.find((i) => i.type === "annual_preventive_exam");
    const hpv = items.find((i) => i.type === "hpv_vaccination");
    expect(annual?.recurrenceDays).toBe(365);
    expect(hpv?.recurrenceDays).toBeUndefined();
  });

  // WEB3-04: pregnancy_patronage_visit'ning maqsad sanasi 12-haftada
  // windowStart (12) dan windowEnd (32)ga "sakramasligi" kerak — 11-hafta
  // (oynadan oldin, hali kutilmoqda) va 12-31 hafta (oyna ichida, "hozir
  // kerak") uzluksiz bo'lishi kerak.
  it("pregnancy_patronage_visit maqsad sanasi 12-haftada sakramaydi (windowStart'da barqaror)", () => {
    const week11 = generateChecklist({ ...BASE, isPregnant: true, pregnancyWeek: 11 }).find((i) => i.type === "pregnancy_patronage_visit");
    const week12 = generateChecklist({ ...BASE, isPregnant: true, pregnancyWeek: 12 }).find((i) => i.type === "pregnancy_patronage_visit");
    const week20 = generateChecklist({ ...BASE, isPregnant: true, pregnancyWeek: 20 }).find((i) => i.type === "pregnancy_patronage_visit");
    const week31 = generateChecklist({ ...BASE, isPregnant: true, pregnancyWeek: 31 }).find((i) => i.type === "pregnancy_patronage_visit");
    expect(week11?.dueInDays).toBe(7); // 12-haftagacha 1 hafta qoldi
    expect(week12?.dueInDays).toBe(0); // oyna boshlandi — "hozir kerak"
    expect(week20?.dueInDays).toBe(0); // oyna ichida — hamon "hozir kerak", 140ga sakramaydi
    expect(week31?.dueInDays).toBe(0); // oyna oxirigacha ham barqaror
  });
});

describe("CHECKLIST_ITEM_IS_FREE / CHECKUP_CATEGORY", () => {
  it("har bir checklist turi uchun aniq belgilangan (undefined yo'q)", () => {
    for (const value of Object.values(CHECKLIST_ITEM_IS_FREE)) {
      expect(typeof value).toBe("boolean");
    }
    for (const value of Object.values(CHECKUP_CATEGORY)) {
      expect(typeof value).toBe("string");
    }
  });

  it("dual-track bandlar uchun rasmiy dastur ma'lumoti mavjud", () => {
    expect(CHECKUP_OFFICIAL_TRACK.cervical_cancer_screening).toEqual({ minAge: 35, maxAge: 55, frequency: "every_3_years" });
    expect(CHECKUP_OFFICIAL_TRACK.breast_cancer_screening_mammography).toBeDefined();
  });
});
