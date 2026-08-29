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
    other: "Boshqa",
    free: "Bepul",
    paid: "Pullik",
    continueButton: "Davom etish",
  },

  nav: {
    cycle: "Tsikl",
    pregnancy: "Homiladorlik",
    checklist: "Tekshiruvlar",
    clinics: "Klinikalar",
    profile: "Profil",
  },

  auth: {
    createAccount: "Akkaunt yarataman",
    haveAccount: "Menda akkaunt bor",
    identifierLabel: "Telefon raqam yoki email",
    identifierPlaceholder: "+998901234567 yoki email@masalan.com",
    invalidIdentifier: "To'g'ri telefon raqam yoki email kiriting",
    welcomeBackMessage: "Xush kelibsiz! Akkauntingiz topildi.",
  },

  privacy: {
    title: "Maxfiylik siyosati",
    body: "Ma'lumotlaringiz (sog'liq bilan bog'liq yozuvlar, profil ma'lumotlari) faqat sizga shaxsiylashtirilgan tavsiyalar berish uchun ishlatiladi va uchinchi shaxslarga sotilmaydi. To'liq matnni istalgan vaqt Profil bo'limidan o'qishingiz mumkin.",
    agreeButton: "Roziman va davom etaman",
    linkLabel: "To'liq matnni o'qish",
    dataCollected:
      "Biz yig'adigan ma'lumotlar: profil ma'lumotlari (yosh, maqsad), hayz tsikli va homiladorlik yozuvlari, tekshiruv holati, klinikalarga qiziqish (referral) hodisalari. Bu ma'lumotlar faqat sizga shaxsiylashtirilgan tavsiyalar berish, eslatmalar yuborish va ilovani yaxshilash uchun ishlatiladi.",
    noSelling:
      "Ma'lumotlaringiz uchinchi shaxslarga sotilmaydi. Xohlagan vaqtingizda Profil bo'limidan barcha ma'lumotlaringizni eksport qilishingiz mumkin.",
    accountSecurity:
      "Akkauntingiz telefon raqami yoki email orqali, tasdiqlash kodisiz yaratiladi — shuning uchun identifikatoringizni (telefon/email) boshqalar bilan baham ko'rmaslikni tavsiya qilamiz.",
  },

  onboarding: {
    welcomeTitle: "Xush kelibsiz",
    welcomeSubtitle: "Salomatligingizni oson va xotirjam kuzatib boring",
    startButton: "Boshlaymiz!",
    languageTitle: "Qaysi tilda davom etamiz?",
    surveyTitle: "Sizni yaxshiroq tanishtiring",
    surveyIntro: "Bir necha savol — atigi 1-2 daqiqa",

    heardAboutUsTitle: "Biz haqimizda qayerdan eshitdingiz?",
    heardAboutUs: {
      social_media: "Ijtimoiy tarmoqlardan",
      friend: "Do'stimdan",
      doctor: "Shifokor tavsiyasi",
      app_store: "Do'kondan qidirib topdim",
      other: "Boshqa",
    },

    nameQuestion: "Ismingiz nima?",
    namePlaceholder: "Ismingiz",

    ageLabel: "Yoshingiz",

    goalTitle: "Ilovadan asosiy maqsadingiz nima?",
    goals: {
      cycle: "Hayz siklini kuzatish",
      pregnancy: "Homiladorlikni kuzatish",
      planning_pregnancy: "Homilador bo'lishni rejalashtirish",
      wellbeing: "Sog'lig'imni nazorat qilish",
      checkups: "Tekshiruvlarni nazorat qilish",
      understand_body: "Tanamni yaxshiroq tushunish",
      skin: "Terimni yaxshilash",
    },

    pregnantQuestion: "Hozir homiladormisiz?",
    cycleRegularityQuestion: "Hayz tsiklingiz muntazammi?",
    cycleRegular: "Ha, muntazam",
    cycleIrregular: "Yo'q, tartibsiz",
    familyHistoryQuestion: "Oilangizda saraton yoki ginekologik kasallik tarixi bormi?",
    lastCheckupQuestion: "Oxirgi ginekologik tekshiruvingiz qachon bo'lgan?",
    checkupRecent: "So'nggi 1 yil ichida",
    checkupOverYear: "1 yildan ko'proq oldin",
    checkupNever: "Hech qachon",

    averageCycleLengthQuestion: "Sikllingiz odatda necha kun davom etadi?",
    averagePeriodLengthQuestion: "Hayzingiz odatda necha kun davom etadi?",
    lastPeriodQuestion: "Oxirgi marta qachon hayz ko'rgansiz?",

    typicalSymptomsQuestion: "Odatda qanday alomatlarni sezasiz?",

    periodAttitudeQuestion: "Hayzingiz haqida qanday fikrdasiz?",
    periodAttitude: {
      uncomfortable: "Noqulaylik his qilaman",
      dislike: "Yoqtirmayman",
      want_to_learn: "Buni yaxshiroq o'rganmoqchiman",
      comfortable: "Bemalolman, o'rganib qolganman",
    },

    healthConditionsQuestion: "Quyidagi holatlarni boshingizdan kechirganmisiz?",
    healthConditions: {
      yeast_infection: "Zamburug' infeksiyasi",
      uti: "Siydik yo'llari infeksiyasi",
      bacterial_vaginosis: "Bakterial vaginoz",
      pcos: "Polikistoz tuxumdon sindromi (PCOS)",
      endometriosis: "Endometrioz",
      fibroids: "Fibromalar",
      unknown: "Bilmayman",
      none: "Birontasi ham emas (o'zim yozaman)",
    },
    healthConditionsOtherPlaceholder: "Agar xohlasangiz, batafsil yozing",

    heightWeightTitle: "Bo'yingiz va vazningiz",
    heightLabel: "Bo'yi (sm)",
    weightLabel: "Vazni (kg)",

    notificationsQuestion: "Muhim eslatmalar va ma'lumotlarni olishga rozimisiz?",

    analyzingTitle: "Ma'lumotlaringiz tahlil qilinmoqda...",
    analyzingSubtitle: "Sizga mos dastur tayyorlanmoqda",

    finishButton: "Boshlaymiz",
  },

  cycle: {
    title: "Hayz tsikli",
    logDayButton: "Bugungi kunni belgilash",
    dailyCheckinTitle: "Kunlik nazorat",
    moodCardLabel: "Kayfiyat",
    flowCardLabel: "Oqim",
    symptomsCardLabel: "Simptomlar",
    periodDayBadge: (day: number) => `Hayzning ${day}-kuni`,
    flowLabel: "Oqim intensivligi",
    moodLabel: "Kayfiyat",
    symptomsLabel: "Alomatlar",
    nextPeriodIn: (days: number) =>
      days <= 0 ? "Hayzingiz bugun kutilmoqda" : `Keyingi hayzingiz ${days} kundan keyin`,
    fertileWindowLabel: "Unumdor kunlar oynasi",
    irregularBannerTitle: "3+ oy tartibsiz tsikl aniqlandi",
    irregularBannerAction: "Tekshiruvdan o'tishni ko'rib chiqing",
    articlesCardTitle: "Qiziqarli maqolalar",
    riskQuizCardTitle: "O'z-o'zini tekshirish testi",
    riskQuizCardSubtitle: "2 daqiqada xavf darajangizni bilib oling",
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
      fatigue: "Charchoq",
      irritability: "Asabiylashish",
      difficulty_concentrating: "Diqqatni jamlashga qiynalish",
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
    articlesCardTitle: "Qiziqarli maqolalar",
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
    riskQuizCardTitle: "O'z-o'zini tekshirish testi",
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

  riskQuiz: {
    title: "O'z-o'zini tekshirish testi",
    disclaimer:
      "Bu tibbiy tashxis emas — faqat umumiy xavf omillariga asoslangan yo'naltiruvchi test. Aniq baholash uchun shifokorga murojaat qiling.",
    startButton: "Testni boshlash",
    submitButton: "Natijani ko'rish",
    questions: {
      age: "40 yoshdan kattamisiz?",
      family_history: "Oilangizda ko'krak yoki tuxumdon saratoni tarixi bormi?",
      personal_history: "Shaxsan sizda ko'krak/ginekologik kasallik tarixi bo'lganmi?",
      early_period: "Birinchi hayzingiz 12 yoshgacha boshlanganmi?",
      no_children_or_late_pregnancy: "Farzandingiz yo'qmi yoki birinchi homiladorligingiz 30 yoshdan keyin bo'lganmi?",
      hormone_therapy: "Uzoq muddat gormonal davolanish (yoki gormonal kontratseptiv) qabul qilganmisiz?",
      smoking_alcohol: "Chekasizmi yoki muntazam alkogol iste'mol qilasizmi?",
    },
    resultTitle: "Natijangiz",
    levels: {
      low: { label: "Past xavf", description: "Hozircha alohida xavf omillari aniqlanmadi. Muntazam tekshiruvlarni davom ettiring." },
      medium: { label: "O'rtacha xavf", description: "Ba'zi xavf omillari mavjud — yaqin oylarda ginekolog bilan maslahatlashish tavsiya etiladi." },
      high: { label: "Yuqori xavf", description: "Bir nechta xavf omillari aniqlandi — imkon qadar tezroq shifokorga murojaat qiling." },
    },
    findClinicButton: "Eng yaqin klinikani ko'rish",
  },

  articles: {
    title: "Maqolalar",
    readMore: "Batafsil o'qish",
    seedDataNotice: "Namunaviy ta'limiy kontent — tibbiy kontent manbai keyinroq to'liq biriktiriladi.",
    categories: {
      cycle: "Hayz sikli",
      pregnancy: "Homiladorlik",
      checkups: "Tekshiruvlar",
    },
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
    notificationsLabel: "Bildirishnomalar",
    statsTitle: "Mening statistikam",
    statsLogsCount: (n: number) => `${n} ta kunlik yozuv`,
    statsStreak: (n: number) => `${n} kunlik streak`,
    securityTitle: "Xavfsizlik va maxfiylik",
    privacyPolicyLink: "Maxfiylik siyosatini o'qish",
    helpTitle: "Yordam",
    helpPhoneLabel: "Biz bilan bog'laning",
    helpPhoneValue: "[Sizning kontakt raqamingiz — bu yerga qo'yiladi]",
    premiumTitle: "Premium",
    premiumSubtitle: "Tez orada qo'shimcha imkoniyatlar bilan",
  },
};

export default uz;
