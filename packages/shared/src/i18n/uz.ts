// O'zbek tili — asosiy lug'at (manba tip). Boshqa har bir til shu obyektning
// aniq shaklini takrorlashi kerak — types.ts buni compile vaqtida tekshiradi.
// Ohang: iliq, professional, hazil-mutoyibasiz (mobile-ui-brief.md §2).

const uz = {
  common: {
    appName: "Ayollar salomatligi",
    next: "Keyingisi",
    back: "Orqaga",
    skip: "O'tkazib yuborish",
    save: "Saqlash",
    cancel: "Bekor qilish",
    loading: "Yuklanmoqda...",
    done: "Bajarildi",
    edit: "Tahrirlash",
    delete: "O'chirish",
    add: "Qo'shish",
    yes: "Ha",
    no: "Yo'q",
    dontKnow: "Bilmayman",
  },

  nav: {
    cycle: "Tsikl",
    pregnancy: "Homiladorlik",
    checklist: "Tekshiruvlar",
    clinics: "Klinikalar",
    profile: "Profil",
  },

  onboarding: {
    welcomeTitle: "Xush kelibsiz",
    welcomeSubtitle: "Salomatligingizni oson va xotirjam kuzatib boring",
    startButton: "Boshlash",
    languageTitle: "Qaysi tilda davom etamiz?",
    surveyTitle: "Sizni yaxshiroq tanishtiring",
    surveyIntro: "Bir necha savol — atigi 1-2 daqiqa",
    ageLabel: "Yoshingiz",
    pregnantQuestion: "Hozir homiladormisiz?",
    cycleRegularityQuestion: "Hayz tsiklingiz muntazammi?",
    cycleRegular: "Ha, muntazam",
    cycleIrregular: "Yo'q, tartibsiz",
    familyHistoryQuestion: "Oilangizda saraton yoki ginekologik kasallik tarixi bormi?",
    lastCheckupQuestion: "Oxirgi ginekologik tekshiruvingiz qachon bo'lgan?",
    checkupRecent: "So'nggi 1 yil ichida",
    checkupOverYear: "1 yildan ko'proq oldin",
    checkupNever: "Hech qachon",
    finishButton: "Boshlaymiz",
  },

  cycle: {
    title: "Hayz tsikli",
    logDayButton: "Bugungi kunni belgilash",
    flowLabel: "Oqim intensivligi",
    moodLabel: "Kayfiyat",
    symptomsLabel: "Alomatlar",
    nextPeriodIn: (days: number) =>
      days <= 0 ? "Hayzingiz bugun kutilmoqda" : `Keyingi hayzingiz ${days} kundan keyin`,
    fertileWindowLabel: "Unumdor kunlar oynasi",
    irregularBannerTitle: "3+ oy tartibsiz tsikl aniqlandi",
    irregularBannerAction: "Tekshiruvdan o'tishni ko'rib chiqing",
    flowLevels: {
      spotting: "Tomchi",
      light: "Yengil",
      medium: "O'rtacha",
      heavy: "Kuchli",
    },
    moods: {
      happy: "Xursand",
      calm: "Xotirjam",
      tired: "Charchagan",
      sad: "G'amgin",
      irritable: "Asabiy",
      anxious: "Xavotirli",
    },
    symptoms: {
      cramps: "Qorin og'rig'i",
      headache: "Bosh og'rig'i",
      bloating: "Shishish",
      acne: "Toshma",
      back_pain: "Bel og'rig'i",
      nausea: "Ko'ngil aynishi",
      breast_tenderness: "Ko'krak sezuvchanligi",
      insomnia: "Uyqusizlik",
    },
  },

  pregnancy: {
    title: "Homiladorlik",
    weekLabel: (week: number) => `${week}-hafta`,
    daysRemaining: (days: number) => `Tug'ilishga ${days} kun qoldi`,
    trimester: (t: number) => `${t}-trimestr`,
    sizeComparison: (size: string) => `Bolangiz hozir ${size} kattaligida`,
    visitsTitle: "Tashrif va eslatmalar",
    addVisitButton: "Tashrif qo'shish",
    kickCounterTitle: "Tepki hisoblagich",
    kickCounterButton: "Tepki qayd etish",
    kickCounterCount: (n: number) => `Bugun: ${n} ta tepki`,
    sizes: {
      poppySeed: "moshdona",
      raspberry: "malina",
      lime: "laym",
      lemon: "limon",
      avocado: "avokado",
      corn: "makkajo'xori",
      eggplant: "baqlajon",
      coconut: "kokos yong'og'i",
      pineapple: "ananas",
      watermelon: "tarvuz",
    },
  },

  checklist: {
    title: "Tekshiruv ro'yxati",
    statusPending: "Kutilmoqda",
    statusDone: "Bajarildi",
    statusOverdue: "Muddati o'tgan",
    markDoneButton: "Bajardim",
    findClinicButton: "Klinika topish",
    items: {
      gyn_annual_checkup: {
        title: "Yillik ginekologik ko'rik",
        why: "Muntazam ko'rik erta bosqichda muammolarni aniqlashga yordam beradi.",
      },
      pap_test: {
        title: "Pap-test (3 yilda bir marta)",
        why: "Bachadon bo'yni saratonini erta aniqlash uchun asosiy tekshiruv.",
      },
      mammography_screening: {
        title: "Mammografiya skrining",
        why: "Ko'krak saratonini erta bosqichda aniqlashning eng samarali usuli.",
      },
      free_mammography_45: {
        title: "Bepul mammografiya skrining (davlat dasturi)",
        why: "45 yoshdan katta ayollar uchun davlat tomonidan bepul taqdim etiladi.",
      },
      cycle_irregularity_followup: {
        title: "Tsikl tartibsizligi bo'yicha ko'rik",
        why: "3 oydan ortiq tartibsizlik ginekolog e'tiborini talab qiladi.",
      },
      pregnancy_first_visit: {
        title: "Birinchi homiladorlik ko'rigi",
        why: "Homiladorlikni tasdiqlash va boshlang'ich tekshiruvlar uchun muhim.",
      },
      pregnancy_trimester_checkup: {
        title: "Trimestrga oid ko'rik",
        why: "Har trimestrda homila rivojlanishini nazorat qilish tavsiya etiladi.",
      },
    },
  },

  clinics: {
    title: "Klinikalar",
    listView: "Ro'yxat",
    mapView: "Xarita",
    filterAll: "Barchasi",
    specialties: {
      gynecology: "Ginekologiya",
      oncology: "Onkologiya",
      radiology: "Radiologiya",
      general: "Umumiy",
    },
    freeScreeningBadge: "Bepul skrining",
    callButton: "Qo'ng'iroq qilish",
    directionsButton: "Yo'nalish",
    seedDataNotice: "Namunaviy ma'lumot — haqiqiy klinika bazasi hali to'ldirilmoqda.",
    distanceKm: (km: number) => `${km.toFixed(1)} km`,
  },

  profile: {
    title: "Profil",
    languageLabel: "Til",
    nameLabel: "Ism",
    phoneLabel: "Telefon raqam",
    phonePlaceholder: "Ixtiyoriy — hisobingizni saqlab qolish uchun",
    accessibilityTitle: "Ko'rish qulayligi",
    fontSizeLabel: "Shrift o'lchami",
    fontSizeNormal: "Oddiy",
    fontSizeLarge: "Katta",
    highContrastLabel: "Yuqori kontrast",
    exportButton: "Ma'lumotlarni eksport qilish",
    savedMessage: "Saqlandi",
  },
};

export default uz;
