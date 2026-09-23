import { describe, expect, it } from "vitest";
import { generateChecklist, CHECKLIST_ITEM_IS_FREE, CHECKUP_CATEGORY, CHECKUP_OFFICIAL_TRACK, CHECKUP_SOURCE, type ChecklistRuleInput } from "./checklist-rules";

const BASE: ChecklistRuleInput = {
  age: 25,
  familyHistory: false,
  isPregnant: false,
  cycleIrregular: false,
  sexuallyActive: false,
  pregnancyWeek: null,
  isPostpartum: false,
  daysSinceDue: null,
  isPerimenopause: false,
  isTryingToConceive: false,
  lastCheckup: "recent",
  healthConditions: [],
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

describe("CHECKUP-02: rasmiy manbalar bilan qo'shilgan bandlar", () => {
  const types = (input: Partial<ChecklistRuleInput>) =>
    generateChecklist({ ...BASE, ...input }).map((i) => i.type);

  it("gestatsion diabet skrininggi 24-28 hafta oynasida chiqadi", () => {
    // Milliy klinik protokol: "Гестационный сахарный диабет" (uzaig.uz).
    expect(types({ isPregnant: true, pregnancyWeek: 25 })).toContain("gestational_diabetes_screening");
    // Oynadan ancha oldin (lookahead 6 hafta) — hali chiqmaydi.
    expect(types({ isPregnant: true, pregnancyWeek: 10 })).not.toContain("gestational_diabetes_screening");
    // Oyna o'tib ketgan.
    expect(types({ isPregnant: true, pregnancyWeek: 34 })).not.toContain("gestational_diabetes_screening");
  });

  it("tug'ruqdan keyingi bandlar ANIQ kunga rejalashtiriladi", () => {
    // 20-kun: 6-haftalik tekshiruvgacha 22 kun, depressiya skriningigacha 10.
    const items = generateChecklist({ ...BASE, isPostpartum: true, daysSinceDue: 20 });
    expect(items.find((i) => i.type === "postpartum_6week_checkup")?.dueInDays).toBe(22);
    expect(items.find((i) => i.type === "postpartum_depression_screening")?.dueInDays).toBe(10);
  });

  it("kun o'tib ketgan bo'lsa muddat manfiy emas, 0 bo'ladi", () => {
    const items = generateChecklist({ ...BASE, isPostpartum: true, daysSinceDue: 50 });
    expect(items.find((i) => i.type === "postpartum_6week_checkup")?.dueInDays).toBe(0);
  });

  it("qizamiqcha immuniteti FAQAT homiladorlikni rejalashtirishda", () => {
    // Vaktsina homilador bo'lgach qilib bo'lmaydi — shuning uchun bu band
    // ATAYLAB faqat oldingi bosqichda turadi.
    expect(types({ isTryingToConceive: true })).toContain("rubella_immunity_check");
    expect(types({ isPregnant: true, pregnancyWeek: 8 })).not.toContain("rubella_immunity_check");
    expect(types({})).not.toContain("rubella_immunity_check");
  });

  it("qalqonsimon bez tahlili — rejalashtirishda (25+) va perimenopauzada", () => {
    expect(types({ isTryingToConceive: true, age: 30 })).toContain("thyroid_function_test");
    expect(types({ isTryingToConceive: true, age: 22 })).not.toContain("thyroid_function_test");
    expect(types({ isPerimenopause: true, age: 48 })).toContain("thyroid_function_test");
    // Oddiy profilaktikada emas — har yili hammaga TSH ortiqcha skrining bo'lardi.
    expect(types({ age: 30 })).not.toContain("thyroid_function_test");
  });

  it("yo'g'on ichak skrininggi 45-75 yosh oralig'ida", () => {
    expect(types({ age: 44 })).not.toContain("colorectal_cancer_screening");
    expect(types({ age: 45 })).toContain("colorectal_cancer_screening");
    expect(types({ age: 76 })).not.toContain("colorectal_cancer_screening");
  });

  it("HAR BIR bandning manbasi ko'rsatilgan", () => {
    // "Faqat rasmiy manbalardan foydalaning" talabini tekshirib bo'ladigan
    // qilish uchun: manbasiz band qolib ketmasligi kerak.
    for (const [type, sources] of Object.entries(CHECKUP_SOURCE)) {
      expect(sources.length, `${type} uchun manba ko'rsatilmagan`).toBeGreaterThan(0);
    }
  });
});

describe("PLAN-01: reja foydalanuvchiga moslashadi", () => {
  const due = (type: string, input: Partial<ChecklistRuleInput>) =>
    generateChecklist({ ...BASE, ...input }).find((i) => i.type === type)?.dueInDays;

  it("yillar davomida tekshiruvdan o'tmagan ayolda yillik bandlar DARHOL kerak", () => {
    // Bu onboarding'da so'ralardi, lekin javob tashlab yuborilardi: "hech
    // qachon" degan ayol ham "365 kundan keyin" olardi.
    expect(due("annual_preventive_exam", { lastCheckup: "recent" })).toBe(365);
    expect(due("annual_preventive_exam", { lastCheckup: "over_year" })).toBe(0);
    expect(due("annual_preventive_exam", { lastCheckup: "never" })).toBe(0);
  });

  it("eslay olmasa — yaqin muddat, lekin 'kechikkan' emas", () => {
    expect(due("annual_preventive_exam", { lastCheckup: "unknown" })).toBe(30);
  });

  it("faqat KLINIKA bandlariga ta'sir qiladi", () => {
    // O'z-o'zini tekshirish uyda, oyda bir marta — shifokorga borish bilan
    // aloqasi yo'q, shuning uchun muddati o'zgarmaydi.
    expect(due("breast_self_exam", { lastCheckup: "never", age: 30 })).toBe(30);
    expect(due("hpv_vaccination", { lastCheckup: "never", age: 30 })).toBe(30);
  });

  it("muddatni faqat KAMAYTIRADI, orqaga surmaydi", () => {
    // Tsikl tartibsizligi bandi 14 kun — "never" javobi uni 0 ga
    // tushirmasligi kerak emas, lekin 30 ga ORQAGA ham surmasligi kerak.
    const items = generateChecklist({ ...BASE, lastCheckup: "unknown", cycleIrregular: true });
    expect(items.find((i) => i.type === "cycle_irregularity_followup")?.dueInDays).toBe(14);
  });

  it("PKOS belgilangan bo'lsa qalqonsimon bez tahlili qo'shiladi", () => {
    // Milliy protokol "СПКЯ": qalqonsimon bez buzilishi PKOS belgilariga
    // o'xshab ketadi va ularni chalkashtirishi mumkin.
    const types = (hc: ChecklistRuleInput["healthConditions"]) =>
      generateChecklist({ ...BASE, healthConditions: hc }).map((i) => i.type);
    expect(types(["pcos"])).toContain("thyroid_function_test");
    expect(types([])).not.toContain("thyroid_function_test");
  });

  it("PKOS + perimenopauzada band IKKI MARTA qo'shilmaydi", () => {
    const items = generateChecklist({
      ...BASE,
      age: 48,
      isPerimenopause: true,
      healthConditions: ["pcos"],
    }).filter((i) => i.type === "thyroid_function_test");
    expect(items).toHaveLength(1);
  });
});

describe("GATE-01: \"bilmayman\" javobi \"yo'q\" bilan bir xil emas", () => {
  const types = (sexuallyActive: ChecklistRuleInput["sexuallyActive"]) =>
    generateChecklist({ ...BASE, age: 25, sexuallyActive }).map((i) => i.type);

  it("bachadon bo'yni skrininggi javob BERILMAGANDA ham ko'rsatiladi", () => {
    // Xatoning narxi assimetrik: keraksiz skrining — e'tiborsiz
    // qoldiriladi; keraklisini yashirish — aynan ilova oldini olish uchun
    // mavjud bo'lgan natija. Manba buni "oldini olish mumkin bo'lgan eng
    // katta o'lim xavfi" deb belgilaydi.
    expect(types(true)).toContain("cervical_cancer_screening");
    expect(types(null)).toContain("cervical_cancer_screening");
    // Aniq "yo'q" degan bo'lsa — ko'rsatilmaydi (HPV jinsiy yo'l bilan
    // yuqadi, ya'ni bu holatda skrining haqiqatan ma'nosiz).
    expect(types(false)).not.toContain("cervical_cancer_screening");
  });

  it("boshqa jinsiy faollik bandlari javob berilmaganda ko'rsatilmaydi", () => {
    // Bularda xatoning narxi teskari: spekulyum bilan ko'rik yoki JYYI
    // tahlili — invaziv/xarajatli, va o'tkazib yuborilishining oqibati
    // bachadon bo'yni saratonicha og'ir emas.
    for (const t of ["pelvic_exam_speculum", "sti_panel", "contraception_counseling"]) {
      expect(types(true)).toContain(t);
      expect(types(null)).not.toContain(t);
      expect(types(false)).not.toContain(t);
    }
  });

  it("oilaviy tarix bilinmasa — mammografiya odatiy 40 yoshdan", () => {
    const at = (age: number, familyHistory: ChecklistRuleInput["familyHistory"]) =>
      generateChecklist({ ...BASE, age, familyHistory }).map((i) => i.type);
    expect(at(32, true)).toContain("breast_cancer_screening_mammography");
    expect(at(32, null)).not.toContain("breast_cancer_screening_mammography");
    expect(at(42, null)).toContain("breast_cancer_screening_mammography");
  });
});
