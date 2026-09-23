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
    errorGeneric: "Nimadir xato ketdi. Birozdan keyin qayta urinib ko'ring.",
    retryButton: "Qayta urinish",
    // FIX2-06/FIX2-07: skrin-rider foydalanuvchilari uchun — ikonka-tugmalar
    // (burger menyu, uni yopish) uchun matnli yorliq.
    openMenu: "Menyuni ochish",
    close: "Yopish",
    free: "Bepul",
    paid: "Pullik",
    continueButton: "Davom etish",
    // Kunning vaqtiga qarab shaxsiylashtirilgan salomlashuv (Figma "Make" manbasi:
    // "Salom, {Ism}" / "Xayrli tong, {Ism}"). `name` bo'sh bo'lsa ismisiz qaytadi.
    greeting: (name: string | null, hour: number) => {
      const time =
        hour >= 5 && hour < 11 ? "Xayrli tong" : hour >= 11 && hour < 17 ? "Xayrli kun" : hour >= 17 && hour < 23 ? "Xayrli kech" : "Salom";
      return name ? `${time}, ${name}` : time;
    },
    months: [
      "Yanvar",
      "Fevral",
      "Mart",
      "Aprel",
      "May",
      "Iyun",
      "Iyul",
      "Avgust",
      "Sentabr",
      "Oktabr",
      "Noyabr",
      "Dekabr",
    ],
    // Yakshanbadan boshlab (JS Date.getDay() bilan mos) — oy taqvimi sarlavhasi uchun.
    weekdaysShort: ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"],
  },

  // TODAY-02 — kunlik "Check-in" kartalari (packages/shared/src/logic/checkin.ts
  // dagi savollar bilan kalit bo'yicha bog'langan).
  checkin: {
    title: "Kunlik check-in",
    yes: "Ha",
    no: "Yo'q",
    moodCategory: "Kayfiyat",
    moodSubtitle: "Bugungi holat",
    moodQuestion: "Bugun o'zingizni qanday his qilyapsiz?",
    doneTitle: "Bugunga hammasi tayyor",
    doneBody: "Ertaga yana ko'rishamiz — har kungi kichik qadam katta farq qiladi.",
    categories: {
      wellbeing: "Farovonlik",
      reflection: "Mushohada",
      body: "Tana",
    },
    questions: {
      movement: { subtitle: "Yengil harakat", question: "Bugun biroz cho'zilish mashqini qildingizmi?" },
      friend: { subtitle: "Aloqada bo'lish", question: "Bugun yaqiningiz bilan gaplashdingizmi?" },
      water: { subtitle: "Suv balansi", question: "Bugun yetarlicha suv ichdingizmi?" },
      sleep: { subtitle: "Dam olish", question: "Kecha yaxshi uxlab turdingizmi?" },
      outdoors: { subtitle: "Toza havo", question: "Bugun ochiq havoda bo'ldingizmi?" },
    },
  },

  // PET-01 — bosh ekrandagi uy hayvoni (faqat 18 yoshgacha).
  pets: {
    sectionTitle: "Uy hayvoning",
    sectionHint: "Bosh ekranda sen bilan birga bo'ladi",
    chooseTitle: "Do'stingni tanla",
    none: "Hayvon kerak emas",
    names: {
      cat: "Mushukcha",
      puppy: "Kuchukcha",
      bunny: "Quyoncha",
      chick: "Jo'jacha",
      panda: "Pandacha",
    },
  },

  nav: {
    home: "Asosiy",
    cycle: "Tsikl",
    pregnancy: "Homiladorlik",
    checklist: "Tekshiruvlar",
    community: "Jamiyat",
    clinics: "Klinikalar",
    profile: "Profil",
    assistant: "Yordamchi",
    // TODAY-01: pastki menyuda "Hamkor" o'rniga qisqaroq nom (foydalanuvchi
    // so'rovi) — `partner.title` bo'lim ICHIDAGI sarlavha uchun o'zgarishsiz qoladi.
    partner: "Juft",
  },

  auth: {
    // ONB-05: yagona kirish ekrani (referens dizayn). Uchta usul bir joyda —
    // ilgari bu uchta alohida qadam edi (tanlov → raqam → tasdiqlash).
    loginTitle: "Kirish",
    loginSubtitle: "O'zingizga qulay usulni tanlang",
    telegramLogin: "Telegram orqali kirish",
    continueInTelegram: "Davom etish",
    googleLogin: "Google orqali kirish",
    phoneLogin: "Telefon raqam bilan kirish",
    comingSoon: "Tez kunda",
    orDivider: "yoki",
    legalNoticePrefix: "Davom etish orqali siz ",
    legalNoticeLink: "maxfiylik siyosatimiz",
    legalNoticeSuffix: "ga rozilik bildirasiz.",
    identifierTitle: "Telefon raqamingizni kiriting",
    createAccount: "Akkaunt yarataman",
    haveAccount: "Menda akkaunt bor",
    identifierLabel: "Telefon raqam",
    createIdentifierTitle: "Akkaunt yaratish uchun telefon raqamingizni kiriting",
    loginIdentifierTitle: "Akkauntingizga kirish uchun telefon raqamingizni kiriting",
    identifierPlaceholder: "+998901234567",
    invalidIdentifier: "To'g'ri telefon raqam kiriting",
    identifierNetworkError: "Internet aloqasini tekshirib, qayta urinib ko'ring",
    welcomeBackMessage: "Xush kelibsiz! Akkauntingiz topildi.",
    phoneVerifyTitle: "Telegram orqali tasdiqlang",
    phoneVerifyIntro:
      "Pastdagi tugma orqali Telegram botimizni oching, \"Start\" bosing va telefon raqamingizni ulashing — shundan keyin sizga 6 xonali tasdiqlash kodi yuboriladi.",
    openTelegramButton: "Telegram'da ochish",
    waitingForCode: "Kod kutilmoqda... Botda \"Start\" bosganingizdan so'ng shu yerga qaytib, kodni kiriting.",
    codeSentHint: "Kod Telegram'ga yuborildi — uni pastga kiriting",
    codePlaceholder: "6 xonali kod",
    invalidCode: "Kod noto'g'ri yoki muddati o'tgan",
    resendLink: "Havolani qaytadan olish",
    miniAppLoading: "Hisobingiz tekshirilmoqda...",
    miniAppShareTitle: "Xush kelibsiz!",
    miniAppShareIntro: "Ismingiz va rasmingiz Telegram'dan avtomatik olindi. Faqat telefon raqamingizni tasdiqlash qoldi.",
    miniAppShareButton: "📱 Telefon raqamimni ulashish",
    miniAppWaiting: "Telegram popup'ida ruxsat berishingizni kutmoqdamiz...",
    miniAppDeclined: "Raqam ulashilmadi. Ilova ishlashi uchun telefon raqamingiz kerak — qayta urinib ko'ring.",
    // WEB2-03: cheksiz "Kutilmoqda..." holati o'rniga — belgilangan vaqtdan
    // keyin (webhook signal kelmasa) ko'rsatiladi.
    miniAppTimeout: "Kutish vaqti tugadi — signal kelmadi. Qaytadan urinib ko'ring.",
    miniAppRetryButton: "Qayta urinish",
    miniAppNotInTelegram: "Bu sahifa faqat Telegram ilovasi ichida ochilishi kerak.",
    miniAppError: "Xatolik yuz berdi — qayta urinib ko'ring.",
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
      "Akkauntingiz telefon raqamingiz orqali, tasdiqlash kodisiz yaratiladi — shuning uchun telefon raqamingizni boshqalar bilan baham ko'rmaslikni tavsiya qilamiz.",
    operator:
      "Ushbu ilovani (Ayollar salomatligi / MammoAI) mustaqil dasturchi sifatida Maqsadbek Usmonov ishlab chiqmoqda va boshqaradi.",
    contact:
      "Savollaringiz, shikoyatlaringiz yoki ma'lumotlaringiz bo'yicha so'rovlaringiz uchun: maqsadbekusmonov8@gmail.com",
    deletion:
      "Ma'lumotlaringizni istalgan vaqt Profil bo'limidan eksport qilishingiz mumkin. Akkauntingizni va unga tegishli barcha ma'lumotlarni butunlay o'chirish uchun Profil bo'limidagi \"Akkauntni butunlay o'chirish\" tugmasidan foydalaning — bu amal darhol va qaytarib bo'lmaydigan tarzda bajariladi. Ilovadan foydalana olmasangiz ham, yuqoridagi email manziliga yozib, xuddi shu so'rovni yuborishingiz mumkin.",
    medicalDisclaimer:
      "Ushbu ilova tibbiy tashxis qo'ymaydi va shifokor maslahati o'rnini bosmaydi — sog'lig'ingiz bo'yicha qaror qabul qilishdan oldin har doim malakali shifokorga murojaat qiling.",
    notForChildren:
      "Ilova 18 yoshdan katta foydalanuvchilar uchun mo'ljallangan va bolalar (13 yoshgacha)dan ongli ravishda ma'lumot yig'maydi.",
    offerTitle: "Ommaviy oferta",
    offerIntro:
      "Ushbu hujjat O'zbekiston Respublikasi Fuqarolik Kodeksining 369-moddasiga muvofiq ommaviy oferta hisoblanadi va \"Ayollar salomatligi\" (MammoAI) ilovasidan (\"Ilova\") foydalanish shartlarini belgilaydi. Ilovadan ro'yxatdan o'tish yoki undan foydalanishni boshlash ushbu shartlarni to'liq va so'zsiz qabul qilish (aksept) hisoblanadi.",
    offerSections: [
      {
        title: "1. Umumiy qoidalar",
        body: "1.1. Ilova operatori — mustaqil dasturchi Maqsadbek Usmonov (\"Operator\").\n1.2. Ilova ayollarning hayz sikli, homiladorlik va umumiy sog'lig'ini shaxsiy kuzatish uchun mo'ljallangan bepul dastur ta'minotidir.\n1.3. Ushbu oferta shartlari Ilovaning yangi versiyalari chiqishi bilan o'zgarishi mumkin — yangilangan matn Ilova ichida e'lon qilinadi.",
      },
      {
        title: "2. Xizmat tavsifi",
        body: "2.1. Ilova quyidagi imkoniyatlarni taqdim etadi: hayz sikli kalendari va bashorati, homiladorlik kuzatuvi, tibbiy tekshiruv eslatmalari, o'z-o'zini baholash testi, foydalanuvchilar hamjamiyati va boshqa shu kabi funksiyalar.\n2.2. Ilova tibbiy tashxis qo'ymaydi va professional tibbiy maslahat, diagnostika yoki davolash o'rnini bosmaydi. Sog'lig'ingizga oid har qanday qaror qabul qilishdan oldin malakali shifokorga murojaat qiling.",
      },
      {
        title: "3. Foydalanuvchining huquq va majburiyatlari",
        body: "3.1. Foydalanuvchi Ilovadan faqat qonuniy maqsadlarda, o'z shaxsiy ma'lumotlarini to'g'ri kiritgan holda foydalanishga majburdir.\n3.2. Ilova 18 yoshdan katta foydalanuvchilar uchun mo'ljallangan (13 yoshgacha bo'lganlar uchun emas).\n3.3. Foydalanuvchi o'z akkaunt ma'lumotlarining (telefon raqami) maxfiyligini saqlashga mas'uldir.",
      },
      {
        title: "4. Operatorning huquq va majburiyatlari",
        body: "4.1. Operator Ilovaning barqaror ishlashiga harakat qiladi, biroq uzluksiz va xatosiz ishlashga kafolat bermaydi.\n4.2. Operator foydalanuvchi ma'lumotlarini ushbu sahifadagi Maxfiylik siyosatiga muvofiq qayta ishlaydi va uchinchi shaxslarga sotmaydi.\n4.3. Operator qoidabuzarlik yuz berganda foydalanuvchi akkauntini vaqtincha yoki butunlay to'xtatish huquqini o'zida saqlaydi.",
      },
      {
        title: "5. To'lov shartlari",
        body: "5.1. Ilovaning asosiy funksiyalari bepul taqdim etiladi. Kelajakda qo'shimcha (Premium) imkoniyatlar pullik asosda taklif etilishi mumkin — bu haqda foydalanuvchiga alohida, oldindan xabar beriladi.",
      },
      {
        title: "6. Javobgarlikni cheklash",
        body: "6.1. Ilova orqali olingan ma'lumotlar tavsiya xarakteriga ega bo'lib, tibbiy tashxis hisoblanmaydi.\n6.2. Operator foydalanuvchining Ilovadagi ma'lumotlarga asoslanib qabul qilgan qarorlari natijasida yuzaga kelishi mumkin bo'lgan salbiy oqibatlar uchun javobgar emas.",
      },
      {
        title: "7. Intellektual mulk",
        body: "7.1. Ilovaning dizayni, kodi va kontenti Operatorga tegishli bo'lib, O'zbekiston Respublikasi qonunchiligi bilan himoyalangan.",
      },
      {
        title: "8. Shartnomani bekor qilish",
        body: "8.1. Foydalanuvchi istalgan vaqtda Profil bo'limidan akkauntini butunlay o'chirish orqali ushbu shartnomani bekor qilishi mumkin.",
      },
      {
        title: "9. Nizolarni hal qilish",
        body: "9.1. Ushbu oferta yuzasidan kelib chiqadigan nizolar muzokaralar yo'li bilan, kelishuvga erishilmasa — O'zbekiston Respublikasining amaldagi qonunchiligiga muvofiq hal qilinadi.",
      },
      {
        title: "10. Operator rekvizitlari",
        body: "Mustaqil dasturchi: Maqsadbek Usmonov\nAloqa uchun: maqsadbekusmonov8@gmail.com",
      },
    ],
    offerCheckboxLabel: "Ommaviy oferta shartlari bilan tanishdim va qabul qilaman",
  },

  onboarding: {
    // ONB-04: so'rovnoma uchta nomlangan bo'limga bo'linadi. Bu 21 qadamni
    // "uchta qisqa bo'lim"ga aylantiradi va progress orqaga sakrashini
    // butunlay yo'q qiladi (bo'lim ichidagi qadam soni barqaror).
    sectionAbout: "Siz haqingizda",
    sectionCycle: "Siklingiz",
    sectionHealth: "Sog'lig'ingiz",
    sectionProgress: (current: number, total: number) => `${current}/${total}`,
    // ONB-02: so'rovnoma O'RTASIDA ko'rsatiladigan dastlabki bashorat.
    // Maqsad — qiymatni oldinga chiqarish: foydalanuvchi qolgan savollarga
    // javob berishdan OLDIN ilova nima berayotganini ko'radi.
    previewTitle: "Dastlabki bashoratingiz tayyor",
    previewNextPeriod: "Keyingi hayz",
    previewPhase: "Hozirgi faza",
    previewFertile: "Unumdor kunlar",
    previewNote: "Bu — bitta sikl asosidagi taxmin. Yana bir nechta savol va kunlik kuzatuv bilan ilova buni sezilarli aniqlashtiradi.",
    previewContinue: "Davom etamiz",
    // ONB-01: "bilmayman" tanlanganda dalda beruvchi javob. ATAYLAB raqamsiz —
    // o'ylab topilgan foiz ("ayollarning 40%i bilmaydi") yozish mumkin emas,
    // chunki bizda unga manba yo'q. Normallashtirish raqamsiz ham ishlaydi.
    reassureTitle: "Bu mutlaqo normal",
    reassureCycleLengths: "Ko'p ayol sikl uzunligini aniq bilmaydi. Siz bir necha hayzni belgilashingiz bilanoq ilova buni o'zi hisoblab beradi.",
    reassureLastPeriod: "Esdan chiqishi oddiy holat. Taxminiy sanani belgilang — keyinroq kalendardan bir bosishda to'g'rilaysiz.",
    reassureGeneric: "Bilmasligingiz muammo emas — ilova kuzatuv davomida o'zi aniqlab boradi.",
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
    birthYearLabel: "Tug'ilgan yilingiz",

    goalTitle: "Ilovadan asosiy maqsadingiz nima?",
    goals: {
      cycle: "Hayz siklini kuzatish",
      pregnancy: "Homiladorlikni kuzatish",
      planning_pregnancy: "Homilador bo'lishni rejalashtirish",
      wellbeing: "Sog'lig'imni nazorat qilish",
      checkups: "Tekshiruvlarni nazorat qilish",
      understand_body: "Tanamni yaxshiroq tushunish",
      skin: "Terimni yaxshilash",
      partner_tracking: "Hamkorimni (ayolimni) kuzatish",
      perimenopause: "Perimenopauzani kuzatish (40+)",
    },

    pregnantQuestion: "Hozir homiladormisiz?",
    cycleRegularityQuestion: "Hayz tsiklingiz muntazammi?",
    cycleRegular: "Ha, muntazam",
    cycleIrregular: "Yo'q, tartibsiz",
    familyHistoryQuestion: "Oilangizda saraton yoki ginekologik kasallik tarixi bormi?",
    // FIX-CHECKUPS: 15 yoshdan katta foydalanuvchilarga so'raladi — bachadon
    // bo'yni skrininggi/JYYI/kontratseptsiya kabi tekshiruvlar shunga bog'liq.
    sexuallyActiveQuestion: "Jinsiy hayotingiz bormi?",
    lastCheckupQuestion: "Oxirgi ginekologik tekshiruvingiz qachon bo'lgan?",
    checkupRecent: "So'nggi 1 yil ichida",
    checkupOverYear: "1 yildan ko'proq oldin",
    checkupNever: "Hech qachon",

    averageCycleLengthQuestion: "Sikllingiz odatda necha kun davom etadi?",
    averagePeriodLengthQuestion: "Hayzingiz odatda necha kun davom etadi?",
    /** VALIDATE-01: tugma o'chiq bo'lsa, NEGA o'chiqligi aytilishi kerak —
     * aks holda foydalanuvchi qotib qoladi. */
    cycleLengthsRangeHint: (cMin: number, cMax: number, pMin: number, pMax: number) =>
      `Sikl uzunligi ${cMin}–${cMax} kun, hayz davomiyligi esa ${pMin}–${pMax} kun oralig'ida bo'lishi kerak. Bilmasangiz — "Bilmayman"ni tanlang.`,
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
    heightLabel: "Bo'yi",
    weightLabel: "Vazni",
    unitsMetric: "Metrik",
    unitsImperial: "Imperial",
    unitCm: "sm",
    unitKg: "kg",
    unitFeet: "fut",
    unitInches: "dyuym",
    unitLb: "funt",

    notificationsQuestion: "O'z vaqtida eslatmalar va aniq bashoratlar bilan har doim tayyor bo'ling",
    notificationsImportance:
      "Bildirishnomalar yoqilgan bo'lsa, hayz boshlanishi va unumdor kunlar oldindan, tekshiruv sanalari va hamkoringizdan xabarlar esa o'z vaqtida yetib boradi. Ular bo'lmasa, muhim daqiqalarni oson o'tkazib yuborishingiz mumkin.",
    notificationsSamplePreview: "Hayzingiz 2 kundan keyin boshlanishi kutilmoqda",
    notificationsNowLabel: "Hozir",
    notificationsTurnOnButton: "Yoqish",

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
    // 2026-09-18 UX qayta qurish: bosh ekrandagi 3 ta tezkor amal tugmasi
    // uchun — "Batafsil kiritish" bo'limining flowCardLabel/symptomsCardLabel'idan
    // farqli, qisqaroq tugma matnlari.
    logFlowButton: "Sikl belgilash",
    checkinButton: "Check-in",
    // TODAY-01: bosh ekranning ikki qatorli markaziy bloki — kichik yorliq
    // ustida katta qiymat (Figma referens). Uzun, tushuntiruvchi variantlar
    // (periodDayHeroLabel va h.k.) O'CHIRILMADI — ular hali ham "klassik"
    // ko'rinishdagi rejimlar uchun ishlatiladi.
    heroTodayLabel: "BUGUN",
    // TODAY-03: ilova ochilganda bashorat hisoblanayotgan payt va yozuv
    // saqlangandan keyingi qisqa tasdiq (referens dizayn).
    analyzingLabel: "Ma'lumotlaringiz tahlil qilinmoqda...",
    predictionsUpdatedLabel: "Bashoratlar yangilandi!",
    heroPeriodLabel: "Hayz:",
    heroPeriodDayValue: (day: number) => `${day}-kun`,
    heroNextPeriodLabel: "Keyingi hayz:",
    heroDelayedLabel: "Kechikmoqda:",
    /** 0-BOSQICH: kutilgan sana kelgan, lekin hech narsa qayd etilmagan.
     * Ilova "kechikmoqda" deb DA'VO qila olmaydi — u faqat hech narsa
     * belgilanmaganini biladi, hayz boshlangan-boshlanmaganini emas. */
    heroPeriodStartedQuestion: "Hayzingiz boshlandimi?",
    heroPeriodStartedCta: "Ha, bugun belgilash",
    heroTodayValue: "Bugun",
    heroDaysValue: (days: number) => `${days} kun`,
    assistantCardTitle: "MammoAI yordamchisi",
    assistantCardMessage: "Bugun o'zingizni qanday his qilyapsiz? Keling, birga aniqlaymiz:",
    assistantCardOption1: "Siklim haqida savolim bor",
    assistantCardOption2: "O'zimni yaxshi his qilishim uchun nima qilay?",
    assistantCardCta: "Bilib olaylik",
    assistantCardDismiss: "Yopish",
    flowLabel: "Oqim intensivligi",
    moodLabel: "Kayfiyat",
    symptomsLabel: "Alomatlar",
    // CYCLE-ALGO-15: bazal tana harorati (BBT) — ixtiyoriy, "Ilg'or" bo'lim.
    advancedSectionLabel: "Ilg'or",
    basalBodyTempLabel: "Bazal tana harorati (°C)",
    basalBodyTempHint: "Har kuni uyg'ongan zahoti, harakatdan oldin o'lchang — ovulyatsiyani simptomdan ham aniqroq belgilashga yordam beradi.",
    nextPeriodIn: (days: number) =>
      days === 0
        ? "Hayzingiz bugun kutilmoqda"
        : days > 0
          ? `Keyingi hayzingiz ${days} kundan keyin`
          : `Hayzingiz ${Math.abs(days)} kun kechikmoqda`,
    fertileWindowLabel: "Unumdor kunlar oynasi",
    /** TODAY-09: hero ostidagi bir qatorli holat (referensdagi "Low chances
     * of getting pregnant"). Ishonch yetarli bo'lmaganda DA'VO qilinmaydi —
     * o'rniga nima qilish kerakligi aytiladi. */
    pregnancyChanceLow: "Homiladorlik ehtimoli past",
    pregnancyChanceHigh: "Homiladorlik ehtimoli yuqori",
    pregnancyChanceUnknown: "Bilish uchun hayzingizni belgilang",
    /** ⓘ bosilganda — HISOB-KITOBNING o'zi tushuntiriladi, umumiy gap emas. */
    pregnancyChanceExplainHigh: (from: string, to: string) =>
      `Bugun unumdor oyna ichidasiz (${from} – ${to}). Bu ovulyatsiya atrofidagi kunlar — homiladorlik ehtimoli eng yuqori davr.`,
    pregnancyChanceExplainLow: (from: string, to: string) =>
      `Unumdor oyna ${from} – ${to} oralig'ida kutilmoqda. Bugun undan tashqaridasiz, shuning uchun ehtimol past.`,
    /** MUHIM: bu — kontratseptsiya usuli emas. Buni aytmaslik xavfli bo'lardi. */
    pregnancyChanceExplainNote:
      "Bu — siz kiritgan ma'lumotlar asosidagi taxmin, tibbiy xulosa emas. Homiladorlikdan saqlanish usuli sifatida ishlatmang.",
    statCycleDay: "Sikl kuni",
    statNextPeriod: "Keyingi hayz",
    statNextFertile: "Unumdor kunlar",
    // CYCLE-ALGO-12: bashorat qilingan unumdor oyna atrofida — foydalanuvchiga
    // ovulyatsiya signalini (simptom) qayd etishni taklif qiladi, bu esa
    // ikki-fazali lyuteal modelni (CYCLE-ALGO-05) aniqlashtiradi.
    ovulationSignalPromptTitle: "Ovulyatsiya belgilarini sezdingizmi?",
    ovulationSignalPromptBody:
      "Shu kunlarda ovulyatsiya og'rig'ini yoki shilliq qavati o'zgarishini his qildingizmi? Belgilang — bu bashoratni aniqlashtiradi.",
    ovulationSignalPromptButton: "Belgilash",
    irregularBannerTitle: "3+ oy tartibsiz tsikl aniqlandi",
    // CYCLE-ALGO-11: tartibsiz foydalanuvchilarda aniq-sana bashorati
    // (nextPeriodIn) ginekolog maslahatiga ziddiyatli signal berardi —
    // "3+ oy tartibsiz" degan ogohlantirish bilan bir vaqtda "N kundan
    // keyin" deb aniq son ko'rsatish. Endi ring shu holatda qisqa
    // "naqsh kuzatilmoqda" xabarini, banner esa to'liqroq tushuntirishni
    // ko'rsatadi.
    irregularRingLabel: "Sikl naqshi kuzatilmoqda",
    irregularPredictionNote:
      "Aniq sanani bashorat qilish qiyin — siklingiz tabiiy ravishda o'zgaruvchan. Buning o'rniga umumiy naqshlaringizni kuzatamiz.",
    irregularCheckupLink: "Tekshiruvlar bo'limiga o'tish",
    perimenopauseCardTitle: "Perimenopauza kuzatuvi",
    perimenopauseCardBody: "Bu davrda tsikl tartibsizlashishi — tabiiy holat. Bashorat o'rniga belgilaringizni (issiqlik bosishi, uyqu, kayfiyat) kuzatib boring.",
    // OVERNIGHT-23: haqiqiy "hech narsa yo'q" holatida (`!data.prediction`)
    // bosilsa, oxirgi hayz sanasini kiritish oynasi ochiladi (`heroAction`) —
    // shuning uchun bu matn ham CTA sifatida o'qiladi.
    ringEmptyLabel: "Bashorat qilish uchun oxirgi hayz sanasini belgilang",
    // OVERNIGHT-15: yuqoridagi matn "bosiladigan" ekanini bildirmasdi —
    // foydalanuvchi buni tugma deb tushunmasdi.
    heroTapHint: "Bosing va boshlang",
    staleDataLabel: "Ma'lumot eskirgan — oxirgi hayz sanasini yangilang",
    // OVERNIGHT-23: foydalanuvchi HOZIR hayz ICHIDA bo'lsa (`periodDay`),
    // "keyingi hayz N kundan keyin" haqida gapirish chalkash bo'ladi —
    // buning o'rniga HOZIRGI holat aytiladi.
    periodDayHeroLabel: (day: number, periodLength: number) => `Hayzingiz ${day}-kuni — taxminan ${periodLength} kun davom etadi`,
    // OVERNIGHT-23: yagona, IJOBIY ohangdagi ikkinchi darajali qator — ilgari
    // shu o'rinda "ma'lumot yo'q"/"yetarli emas" kabi 3-4 xil salbiy iboradan
    // BIR NECHTASI BIRGALIKDA (izoh + Badge + yana izoh) ko'rsatilardi.
    trackingImprovesLabel: "Sikllaringizni kuzatgan sari aniqroq bo'ladi",
    // CYCLE-ALGO-07: aniq sana o'rniga diapazon — past/o'rta ishonchda
    // haqiqiy noaniqlikni yashirmaslik uchun ("13-16 kun" o'rniga bitta
    // "13 kun" degan soxta aniqlik taassuroti bermaslik). OVERNIGHT-23'dan
    // buyon bu ASOSIY sarlavhaning o'zi (aniq kun-soni bilan bir vaqtda
    // hech qachon emas — past ishonchda faqat shu, yuqori ishonchda esa
    // faqat `nextPeriodIn`).
    nextPeriodRangeLabel: (earliest: string, latest: string) => `${earliest}–${latest} oralig'ida kutilmoqda`,
    articlesCardTitle: "Qiziqarli maqolalar",
    riskQuizCardTitle: "O'z-o'zini tekshirish testi",
    riskQuizCardSubtitle: "2 daqiqada sog'lig'ingizni yaxshiroq tushuning",
    cycleLengthLabel: "Sikl uzunligi",
    periodLengthLabel: "Hayz davomiyligi",
    calendarTitle: "Kalendar",
    // CAL-01 — to'liq ekranli kalendar.
    calTapHint: "Hayz boshlangan kunga bosing — keyingi kunlar avtomatik belgilanadi. Xato bo'lsa, o'sha kunga qayta bosing.",
    calEditPeriod: "Hayz sanalarini tahrirlash",
    calEditHint: (days: number) =>
      `Hayz boshlangan kunga bosing — ${days} kun avtomatik belgilanadi (bugundan nariga o'tmaydi). Belgilangan kunlar yoniga bosilsa faqat o'sha bitta kun qo'shiladi, ustiga yana bosilsa olib tashlanadi.`,
    calCycleDay: (day: number) => `Sikl ${day}-kuni`,
    calSymptomsTitle: "Simptomlar va faoliyat",
    calNothingLogged: "Vazn, kayfiyat va simptom qo'shish",
    calAddLog: "Qo'shish",
    calMonthTab: "Oy",
    calYearTab: "Yil",
    calBackToToday: "Bugunga qaytish",
    editLastPeriodLabel: "Oxirgi hayz sanasini o'zgartirish",
    daysUnit: (n: number) => `${n} kun`,
    recentLogsTitle: "So'nggi yozuvlar",
    viewAllLogsLabel: "Barchasini ko'rish",
    addLogButton: "+ Yozuv qo'shish",
    todayLabel: "Bugun",
    yesterdayLabel: "Kecha",
    daysAgoLabel: (n: number) => `${n} kun oldin`,
    noLogsYet: "Hozircha yozuv yo'q — birinchi kunlik yozuvingizni qo'shing",
    // OVERNIGHT-17: 7 kunlik chiziqdan bir sana bosilganda (kalendar
    // ochilmasdan) o'sha kun uchun ko'rsatiladigan qisqa karta.
    dayDetailEmptyLabel: "Bu kunga hech narsa qayd etilmagan",
    dayDetailLogButton: "Bu kunni belgilash",
    moodCheckinTitle: "Bugun o'zingizni qanday his qilyapsiz?",
    dailyInsightsTitle: "Kunlik maslahatlar",
    /** SUMMARY-01: "Mening sikllarim" — faqat QAYD ETILGAN narsani
     * o'lchaydi, bashorat emas. Ma'lumot yetmasa raqam o'rniga taklif. */
    myCyclesTitle: "Mening sikllarim",
    myCyclesPreviousCycle: "Oldingi sikl uzunligi",
    myCyclesPreviousPeriod: "Oldingi hayz davomiyligi",
    myCyclesVariation: "Sikl uzunligi o'zgarishi",
    myCyclesRange: (min: number, max: number) => `${min}–${max} kun`,
    myCyclesEmpty: "Hayzingizni belgilang — sikllaringiz tahlili shu yerda paydo bo'ladi.",
    myCyclesLogCta: "Hayzni belgilash",
    myCyclesStatusNormal: "Odatiy",
    myCyclesStatusShort: "Qisqa",
    myCyclesStatusLong: "Uzun",
    myCyclesStatusRegular: "Muntazam",
    myCyclesStatusIrregular: "Tartibsiz",
    /** HISTORY-01: "Sikl tarixi" — o'tgan sikllar va ularning shakli. */
    cycleHistoryTitle: "Sikl tarixi",
    cycleHistoryCurrent: (days: number) => `Joriy sikl: ${days} kun`,
    cycleHistoryStarted: (date: string) => `${date} dan boshlandi`,
    cycleHistoryLegendFertile: "Unumdor kunlar",
    /** PATTERN-01: "Simptom naqshlarim". Da'vo faqat yetarli ma'lumot
     * bo'lganda qilinadi — aks holda shunchaki son aytiladi. */
    symptomPatternsTitle: "Simptom naqshlarim",
    symptomPatternDominant: (symptom: string, phase: string) =>
      `Siz "${symptom}"ni asosan ${phase} davrida belgilagansiz.`,
    symptomPatternNotEnough: (count: number) =>
      `${count} marta belgilangan — naqsh haqida gapirish uchun hali kam.`,
    symptomPatternsEmptyTitle: "Simptomlaringizni kuzating",
    symptomPatternsEmptyBullets: [
      "Bir necha sikl bo'ylab xaritada ko'rasiz",
      "Takrorlanuvchi naqsh bor-yo'qligini bilasiz",
      "Shifokorga aniq ma'lumot bilan borasiz",
    ],
    symptomPatternsEmptyCta: "Simptom belgilash",
    /** REUSE-01: o'z-o'zini tekshirish kartasi endi NATIJANI ko'rsatadi. */
    selfCheckLastResult: "Oxirgi natija",
    selfCheckUpdated: (date: string) => `${date} da`,
    selfCheckDisclaimer: "Bu — tashxis emas. Natija faqat siz bergan javoblarga asoslangan; tashvishlansangiz shifokorga murojaat qiling.",
    // 2026-09-18: "yozib berilgan shaxsiy maslahat" ohangiga o'zgartirildi
    // (foydalanuvchi so'rovi: "yaqin do'st/hamshira yozganday" — lekin
    // mazmun/aniqlik o'zgarmaydi, faqat ohang, hech qachon "chiroyli yolg'on"ga
    // aylanmasin).
    dailyInsights: {
      phase_menstrual: {
        title: "Hayz kunlaringiz",
        body: "Bugun o'zingizni charchoqroq his qilishingiz tabiiy — tanangizga dam bering, issiq narsa iching va shoshilmang.",
      },
      phase_follicular: {
        title: "Kuch-quvvat oshmoqda",
        body: "Energiyangiz asta-sekin ko'tarilyapti — bugun rejalaringizni amalga oshirish uchun ajoyib payt.",
      },
      phase_ovulation: {
        title: "Eng faol kunlaringiz",
        body: "Hozir tanangiz eng faol holatda — o'zingizni tinglang, bu davr ko'pchilikda yaxshi kayfiyat bilan kechadi.",
      },
      phase_luteal: {
        title: "O'zingizga yumshoqroq bo'ling",
        body: "Kayfiyat biroz o'zgarishi mumkin — bu me'yorda, shunchaki bugun o'zingizga nisbatan mehribonroq bo'ling.",
      },
      hydration: {
        title: "Bir stakan suv ichdingizmi?",
        body: "Kuniga yetarlicha suv ichish o'zingizni yengil va tetik his qilishga yordam beradi — hozir eslatib qo'yaylik dedik.",
      },
      sleep: {
        title: "Bugun erta yotishga harakat qiling",
        body: "Sifatli uyqu gormonlaringizga ham, kayfiyatingizga ham yaxshi ta'sir qiladi — tanangiz buni his qiladi.",
      },
      nutrition: {
        title: "Tanangizni quvvatlantiring",
        body: "Temir va magniyga boy ovqatlar charchoqni kamaytirishga yordam beradi — bugun bir hovuch yong'oq yoki ismaloq qo'shib ko'ring.",
      },
      self_care: {
        title: "O'zingiz uchun bir daqiqa ajrating",
        body: "Kichkina tanaffus ham katta farq qiladi — bugun o'zingiz uchun yoqimli biror narsa qiling.",
      },
      ai_assistant: {
        title: "Savolingiz bo'lsa, shu yerdaman",
        body: "AI Yordamchi tarixingizni eslab qoladi va tushunarli tilda javob beradi — istalgan payt so'rang.",
      },
    },
    detailedLogButton: "Batafsil kiritish",
    /** CYCLE-002: xato qayd etilgan kunni butunlay o'chirish tugmasi. */
    deleteLogButton: "Bu yozuvni o'chirish",
    /** FIX-08: o'chirishdan oldin tasdiqlash so'raladi (post/comment o'chirishdagi bilan bir xil). */
    deleteLogConfirm: "Bu yozuvni butunlay o'chirishni tasdiqlaysizmi?",
    calendarLegendPeriod: "Hayz",
    calendarLegendFollicular: "Follikulyar",
    calendarLegendOvulation: "Ovulyatsiya",
    calendarLegendLuteal: "Lyuteal",
    selectedDayFertility: "Unumdorlik",
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
    moodResponses: {
      happy: "Ajoyib kayfiyat!",
      calm: "Xotirjam va tinch kayfiyatdasiz",
      tired: "Charchagan ko'rinasiz — dam olishni unutmang",
      sad: "G'amgin kayfiyatdasiz, o'zingizga g'amxo'rlik qiling",
      irritable: "Asabiylashgan ko'rinasiz — chuqur nafas oling",
      anxious: "Xavotirlanayotganga o'xshaysiz — hammasi yaxshi bo'ladi",
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
      hot_flashes: "Issiqlik bosishi",
      night_sweats: "Tungi terlash",
      ovulation_pain: "Ovulyatsiya og'rig'i",
      cervical_mucus_change: "Shilliq qavati o'zgarishi",
    },
  },

  // Tsikl fazasi kartasi (CycleRing ostida) — Figma "Make" manbasidagi haqiqiy
  // iboralarga asoslangan ("Tuxum hujayra chiqadi", "Progesteron oshadi").
  // Tavsiflar ATAYLAB gormon nomi + kayfiyatga ta'siri + aniq harakat
  // taklifini o'z ichiga oladi (foydalanuvchi so'rovi: "shu fazada shu
  // gormon tufayli bo'lishi mumkin, shuning uchun shunaqa narsalar qilish
  // kerak" — asabiylashish/stress/tushkunlik xarakter emas, gormonal
  // ekanligini tushuntirish + konkret o'z-o'ziga g'amxo'rlik tavsiyasi).
  cyclePhase: {
    menstrual: {
      name: "Hayz fazasi",
      description:
        "Estrogen va progesteron darajasi eng past nuqtada — shuning uchun charchoq, asabiylashish yoki birozgina tushkunlik hissi hozir gormonal va tabiiy holat. Issiq choy, erta uxlash va yengil mashqlar yordam beradi.",
    },
    follicular: {
      name: "Follikul fazasi",
      description:
        "Estrogen darajasi asta ko'tarilmoqda — energiya va kayfiyat odatda kun sayin yaxshilanadi. Bu davr yangi ishlarni boshlash, faol mashqlar va uchrashuvlar uchun qulay.",
    },
    ovulation: {
      name: "Ovulyatsiya",
      description:
        "Estrogen eng yuqori nuqtada, testosteron ham biroz oshadi — o'zingizni ishonchli va energik his qilishingiz mumkin. Lekin ovulyatsiyadan keyin gormon darajasi keskin tushishi mumkin — buni oldindan bilib, o'zingizga yumshoq munosabatda bo'ling.",
    },
    luteal: {
      name: "Lyuteal faza",
      description:
        "Progesteron ko'tariladi, so'ng hayzdan oldin ikkala gormon ham keskin pasayadi — shu davrdagi asabiylashish, stress yoki tushkunlik ko'pincha aynan shu gormonal tebranish tufayli, xarakteringiz emas. Kofein/tuzni kamaytirish, magniyga boy ovqat va yetarli uyqu simptomlarni yengillashtiradi.",
    },
    fertilityLabel: "Unumdorlik darajasi",
    fertilityLevels: {
      low: "Past",
      medium: "O'rtacha",
      high: "Yuqori",
    },
  },

  // "Sog'liqni nazorat qilish" (wellbeing) rejimi — kunlik suv/kaloriya kartasi.
  wellness: {
    cardTitle: "Bugungi kuzatuv",
    waterLabel: "Suv ichish",
    waterProgress: (ml: number, targetMl: number) => `${ml} / ${targetMl} ml`,
    addGlassButton: "+ 1 stakan (250 ml)",
    caloriesLabel: "Kaloriya",
    caloriesUnit: (kcal: number) => `${kcal} kkal`,
    addCaloriesButton: "+ Kaloriya qo'shish",
    addCaloriesPlaceholder: "Masalan: 350",
  },

  gamification: {
    cycleScreenStreakPill: (days: number) => `🔥 ${days} kun`,
    achievementsTitle: "Yutuqlar",
    currentStreakLabel: "Joriy ketma-ketlik",
    longestStreakLabel: "Eng uzun ketma-ketlik",
    totalLogsLabel: "Jami yozuvlar",
    daysUnit: "kun",
    badges: {
      first_log: { name: "Birinchi qadam", desc: "Birinchi kunlik yozuvingizni qo'shdingiz" },
      week_streak: { name: "1 haftalik", desc: "7 kun ketma-ket kuzatuv" },
      month_streak: { name: "1 oylik", desc: "30 kun ketma-ket kuzatuv" },
      hundred_logs: { name: "100 ta yozuv", desc: "Jami 100 ta kunlik yozuv" },
      loyal_90: { name: "Sodiq kuzatuvchi", desc: "90 kun ketma-ket kuzatuv" },
    },
  },

  pregnancy: {
    title: "Homiladorlik",
    weekLabel: (week: number) => `${week}-hafta`,
    daysRemaining: (days: number) => `Tug'ilishga ${days} kun qoldi`,
    trimester: (t: number) => `${t}-trimestr`,
    sizeComparison: (size: string) => `Bolangiz hozir ${size} kattaligida`,
    earlyWeekNote: "Hisob oxirgi hayzingizning birinchi kunidan boshlanadi — bu haftada urug'lanish hali sodir bo'lmagan",
    visitsTitle: "Tashrif va eslatmalar",
    addVisitButton: "Tashrif qo'shish",
    kickCounterTitle: "Tepki hisoblagich",
    kickCounterButton: "Tepki qayd etish",
    kickCounterCount: (n: number) => `Bugun: ${n} ta tepki`,
    articlesCardTitle: "Qiziqarli maqolalar",
    completedWeekLabel: "O'tgan hafta",
    remainingWeekLabel: "Qolgan hafta",
    // CONTENT-001 — admin panel orqali tahrirlanadigan haftalik kontent sarlavhalari.
    babyDevelopmentTitle: "Chaqalog'ingiz bu hafta",
    motherChangesTitle: "Sizda nima o'zgaradi",
    vitalsTitle: "Sog'liq ko'rsatkichlari",
    vitalsDisclaimer: "O'zingiz kiritgan qiymatlar — tibbiy asbobdan emas. Bu tibbiy tashxis emas.",
    vitalsLabels: {
      heart_rate: "Yurak urishi",
      blood_pressure: "Qon bosimi",
      weight: "Vazn",
      temperature: "Harorat",
    },
    vitalsUnits: {
      heart_rate: "ur/min",
      blood_pressure: "mmHg",
      weight: "kg",
      temperature: "°C",
    },
    vitalsPlaceholders: {
      heart_rate: "72",
      blood_pressure: "115/75",
      weight: "62.5",
      temperature: "36.6",
    },
    vitalsEmpty: "Kiritilmagan",
    vitalsNormal: "Normal",
    vitalsAttention: "E'tibor bering",
    vitalsAddTitle: "Qiymatni kiriting",
    vitalsInvalidFormat: "Format noto'g'ri, qayta urinib ko'ring",
    vitalsWeightChange: (delta: number) => `${delta > 0 ? "+" : ""}${delta} kg`,
    nextCheckupTitle: "Keyingi ko'rik",
    nextCheckupNone: "Rejalashtirilgan ko'rik yo'q",
    nextCheckupDaysLeft: (days: number) => (days === 0 ? "Bugun" : days === 1 ? "Ertaga" : `${days} kun qoldi`),
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
    albumTitle: "Homiladorlik albomi",
    albumSubtitle: "Qorin/chaqaloq rasmingizni yuklang — har hafta uchun chiroyli xotira",
    albumAddButton: "Rasm qo'shish",
    albumUploading: "Yuklanmoqda…",
    albumEmpty: "Hali rasm yo'q — birinchisini qo'shing",
    albumWeekBadge: (week: number) => `${week}-hafta`,
    albumNoWeek: "Hafta belgilanmagan",
    albumDeleteConfirm: "Bu rasmni o'chirmoqchimisiz?",
    albumUploadError: "Rasm yuklashda xatolik yuz berdi",
    albumInvalidFormat: "Faqat rasm fayllari (JPEG/PNG) qabul qilinadi — video yuklab bo'lmaydi",
    albumNoteLabel: "Izoh (ixtiyoriy)",
    albumNotePlaceholder: "Masalan: bugun birinchi tepkini his qildim…",
  },

  /** PROFILE-01: onboarding'dan KEYIN, tekshiruvlar ekranida so'raladigan
   * savollar. Onboarding allaqachon uzun — bu savollar javobning foydasi
   * ko'rinib turgan joyda beriladi. */
  profileQuestions: {
    cardTitle: "Ro'yxatingizni aniqlashtiring",
    cardBody: "Bir nechta savol — javoblaringiz qaysi tekshiruvlar aynan sizga kerakligini aniqlaydi.",
    cardCta: "Boshlash",
    cardLater: "Keyinroq",
    progress: (current: number, total: number) => `${current}/${total}`,
    skip: "O'tkazib yuborish",
    done: "Rahmat! Ro'yxatingiz yangilandi.",
    questions: {
      sexuallyActive: {
        title: "Jinsiy hayot boshlanganmi?",
        hint: "Bu savol bachadon bo'yni skrininggi va bir nechta boshqa tekshiruv sizga kerakmi-yo'qligini aniqlaydi. Javob bermasangiz ham bo'ladi.",
      },
      familyHistory: {
        title: "Oilangizda ko'krak yoki tuxumdon saratoni bo'lganmi?",
        hint: "Ona, opa-singil yoki qizda bo'lgan bo'lsa — mammografiya 40 emas, 30 yoshdan tavsiya etiladi.",
      },
      hpvVaccinated: {
        title: "HPV (OPV) vaksinasini olganmisiz?",
        hint: "Olgan bo'lsangiz, uni ro'yxatdan olib tashlaymiz — bajarilgan ishni qayta eslatmaymiz.",
      },
      hormonalContraception: {
        title: "Gormonal kontratseptsiya ishlatasizmi?",
        hint: "Tabletka, spiral, in'ektsiya va h.k. Ishlatsangiz, unumdor kunlar bashorati sizga to'g'ri kelmaydi — uni ko'rsatmaymiz.",
      },
      smokes: {
        title: "Chekasizmi?",
        hint: "Chekish bachadon bo'yni saratoni xavfini oshiradi — JSST buni tasdiqlangan omil deb belgilaydi.",
      },
      hasGivenBirth: {
        title: "Tug'gansizmi?",
        hint: "Tug'ish tarixi ko'krak va tuxumdon saratoni xavfiga ta'sir qiladi.",
      },
      chronicConditions: {
        title: "Quyidagilardan biri bormi?",
        hint: "Ginekologik bo'lmagan, lekin rejaga ta'sir qiladigan holatlar.",
        options: {
          diabetes: "Qandli diabet",
          hypertension: "Yuqori qon bosimi",
          thyroid: "Qalqonsimon bez kasalligi",
          anemia: "Kamqonlik",
          none: "Hech qaysi",
        },
      },
    },
  },

  checklist: {
    title: "Tekshiruv ro'yxati",
    // UX-01: ilgari bu holat shunchaki "—" belgisi bilan ko'rsatilardi.
    emptyTitle: "Hozircha tekshiruv yo'q",
    emptyMessage: "Bu odatiy holat — profilingizga mos tavsiyalar keyinroq paydo bo'lishi mumkin.",
    statusPending: "Kutilmoqda",
    statusDone: "Bajarildi",
    statusOverdue: "Muddati o'tgan",
    markDoneButton: "Bajardim",
    findClinicButton: "Klinika topish",
    riskQuizCardTitle: "O'z-o'zini tekshirish testi",
    partnerTitle: (name: string) => `${name}ning tekshiruvlari`,
    partnerNotLinked: "Hali hamkoringiz ulanmagan — \"Juft\" bo'limidan ulaning.",
    partnerNotShared: "Hamkoringiz tekshiruv ma'lumotini hali ulashmagan.",
    // FIX-CHECKUPS: davlat dasturi (majburiy minimum) va tavsiya etilgan
    // muddat farq qiladigan bandlar uchun ikkinchi (ma'lumot xarakteridagi)
    // belgi — checklist-rules.ts#CHECKUP_OFFICIAL_TRACK.
    officialTrackLabel: (minAge: number, maxAge: number, frequency: string) => `Davlat dasturi: ${minAge}-${maxAge} yosh, ${frequency}`,
    frequencyLabels: {
      every_2_years: "2 yilda 1 marta",
      every_3_years: "3 yilda 1 marta",
    },
    categoryLabels: {
      screening: "Skrining",
      vaccination: "Vaksinatsiya",
      lab: "Laboratoriya",
      imaging: "Tasvirga olish",
      consultation: "Konsultatsiya",
      self_exam: "O'z-o'zini tekshirish",
      pregnancy: "Homiladorlik",
      postpartum: "Tug'ruqdan keyin",
    },
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
      // --- FIX-CHECKUPS: yangi, real manbaga asoslangan bandlar ---
      annual_preventive_exam: {
        title: "Yillik profilaktik ko'rik (oilaviy shifokor)",
        why: "Kamqonlik, qalqonsimon bez muammolari yoki homiladorlikka to'siq bo'ladigan holatlar yillar davomida bilinmasdan qolishi mumkin.",
      },
      first_gyn_visit: {
        title: "Birinchi ginekolog tashrifi",
        why: "Erta tashrif kelajakda ginekologik parvarishga o'rganishga yordam beradi; hayz buzilishlari yoki tug'ma muammolar o'z vaqtida aniqlanadi.",
      },
      hpv_vaccination: {
        title: "OPV (HPV) vaksinatsiyasi",
        why: "9-14 yoshda eng samarali — kech qolinsa vaksina samaradorligi pasayadi; davolanmagan HPV bachadon bo'yni saratonining asosiy sababi.",
      },
      pelvic_exam_speculum: {
        title: "Kreslodagi ginekologik ko'rik",
        why: "Ko'zga tashlanadigan o'zgarishlar (polip, eroziya, erta shikastlanishlar) belgi bermaguncha sezilmay qolishi mumkin.",
      },
      flora_smear: {
        title: "Flora uchun surtma",
        why: "Davolanmagan bakterial nomutanosiblik yoki infeksiya bachadon/naychalarga (PID) tarqalishi yoki muddatidan oldin tug'ilishga sabab bo'lishi mumkin.",
      },
      cervical_cancer_screening: {
        title: "Bachadon bo'yni saratoni skrininggi (Pap-test / onkotsitologiya)",
        why: "Bachadon bo'yni saratoni sekin rivojlanadi va oldi-saraton bosqichida aniqlansa deyarli to'liq oldini olish mumkin — bu ro'yxatdagi eng katta oldini olsa bo'ladigan xavf.",
      },
      pelvic_ultrasound: {
        title: "Kichik chanoq a'zolari UTT",
        why: "Mioma, kista yoki endometriy o'zgarishlari og'riq, qon ketish yoki bepushtlikka olib kelmaguncha yillar davomida sezilmasdan o'sishi mumkin.",
      },
      breast_self_exam: {
        title: "Ko'krak bezini o'z-o'zidan tekshirish",
        why: "O'z-o'zidan topilgan tugunchalar odatda muntazam tekshirishga qaraganda kechroq aniqlanadi — bu davolashning eng sodda bosqichidagi imkoniyatni orqaga suradi.",
      },
      clinical_breast_exam: {
        title: "Shifokor tomonidan ko'krak bezi ko'rigi",
        why: "Tajribali shifokor o'z-o'zini tekshirishda sezilmaydigan o'zgarishlarni aniqlaydi.",
      },
      breast_cancer_screening_mammography: {
        title: "Ko'krak bezi saratoni skrininggi (mammografiya)",
        why: "Mammografiya o'sma qo'l bilan sezilgunga qadar uni aniqlaydi — tavsiya etilgan yoshdan kechiktirish kech bosqichda aniqlanish xavfini oshiradi.",
      },
      sti_panel: {
        title: "JYYI (STI) tekshiruvlari",
        why: "Ko'pgina JYYI (xlamidioz, gonoreya) belgisiz kechadi; davolanmasa bachadon yallig'lanishi, naychalar shikastlanishi, bepushtlik va naycha homiladorligi xavfini oshiradi.",
      },
      contraception_counseling: {
        title: "Kontratseptsiya bo'yicha maslahat",
        why: "Shifokor maslahatisiz tanlangan usul samarasizlik va nojo'ya ta'sir xavfini oshiradi.",
      },
      preconception_checkup: {
        title: "Homiladorlikni rejalashtirish tekshiruvi",
        why: "Aniqlanmagan kamqonlik, qalqonsimon bez buzilishi yoki qizamiqchaga immunitet yo'qligi — bularning barchasi faqat folik kislota qabul qilish bilan bartaraf etilmaydigan homiladorlik xavflarini oshiradi.",
      },
      prenatal_screening_stage1: {
        title: "Homiladorlik skrininggi — 1-bosqich (UTT)",
        why: "Bu oynani o'tkazib yuborish tug'ma nuqsonlar xavfini keyinroq aniqlashga olib keladi, bu esa keyingi tekshiruv va parvarish rejalashtirish imkoniyatlarini toraytiradi.",
      },
      prenatal_screening_stage1b: {
        title: "Homiladorlik skrininggi — 1-bosqich, 2-ko'rik (UTT)",
        why: "1-bosqichdagi kabi — tuzilma nuqsonlarini kech aniqlash asosli qaror qabul qilish va mutaxassisga yo'llash imkoniyatini toraytiradi.",
      },
      prenatal_screening_stage1c: {
        title: "Homiladorlik skrininggi — 1-bosqich, 3-ko'rik (UTT)",
        why: "Kech namoyon bo'ladigan o'sish orqada qolishi yoki funktsional muammolar payqalmasdan qolishi, aralashuv kechikishi mumkin.",
      },
      pregnancy_patronage_visit: {
        title: "Homiladorlik patronaji (doya tashrifi)",
        why: "Qon bosimi ko'tarilishi (preeklampsiya), o'sish muammolari yoki ona salomatligi muammolari klinika tashriflari orasida nazoratsiz qolishi mumkin.",
      },
      postpartum_home_visit: {
        title: "Tug'ruqdan keyingi uy tashrifi (doya, 3/15/30-kun)",
        why: "Tug'ruqdan keyingi infeksiya, qon ketish, yara bitmasligi yoki ruhiy holat yomonlashishi rejalashtirilgan tekshiruvsiz sezilmay qolishi mumkin.",
      },
      menopause_checkup: {
        title: "Klimakteriya / menopauza tekshiruvi (Kabinet 45+)",
        why: "Bu yoshda aniqlanmagan osteoporoz, yurak-qon tomir xavfining o'zgarishi va endometriy/tuxumdon saratoni xavfi ortishi nazoratsiz qolishi mumkin.",
      },
      torch_panel: {
        title: "TORCH infeksiyalari tekshiruvi",
        why: "Faol toksoplazmoz, qizamiqchaga immunitet yo'qligi yoki birlamchi CMV infeksiyasi homiladorlik davrida abort va tug'ma nuqson xavfini oshiradi; qizamiqcha vaksinasi faqat homiladorlikdan OLDIN berilishi mumkin.",
      },
      group_b_strep_screening: {
        title: "B guruh streptokokk (GBS) tekshiruvi",
        why: "GBS onaga zararsiz, lekin tug'ish paytida antibiotiksiz chaqaloqda jiddiy infeksiyaga sabab bo'lishi mumkin.",
      },
      gestational_diabetes_screening: {
        title: "Homiladorlik davridagi qandli diabet skrininggi (glyukoza tolerantlik testi)",
        why: "Aniqlanmagan gestatsion diabet homilaning haddan tashqari kattalashishi, og'ir tug'ruq va onada keyinchalik 2-tur diabet xavfini oshiradi. Aynan shu oynada aniqlansa, parhez va kuzatuv bilan boshqarish mumkin.",
      },
      postpartum_6week_checkup: {
        title: "Tug'ruqdan keyingi 6-haftalik tekshiruv",
        why: "Rasmiy uy tashriflari 30-kunda tugaydi. Aynan shu tashrifda yangi homiladorlik xavfi (hayz tiklanishidan oldin), bitmagan asoratlar va ruhiy holat muammolari aniqlanadi — o'tkazib yuborilsa, ular ko'pincha umuman sezilmay qoladi.",
      },
      postpartum_depression_screening: {
        title: "Tug'ruqdan keyingi depressiya skrininggi",
        why: "Tug'ruqdan keyingi depressiya keng tarqalgan, lekin kam tan olinadi. Davolanmasa, u onaning o'z holatiga ham, chaqaloq bilan aloqasi va rivojlanishiga ham ta'sir qiladi. Buni ona o'zi aytishini kutmasdan, to'g'ridan-to'g'ri so'rash kerak.",
      },
      thyroid_function_test: {
        title: "Qalqonsimon bez funktsiyasi tahlili (TSH)",
        why: "Aniqlanmagan qalqonsimon bez buzilishi — tartibsiz sikl, homilador bo'lolmaslik va homila tushishining keng tarqalgan, DAVOLASA BO'LADIGAN sababi. Perimenopauzada ham ko'p uchraydi va belgilari menopauzaga o'xshab ketadi, ya'ni tekshirilmasa \"tabiiy o'zgarish\" deb o'tkazib yuboriladi.",
      },
      rubella_immunity_check: {
        title: "Qizamiqchaga (rubella) qarshi immunitet tekshiruvi",
        why: "Immunitet bo'lmasa va homiladorlikning erta davrida yuqsa — og'ir tug'ma nuqsonlar xavfi yuqori. Vaktsinani homilador bo'lgach QILIB BO'LMAYDI, shuning uchun bu faqat oldindan qilinadigan ish.",
      },
      colorectal_cancer_screening: {
        title: "Yo'g'on ichak saratoni skrininggi",
        why: "Ginekologik tekshiruv emas, lekin 45 yoshdan keyingi standart skrining. Erta bosqichda aniqlansa davolash ancha oson, kech bosqichda esa ancha og'ir.",
      },
      bv_targeted_screening: {
        title: "Bakterial vaginoz uchun maqsadli tekshiruv",
        why: "Davolanmagan bakterial vaginoz muddatidan oldin tug'ilish va homiladorlik yo'qotilishi bilan bog'liq; ko'pincha belgisiz kechadi, shuning uchun faqat belgilarga tayanish ko'p holatlarni o'tkazib yuboradi.",
      },
    },
  },

  clinics: {
    title: "Klinikalar",
    listView: "Ro'yxat",
    mapView: "Xarita",
    filterAll: "Barchasi",
    searchPlaceholder: "Klinika yoki manzil...",
    specialties: {
      gynecology: "Ginekologiya",
      oncology: "Onkologiya",
      radiology: "Radiologiya",
      general: "Umumiy",
      endocrinology: "Endokrinologiya",
      reproductology: "Reproduktologiya",
      laparoscopy: "Laparoskopiya",
    },
    freeScreeningBadge: "Bepul skrining",
    topClinicBadge: "Top klinika",
    callButton: "Qo'ng'iroq",
    directionsButton: "Yo'nalish",
    // FIX-UX-06: "namunaviy"/"hali to'ldirilmoqda" ("tugallanmagan mahsulot")
    // taassurotini qoldiruvchi matn ishonch beruvchi shaklga o'zgartirildi —
    // production'dagi haqiqiy foydalanuvchilarga ko'rsatiladi.
    seedDataNotice: "Klinikalar bazasi tez-tez yangilanib boradi.",
    distanceKm: (km: number) => `${km.toFixed(1)} km`,
    foundCountLabel: "Topildi",
    // OVERNIGHT-18: "eng yaqinlarini topish" — brauzer geolokatsiyasi orqali.
    nearestToggleLabel: "Eng yaqinlari",
    nearestLocatingLabel: "Joylashuv aniqlanmoqda…",
    nearestDeniedLabel: "Joylashuvga ruxsat berilmadi — brauzer sozlamalaridan yoqing",
    nearestUnsupportedLabel: "Bu qurilmada joylashuvni aniqlab bo'lmaydi",
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
    seedDataNotice: "Kontent tez-tez yangilanib boradi.",
    categories: {
      cycle: "Hayz sikli",
      pregnancy: "Homiladorlik",
      checkups: "Tekshiruvlar",
    },
  },

  community: {
    title: "Jamiyat",
    subtitle: "Boshqa ayollar bilan tajriba va fikr almashing",
    statsMembers: "a'zo",
    statsPosts: "post",
    statsToday: "bugun",
    filterAll: "Barchasi",
    tags: {
      cycle: "Hayz va sikl",
      pregnancy: "Homiladorlik",
      discharge: "Ajralmalar va infeksiya",
      ttc: "Homilador bo'lish",
      postpartum: "Tug'ruqdan keyin",
      mental: "Ruhiy holat",
      general: "Boshqa",
      checkups: "Tekshiruvlar",
    },
    writePostButton: "Fikr bildirish",
    writePostTitle: "Yangi post",
    writePostPlaceholder: "Fikringizni, savolingizni yoki tajribangizni yozing...",
    writePostTagLabel: "Mavzu",
    postAnonymouslyLabel: "Anonim sifatida yuborish",
    publishButton: "Joylash",
    publishing: "Joylanmoqda...",
    anonymousAuthor: "Anonim a'zo",
    /** COMM-01: post ekranida izohlar bo'sh bo'lganda. */
    noCommentsYet: "Hali izoh yo'q — birinchi bo'lib javob bering.",
    /** COMM-02: lenta yorliqlari. */
    tabForum: "Forum",
    /** COMM-04: lenta tepasidagi ogohlantirish. Sog'liq jamiyatida bu
     * bezak emas — savollar tibbiy va noto'g'ri javob zarar keltirishi
     * mumkin. */
    moderationNotice: "Ayollarning shaxsiy tajribasi — tibbiy maslahat emas. Tashvishlansangiz shifokorga murojaat qiling.",
    tabMyQuestions: "Savollarim",
    tabMyAnswers: "Javoblarim",
    emptyMyQuestions: "Hali savol bermabsiz. Savolingiz bo'lsa — so'rang, jamiyat javob beradi.",
    emptyMyAnswers: "Hali hech kimga javob bermabsiz. Bilganingizni bo'lishing — kimgadir juda asqotadi.",
    likeButton: "Yoqtirish",
    commentButton: "Izoh",
    shareButton: "Ulashish",
    commentsTitle: "Izohlar",
    commentPlaceholder: "Izoh yozing...",
    sendCommentButton: "Yuborish",
    emptyFeed: "Hozircha post yo'q — birinchi bo'lib fikringizni yozing!",
    // FIX-UX-04: "all" bo'lmagan filtr ostida bo'sh bo'lganda alohida matn —
    // jamiyat umuman bo'sh degan noto'g'ri taassurot qoldirmaslik uchun
    // (boshqa bo'limlarda post bor bo'lishi mumkin).
    emptyFeedFiltered: "Bu bo'limda hali post yo'q — 'Barchasi'ni ko'ring yoki birinchi bo'lib yozing",
    viewAllButton: "Barchasini ko'rish",
    emptyComments: "Hozircha izoh yo'q — birinchi bo'ling",
    deletePostConfirm: "Bu postni butunlay o'chirishni tasdiqlaysizmi?",
    deletePostButton: "O'chirish",
    deleteCommentConfirm: "Bu izohni o'chirishni tasdiqlaysizmi?",
    justNow: "Hozirgina",
    minutesAgo: (n: number) => `${n} daqiqa oldin`,
    hoursAgo: (n: number) => `${n} soat oldin`,
    daysAgo: (n: number) => `${n} kun oldin`,
    shareAppNameLabel: "MammoAI hamjamiyati",
    shareLinkCopied: "Nusxalandi",
    postTooShort: "Kamida bir necha so'z yozing",
    // FIX2-22: ilgari boshqa ekranlar dict.*.errorKey ishlatgani holda, bu
    // yerda qattiq yozilgan o'zbekcha "Xatolik" so'zi fallback sifatida
    // ishlatilardi.
    genericError: "Xatolik yuz berdi",
    loadMoreButton: "Ko'proq yuklash",
    notificationsTitle: "Bildirishnomalar",
    notificationCommentText: (name: string) => `${name} postingizga izoh qoldirdi`,
    notificationsEmpty: "Hozircha bildirishnoma yo'q",
    markAllReadButton: "Barchasini o'qilgan deb belgilash",
    // COMM-001 — moderatsiya (shikoyat, bloklash, tibbiy-shoshilinch ogohlantirish).
    moreOptionsLabel: "Ko'proq",
    reportButton: "Shikoyat qilish",
    blockAuthorButton: "Muallifni bloklash",
    blockAuthorConfirm: "Bu foydalanuvchining barcha postlari/izohlari sizga endi ko'rinmaydi. Davom etasizmi?",
    blockAuthorSuccess: "Bloklandi — bu foydalanuvchining kontenti endi sizga ko'rinmaydi",
    reportDialogTitle: "Nima uchun shikoyat qilyapsiz?",
    reportReasons: {
      spam: "Spam yoki reklama",
      harassment: "Haqorat yoki tahdid",
      misinformation: "Noto'g'ri/zararli ma'lumot",
      medical_emergency: "Shoshilinch tibbiy holat",
      other: "Boshqa sabab",
    },
    reportNotePlaceholder: "Qo'shimcha izoh (ixtiyoriy)",
    reportSubmitButton: "Yuborish",
    reportSuccess: "Shikoyatingiz qabul qilindi — moderatorlar tez orada ko'rib chiqadi",
    medicalConcernBanner: "⚕️ Bu shoshilinch tibbiy holatga o'xshaydi — iltimos, shifokorga yoki tez tibbiy yordamga murojaat qiling. Jamiyatdagi javoblar tibbiy maslahat emas.",
    blockedUsersTitle: "Bloklangan foydalanuvchilar",
    blockedUsersEmpty: "Hozircha hech kimni bloklamagansiz",
    unblockButton: "Blokdan chiqarish",
    blockedAnonymousLabel: "Anonim foydalanuvchi",
  },

  // Hamkor — kod orqali ikkita akkauntni bog'lash (Figma referens: "Hamkor" bo'limi).
  partner: {
    title: "Juft",
    subtitle: "Sevgilini sayohatingizga qo'shing",
    heroTitle: "Birgalikda kuzating",
    heroDescription: "Eringiz yoki yaqiningiz sog'liq ma'lumotlaringizni ko'ra olsin va sayohatingizda qo'llab-quvvatlasin",
    featureSharingTitle: "Ma'lumotlarni ulashish",
    featureSharingDescription: "Hamkoringiz homiladorlik davri, tekshiruvlar va kayfiyatingizni ko'ra oladi",
    featureRemindersTitle: "Eslatmalar",
    featureRemindersDescription: "Hamkoringiz ko'rik kunlari va muhim sanalar haqida xabarnoma oladi",
    featureMessagesTitle: "Xabarlar",
    featureMessagesDescription: "Ilovadan chiqmasdan bevosita muloqot qilish",
    connectButton: "Hamkorni ulash",
    enterCodeButton: "Kod kiritish (hamkor yubordi)",
    modalTitle: "Hamkorni ulash",
    yourCodeLabel: "Sizning kodingiz",
    sendCodeHint: "Bu kodni hamkoringizga yuboring",
    copyCodeButton: "Nusxalash",
    codeCopied: "Nusxalandi",
    copyFailed: "Nusxalab bo'lmadi — kodni qo'lda ko'chiring",
    orDivider: "— yoki —",
    codeInputPlaceholder: "Hamkor kodini kiriting...",
    connectSubmitButton: "Ulash ✓",
    connecting: "Ulanmoqda...",
    roleLabel: "Hamkor",
    messageButton: "Suhbat",
    statsButton: "Ko'rsatkichlar",
    canSeeTitle: "Hamkoringiz ko'rishi mumkin",
    shareTogglePregnancy: "Homiladorlik haftalari",
    shareToggleCheckups: "Ko'rik kunlari",
    shareToggleMood: "Kayfiyat (umumiy)",
    shareTogglePeriod: "Hayz ma'lumotlari",
    connectedToday: "Bugun ulandingiz",
    connectedDaysAgo: (n: number) => `${n} kun oldin ulandingiz`,
    disconnectButton: "Hamkordan uzilish",
    disconnectConfirm: "Hamkordan uzilishni tasdiqlaysizmi? Ulashish tarixi o'chiriladi.",
    messagePlaceholder: "Xabar yozing...",
    chatEmpty: "Hali xabar yo'q — birinchi bo'lib yozing!",
    // FIX-UX-09: xabar tarmoq xatosi bilan yuborilmasa ko'rsatiladi (draft
    // matn qayta tiklanadi, foydalanuvchiga aniq signal beriladi).
    chatSendError: "Yuborilmadi, qayta urinib ko'ring",
    statsModalTitle: "Hamkoringiz ulashgan ma'lumotlar",
    statPregnancyWeek: (n: number) => `Homiladorlik: ${n}-hafta`,
    statNextCheckupLabel: "Keyingi ko'rik",
    statMoodLabel: "Bugungi kayfiyat",
    statCycleDay: (n: number) => `Tsiklning ${n}-kuni`,
    noDataShared: "Hamkoringiz hozircha hech narsa ulashmagan",
    invalidCode: "Kod noto'g'ri yoki muddati o'tgan",
  },

  chat: {
    title: "Yordamchi",
    subtitle: "Sog'lig'ingiz haqida gaplashing — sizni eslab qoladi",
    placeholder: "Xabar yozing...",
    emptyGreeting: "Salom! Men sizning AI yordamchingizman. Sikl, kayfiyat yoki sog'lig'ingiz haqida nima demoqchisiz?",
    thinking: "Yozmoqda…",
    disclaimer: "Yordamchi tashxis qo'ymaydi va shifokor maslahati o'rnini bosmaydi.",
    patternBannerTitle: "Diqqat qiling",
    patternBannerBody: "So'nggi oylarda bir necha marta takrorlangan simptomlar bor — shifokorga ko'rinishni tavsiya qilamiz.",
    sendError: "Javob olishda xatolik yuz berdi — birozdan so'ng qayta urinib ko'ring",
    chatTab: "Suhbat",
    statisticsTab: "Statistika",
    statisticsSubtitle: "Sikl uzunligi, simptomlar va bashorat aniqligi — o'z ma'lumotingiz asosida",
    premiumTitle: "AI Yordamchi — Premium",
    premiumBody: "Sikl/homiladorlik tarixingizni eslab qoladigan AI suhbat va chuqur statistika (simptom tahlili, tendensiyalar) Premium foydalanuvchilar uchun.",
    premiumBenefit1: "AI bilan cheksiz suhbat",
    premiumBenefit2: "Takrorlanuvchi simptomlarni avtomatik aniqlash",
    premiumBenefit3: "Chuqur sikl statistikasi va tendensiyalar",
    premiumCta: "Faollashtirish uchun murojaat qilish",
    freeBannerBody: "Yordamchiga bemalol savol bering — javoblar sizning sikl va simptom tarixingizga asoslanadi.",
    freeLeft: "{n} ta bepul xabar qoldi",
    freeLastOne: "Oxirgi bepul xabaringiz",
    premiumExhaustedTitle: "Bepul xabarlaringiz tugadi",
    premiumExhaustedBody: "Yordamchi bilan suhbatni davom ettirish uchun Premium obuna kerak. Yozgan savollaringiz va javoblar saqlanib qoladi.",
    insightsEmpty: "Statistika ko'rish uchun hali yetarli ma'lumot yo'q — sikl kunlaringizni davom ettirib qayd eting.",
    cycleLengthChartTitle: "Sikl uzunligi tarixi",
    symptomFrequencyChartTitle: "Simptomlar chastotasi (so'nggi 6 oy)",
    moodDistributionChartTitle: "Kayfiyat taqsimoti (so'nggi 6 oy)",
    painDaysChartTitle: "Og'riqli kunlar / sikl",
    painDaysChartHint: "Kunlik jurnalda og'riq kuchi emas, faqat borligi qayd etiladi — shuning uchun bu son sikldagi og'riqli KUNLAR sonini bildiradi.",
    daysUnit: "kun",
    periodLengthChartTitle: "Hayz davomiyligi tarixi",
    regularityTitle: "Sikl barqarorligi",
    regularitySummary: (avg: number, variability: number) => `O'rtacha ${avg} kun (±${variability} kun farq)`,
    regularityTrendStable: "Barqaror",
    regularityTrendLengthening: "So'nggi sikllar uzayib bormoqda",
    regularityTrendShortening: "So'nggi sikllar qisqarib bormoqda",
    // DATA-ACCURACY-07: 1-2 ta aniqlangan sikldan hisoblangan "±0 kun farq"
    // matematik jihatdan to'g'ri, lekin "juda barqaror" degan noto'g'ri
    // taassurot qoldiradi — aslida shunchaki hali taqqoslash uchun yetarli
    // ma'lumot yo'q. cycle.ts'dagi PredictionConfidence'ning "past ishonch"
    // chegarasi (3 sikl) bilan bir xil chegara.
    regularityLowDataHint: "Hali kam ma'lumot — ko'proq sikl qayd etilgach, bu raqam aniqroq bo'ladi.",
    symptomPhaseChartTitle: "Simptomlar qachon kuzatiladi",
    symptomPhasePeriodLabel: "Hayz kunlarida",
    symptomPhaseOtherLabel: "Boshqa kunlarda",
    moodPhaseChartTitle: "Kayfiyat qachon o'zgaradi",
    predictionAccuracyTitle: "Bashorat aniqligi",
    predictionAccuracySummary: (avgError: number, within2Pct: number) =>
      `O'rtacha ${avgError} kun xato · ${within2Pct}% holatda ±2 kun ichida to'g'ri chiqqan`,
    predictionAccuracyHint: `So'nggi sikllarni orqaga qarab tekshirib hisoblangan — reklama emas, haqiqiy raqam.`,
    // DATA-ACCURACY-07: `cyclesEvaluated` juda kam (1-2) bo'lsa, foiz
    // ko'rinishidagi "aniqlik" (masalan "100%") aslida faqat 1 ta sinovga
    // asoslangan bo'lishi mumkin — bu haqiqiy statistik ishonchni emas.
    predictionAccuracyLowDataHint: "Hali kam sikl bilan tekshirilgan — bu raqam ko'proq ma'lumot bilan barqarorlashadi.",
    aiInsightTitle: "AI tahlili",
    // OVERNIGHT-06: jamiyat postlaridagi `community.medicalConcernBanner`
    // bilan bir xil g'oya, chat uchun — klinikalarga taklif qo'shilgan.
    medicalConcernBanner: "⚕️ Bu shoshilinch tibbiy holatga o'xshaydi — iltimos, shifokorga yoki tez tibbiy yordamga murojaat qiling.",
    medicalConcernCta: "Klinikalar ro'yxatini ko'rish",
  },

  // Kunlik eslatmalar — bot orqali (server/daily-reminders.ts) va ilova ichidagi
  // bildirishnomalar markazida bir xil matn. Faqat MAZMUNLI bo'lganda yuboriladi
  // (bugun hali belgilanmagan bo'lsa, YOKI hayz/unumdor kun yaqinlashganda) —
  // har kuni bir xil xabar yuborib zerikarli qilib yubormaslik uchun.
  reminders: {
    logToday: "Bugungi holatingizni hali belgilamadingiz. Bir daqiqa ajratib, sikl kuzatuvini davom ettiring 🌸",
    periodToday: "Bugun hayzingiz boshlanishi kutilmoqda 🩷",
    periodTomorrow: "Ertaga hayzingiz boshlanishi kutilmoqda — tayyorgarlik ko'ring 🩷",
    periodSoon: (days: number) => `${days} kundan keyin hayzingiz boshlanadi 🩷`,
    periodLate: (days: number) => `Hayzingiz ${days} kun kechikmoqda — bu me'yorda bo'lishi ham mumkin, lekin kuzatib boring 🩷`,
    // CYCLE-ALGO-12: ovulyatsiya signalini qayd etishga nozik taklif —
    // ilovaga qaytganda bashoratni aniqlashtirish imkoniyatini eslatadi.
    fertileWindow: "Siz hozir unumdor oyna ichidasiz. Ovulyatsiya belgilarini sezsangiz, ilovada belgilang — bashorat aniqroq bo'ladi 🌸",
  },

  feedback: {
    menuLabel: "Fikr bildirish",
    title: "Fikr-mulohazangiz",
    subtitle: "Ilova sizga qanday yordam berayotgani haqida gapiring",
    ratingLabel: "Umumiy bahoingiz",
    // FIX-UX-07: 1-5 raqamli tugmalar hech qanday semantik yo'nalishsiz edi
    // — foydalanuvchi 1 yomonmi yoki yaxshimi, taxmin qilardi.
    ratingWorst: "Yomon",
    ratingBest: "A'lo",
    messagePlaceholder: "Nima yoqdi? Nima yetishmayapti?",
    submitButton: "Yuborish",
    thankYou: "Rahmat! Fikringiz qabul qilindi.",
    chatPromptQuestion: "Yordamchi sizga foydali bo'ldimi?",
    chatPromptThanks: "Rahmat!",
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
    themeLabel: "Ko'rinish",
    themeLight: "Yorug'",
    themeDark: "Qorong'u",
    themeSystem: "Tizim bo'yicha",
    exportButton: "Ma'lumotlarni eksport qilish",
    deleteAccountButton: "Akkauntni butunlay o'chirish",
    deleteAccountConfirmTitle: "Akkauntni o'chirasizmi?",
    deleteAccountConfirmMessage:
      "Profilingiz, tsikl/homiladorlik yozuvlari, jamiyat postlaringiz va boshqa barcha ma'lumotlar butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.",
    deleteAccountConfirmButton: "Ha, butunlay o'chirish",
    deleteAccountError: "O'chirishda xatolik yuz berdi. Birozdan keyin qayta urinib ko'ring.",
    logoutButton: "Akkauntdan chiqish",
    logoutConfirmMessage: "Akkauntingizdan chiqasizmi? Ma'lumotlaringiz saqlanib qoladi — telefon raqamingiz orqali istalgan vaqt qayta kirishingiz mumkin.",
    logoutConfirmButton: "Ha, chiqish",
    logoutError: "Chiqishda xatolik yuz berdi. Birozdan keyin qayta urinib ko'ring.",
    savedMessage: "Saqlandi",
    notificationsLabel: "Bildirishnomalar",
    statsTitle: "Mening statistikam",
    statsLogsCount: (n: number) => `${n} ta kunlik yozuv`,
    statsStreak: (n: number) => `${n} kunlik streak`,
    statsDaysLabel: "Foydalanish muddati",
    statsDaysValue: (n: number) => `${n} kun`,
    statsLogsLabel: "Jami yozuvlar",
    noNameFallback: "Foydalanuvchi",
    securityTitle: "Xavfsizlik va maxfiylik",
    privacyPolicyLink: "Maxfiylik siyosatini o'qish",
    helpTitle: "Yordam",
    helpPhoneLabel: "Biz bilan bog'laning",
    helpPhoneValue: "+998 91 650 77 77",
    premiumTitle: "Premium",
    premiumSubtitle: "Tez orada qo'shimcha imkoniyatlar bilan",
    rateAppButton: "Ilovani baholash",
    rateAppComingSoon: "Ilova hali do'konlarda emas — chiqqach, shu yerdan baholay olasiz.",
    shareAppButton: "Ilovani ulashish",
    shareAppMessage: "Ayollar salomatligi — hayz sikli, homiladorlik va sog'liqni kuzatish ilovasi.",
    shareAppLinkCopied: "Havola nusxalandi",
    editButton: "Tahrirlash",
    doneButton: "Tayyor",
    avatarUploadLabel: "Suratni o'zgartirish",
    modeTitle: "Rejimni tanlang",
    modes: {
      cycle: "Hayz",
      pregnancy: "Homiladorlik",
      planning_pregnancy: "Tayyorgarlik",
    },
    modeChangeConfirm: "Rejimni almashtirishni tasdiqlaysizmi?",
    personalInfoTitle: "Shaxsiy ma'lumotlar",
    ageLabel: "Yosh",
    heightLabel: "Bo'y",
    weightLabel: "Vazn",
    ageUnit: (n: number) => `${n} yosh`,
    heightUnit: (n: number) => `${n} sm`,
    weightUnit: (n: number) => `${n} kg`,
    bloodTypeLabel: "Qon guruhi",
    // FIX3-02: profilda tahrirlash imkoni (ilgari faqat onboarding'da so'ralardi).
    sexuallyActiveLabel: "Jinsiy hayot",
    bloodTypeUnknown: "Kiritilmagan",
    bloodTypeUnknownOption: "Bilmayman",
    notSet: "Kiritilmagan",
  },
  // ---------------------------------------------------------------------
  // Landing (marketing bosh sahifa) — mammo.uz'ga birinchi marta kirganda
  // ko'rsatiladi (faqat anonim, ro'yxatdan o'tmagan tashrifchilarga).
  // ---------------------------------------------------------------------
  landing: {
    navCta: "Boshlash",
    // lalu.uz uslubidagi ko'p bandli navigatsiya — mavjud bo'limlarga (#id)
    // havola, yangi sahifa emas.
    navLinks: {
      howItWorks: "Qanday ishlaydi",
      features: "Imkoniyatlar",
      calculators: "Kalkulyatorlar",
      trust: "Ishonch",
      faq: "Savol-javob",
    },
    // Har bir bo'lim sarlavhasi ustidagi kichik, katta harfli "eyebrow"
    // yorliq — lalu.uz'da yashil/to'q sariq rangda takrorlanadigan naqsh
    // (LandingPage.tsx'da ACCENT_TEXT_CLASSES bilan navbatlab rangланади).
    eyebrows: {
      features: "ASOSIY YO'NALISHLAR",
      bento: "IMKONIYATLAR",
      calculators: "BEPUL KALKULYATORLAR",
      how: "QANDAY ISHLAYDI",
      trust: "ISHONCH",
      faq: "SAVOL-JAVOB",
    },
    heroEyebrow: "Ayollar uchun",
    // lalu.uz'dagi kabi sarlavha ichida alohida rangdagi so'zlar — matn 3 ta
    // segmentga bo'lingan, har biri ixtiyoriy `accent` bilan (LandingPage.tsx
    // ACCENT_TEXT_CLASSES'dagi primary/secondary/accent tokenlariga mos —
    // YANGI rang PALITRASI emas, mavjud brend ranglari).
    heroTitleSegments: [
      { text: "Bitta ilovada — " },
      { text: "tsikl", accent: "primary" as const },
      { text: ", " },
      { text: "homiladorlik", accent: "secondary" as const },
      { text: " va " },
      { text: "tekshiruvlar", accent: "accent" as const },
      { text: " nazorati." },
    ],
    heroSubtitle: "Hayz tsikli, homiladorlik va tibbiy tekshiruvlarni bir joyda kuzating. Oddiy, xavfsiz va butunlay o'zbek tilida.",
    ctaPrimary: "Bepul sinab ko'rish",
    ctaSecondary: "Qanday ishlaydi",
    // Bosh banner ostidagi uzluksiz aylanuvchi teg-lenta (lalu.uz'dagi
    // "pill" teglar qatoriga o'xshash) — hammasi haqiqiy, mavjud
    // imkoniyat/faktlarga asoslangan, soxta so'z birikmalari emas.
    tickerTags: [
      "Tsikl bashorati",
      "Homiladorlik kundaligi",
      "23+ tekshiruv turi",
      "Hamkor bilan ulashish",
      "Klinikalar bazasi",
      "3 tilda",
      "100% bepul",
      "Ta'limiy maqolalar",
    ],
    // lalu.uz uslubidagi qisqa "raqam + izoh" bo'limi — HAQIQIY, tekshirilgan
    // faktlar (soxta foydalanuvchi soni/reyting emas — bunday ma'lumot yo'q).
    // "23+" checklist-rules.ts#generateChecklist'ning barcha yosh/holat
    // kombinatsiyasi bo'yicha to'liq brute-force tekshiruvi bilan tasdiqlangan
    // (aynan 23 ta noyob faol tur).
    factsStrip: [
      { value: "23+", label: "tibbiy asoslangan tekshiruv turi" },
      { value: "3", label: "tilda: o'zbek, rus, ingliz" },
      { value: "100%", label: "bepul asosiy imkoniyatlar" },
      { value: "0", label: "reklama" },
    ],
    featuresTitle: "Bitta ilovada — bor narsa",
    featuresSubtitle: "Sog'lig'ingizning har bir bosqichi uchun kerakli vosita.",
    features: {
      cycle: {
        title: "Tsikl kuzatuvi",
        desc: "Hayz kunlari, kayfiyat va belgilarni qayd eting — ilova keyingi tsiklni aniq bashorat qiladi.",
      },
      pregnancy: {
        title: "Homiladorlik",
        desc: "Haftama-hafta rivojlanish, tekshiruv jadvali va tepish hisoblagichi — barchasi bir joyda.",
      },
      checkups: {
        title: "Tekshiruvlar va eslatmalar",
        desc: "Ginekolog, mammografiya va boshqa muhim tekshiruvlarni unutmaslik uchun shaxsiy eslatmalar.",
      },
      community: {
        title: "Hamjamiyat va Hamkor",
        desc: "Boshqa ayollar bilan tajriba almashing yoki yaqin insoningizni jarayoningizga hamkor sifatida taklif qiling.",
      },
      clinics: {
        title: "Klinikalar bazasi",
        desc: "Yaqiningizdagi ginekologiya va mammografiya klinikalarini, jumladan bepul davlat dasturlarini toping.",
      },
      articles: {
        title: "Ta'limiy maqolalar",
        desc: "Tsikl, homiladorlik va profilaktika bo'yicha tushunarli, ishonchli manbalarga asoslangan maqolalar.",
      },
    },
    // lalu.uz'dagi "bento" (1 katta + 1 kichik + 3 teng) tarmoq — asosiy
    // 3 hayot-bosqichi kartasidan (features.cycle/pregnancy/checkups,
    // yuqorida alohida bo'limda ko'rsatiladi) TASHQARI qolgan ikkinchi
    // darajali imkoniyatlar uchun.
    bentoTitle: "Yana nima bor?",
    bentoPartner: {
      title: "Hamkor",
      desc: "Yaqin insoningizni jarayoningizga hamkor sifatida taklif qiling — u faqat siz ruxsat bergan qismini ko'radi.",
    },
    bentoReminders: {
      title: "Aqlli eslatmalar",
      desc: "Tekshiruv, unumdor kunlar va muhim sanalar haqida o'z vaqtida eslatib turadi.",
    },
    // Ro'yxatdan o'tmasdan ishlaydigan ochiq kalkulyatorlar (LANDING-CALC,
    // packages/shared/src/logic/public-calculators.ts) — lalu.uz'dagi 4 ta
    // bepul vositaga mos. Natijalar TAXMINIY (umumiy akusherlik
    // formulalari/ma'lumotnoma jadvali) — tashxis emas, shuning uchun
    // `disclaimer` har doim kalkulyatorlar bilan birga ko'rsatiladi.
    calculatorsTitle: "Ro'yxatdan o'tmasdan hisoblang",
    calculatorsSubtitle: "To'rtta bepul kalkulyator — natija bir zumda.",
    calculatorsLmpLabel: "Oxirgi hayz boshlangan sana",
    calculatorsCycleLengthLabel: "Sikl uzunligi (kun)",
    calculatorsWeekLabel: "Homiladorlik haftasi",
    calculatorsDisclaimer:
      "Natijalar taxminiy va umumiy tibbiy formulalarga asoslangan — tashxis emas. Aniq holat uchun shifokorga murojaat qiling.",
    calculators: {
      dueDate: {
        title: "Tug'ilish sanasi",
        desc: "Oxirgi hayz sanasidan hisoblanadi.",
        result: (date: string, week: number) => `Taxminiy sana: ${date} (hozir ${week}-hafta)`,
      },
      ovulation: {
        title: "Ovulyatsiya",
        desc: "Eng unumdor kunlaringizni bilib oling.",
        resultOvulation: (date: string) => `Ovulyatsiya: ${date}`,
        resultFertile: (start: string, end: string) => `Unumdor oyna: ${start} — ${end}`,
        resultNextPeriod: (date: string) => `Keyingi hayz: ${date}`,
      },
      weekToMonth: {
        title: "Haftadan oyga",
        desc: "Homiladorlik haftasini oyga aylantiring.",
        result: (month: number) => `${month}-oy`,
      },
      hcg: {
        title: "XGCH darajasi",
        desc: "Haftaga mos taxminiy XGCH (hCG) diapazoni.",
        result: (label: string, min: string, max: string) => `${label}: ${min}–${max} mIU/mL`,
        outOfRange: "Bu hafta uchun ma'lumot yo'q (jadval 3–42 haftani qamrab oladi).",
      },
    },
    howTitle: "Uch qadamda boshlang",
    howSteps: [
      { title: "Ro'yxatdan o'ting", desc: "Faqat telefon raqamingiz kerak — parolni yodda tutish shart emas." },
      { title: "Maqsadingizni tanlang", desc: "Tsikl kuzatuvimi, homiladorlikmi yoki tayyorgarlikmi — ilova sizga moslashadi." },
      { title: "Kuzating va bilib boring", desc: "Shaxsiy tavsiyalar, eslatmalar va tushunarli statistikalar bilan nazoratni qo'lga oling." },
    ],
    // lalu.uz'dagi "shifokor tomonidan ko'rib chiqilgan" ishonch ustuniga
    // mos — HAQIQIY manba (FIX-CHECKUPS ishida qo'shilgan tekshiruv bazasi
    // aynan shu manbalardan tuzilgan, soxta da'vo emas).
    sourceTrustTitle: "Ishonchli manbalarga asoslangan",
    sourceTrustBody:
      "Tekshiruv jadvalimiz O'zbekiston SSV milliy dasturi, uzaig.uz milliy klinik protokollari va JSSST (WHO) tavsiyalariga asoslangan. Bu shifokor konsultatsiyasi emas — aniq tashxis yoki davolash uchun mutaxassisga murojaat qiling.",
    trustTitle: "Nega aynan MammoAI?",
    trustItems: [
      { title: "Maxfiylik birinchi o'rinda", desc: "Ma'lumotlaringiz shifrlanadi va hech kimga, hatto reklama beruvchilarga ham berilmaydi." },
      { title: "To'liq bepul", desc: "Barcha asosiy imkoniyatlar hech qanday to'lovsiz mavjud." },
      { title: "O'zbek tilida", desc: "Interfeys va tavsiyalar o'zbek (lotin/kirill), rus va ingliz tillarida." },
      { title: "Mahalliy klinikalar", desc: "O'zbekistondagi klinikalar bazasi va bepul mammografiya dasturlari haqida ma'lumot." },
    ],
    faqTitle: "Ko'p so'raladigan savollar",
    faq: [
      {
        q: "Ilovadan foydalanish rostdan ham bepulmi?",
        a: "Ha. Tsikl va homiladorlik kuzatuvi, eslatmalar, hamjamiyat va Hamkor funksiyasi — barchasi hech qanday to'lovsiz mavjud.",
      },
      {
        q: "Mening ma'lumotlarim kim bilan ulashiladi?",
        a: "Hech kim bilan. Ma'lumotlaringiz shifrlangan holda saqlanadi va faqat siz ruxsat bergan Hamkoringizgina, siz tanlagan qismini ko'ra oladi.",
      },
      {
        q: "Bu ilova shifokorni almashtiradimi?",
        a: "Yo'q. MammoAI — kuzatuv va eslatma vositasi, tibbiy tashxis yoki davolash tavsiyasi bermaydi. Har qanday tashvish tug'diruvchi holatda shifokorga murojaat qiling.",
      },
      {
        q: "Homilador bo'lmasam ham foydalanishim mumkinmi?",
        a: "Albatta. Hayz tsiklini kuzatish, homiladorlikka tayyorgarlik yoki shunchaki sog'lig'ingizni nazorat qilish uchun ham ilova moslashadi.",
      },
      {
        q: "Ilova qaysi tillarda ishlaydi?",
        a: "O'zbek (lotin va kirill), rus va ingliz tillarida — istalgan vaqt sozlamalardan almashtirishingiz mumkin.",
      },
    ],
    finalCtaTitle: "Nihoyat sog'lig'ingizni tushunasiz",
    finalCtaSubtitle: "Ro'yxatdan o'tish bir daqiqadan kam vaqt oladi.",
    finalCtaButton: "Bepul sinab ko'rish",
    footerTagline: "Ayollar salomatligi uchun shaxsiy yordamchi.",
    footerPrivacy: "Maxfiylik siyosati",
    footerRights: (year: number) => `© ${year} MammoAI. Barcha huquqlar himoyalangan.`,
  },

  // WEB3-16: brendlangan not-found.tsx/error.tsx uchun (global-error.tsx bu
  // lug'atga tayana olmaydi — u ROOT layout'ning o'zi qulaganda ishga
  // tushadi, shuning uchun qattiq yozilgan, tarjimasiz matn ishlatadi).
  errorPages: {
    notFoundTitle: "Sahifa topilmadi",
    notFoundBody: "Bu manzil mavjud emas yoki ko'chirilgan bo'lishi mumkin.",
    appErrorTitle: "Nimadir xato ketdi",
    appErrorBody: "Sahifani yuklashda kutilmagan xato yuz berdi. Qayta urinib ko'ring.",
    goHomeButton: "Bosh sahifaga qaytish",
  },

  // FIX2-20: server validatsiya/limit xatolari uchun tarjima qilingan matn —
  // `ApiError.key` orqali server yuborgan barqaror kod (masalan
  // "post_too_short") shu ro'yxatdan qidiriladi (translateApiError()).
  // Hozircha faqat community/posts va chat/message route'lari `key`
  // yuboradi — qolgan API route'lari hali xom o'zbekcha matn qaytaradi
  // (kelajakdagi bosqichma-bosqich ko'chirish uchun).
  // CONCERN-01 — shifokor bergan 12 ta muammo yo'nalishi.
  // Matnlar tibbiy jihatdan ehtiyotkor: tashxis qo'ymaydi, faqat mavzuni
  // tushuntiradi va kerakli tekshiruv/mutaxassisga yo'naltiradi.
  concerns: {
    title: "Muammolar",
    subtitle: "Sizni nima bezovta qilayotganidan boshlang — qaysi tekshiruv va qaysi shifokor kerakligini ko'rsatamiz",
    disclaimer: "Bu ma'lumot tashxis qo'ymaydi. Maqsadi — kerakli tekshiruvni va to'g'ri mutaxassisni topishga yordam berish.",
    highlightedLabel: "Sizga tegishli bo'lishi mumkin",
    whatLabel: "Bu nima",
    urgentLabel: "Kechiktirmasdan shifokorga murojaat qiling",
    relatedCheckupsLabel: "Tegishli tekshiruvlar",
    specialistLabel: "Mutaxassis",
    askAssistantButton: "Yordamchidan so'rash",
    findClinicButton: "Klinika topish",
    openChecklistButton: "Tekshiruvlarim",
    cardTitle: "Sizni nima bezovta qilyapti?",
    cardBody: "Shifokorlar eng ko'p duch keladigan 12 ta yo'nalish — har biri bo'yicha nima qilish kerakligi yozilgan.",
    specialists: {
      gynecology: "Ginekolog",
      oncology: "Onkolog",
      radiology: "Radiolog",
      general: "Umumiy amaliyot shifokori",
      endocrinology: "Endokrinolog",
      reproductology: "Reproduktolog",
      laparoscopy: "Ginekolog-jarroh",
    },
    items: {
      cycle_disorders: {
        title: "Hayz buzilishlari",
        what: "Sikl juda qisqa yoki uzun, hayz umuman kelmaydi, juda ko'p yoki og'riqli o'tadi. Ortida gormonal muvozanat, qalqonsimon bez faoliyati, polikistoz tuxumdon sindromi yoki uzoq stress turishi mumkin — sababni faqat tekshiruv aniqlaydi.",
        urgent: "Hayz 3 oydan ortiq kelmasa; bir soatda prokladka to'lib ketadigan darajada ko'p qonash bo'lsa; hayzlar orasida qonash paydo bo'lsa; og'riq oddiy og'riq qoldiruvchi bilan bosilmasa.",
      },
      infertility: {
        title: "Bepushtlik",
        what: "Bir yil davomida (35 yoshdan keyin — olti oy) muntazam va himoyasiz jinsiy hayotda homiladorlik bo'lmasa, bu tekshirish uchun sabab. Sabablarning taxminan yarmi erkak tarafida bo'ladi, shuning uchun juftlik BIRGA tekshiriladi.",
        urgent: "35 yoshdan kattasiz va olti oydan beri natija yo'q; hayz umuman kelmaydi yoki juda nomuntazam; ilgari chanoq a'zolarida jarrohlik yoki infeksiya bo'lgan — bu holatlarda bir yilni kutmang.",
      },
      hormonal_imbalance: {
        title: "Gormonlar almashinuvining buzilishi",
        what: "Gormonlar siklga, vaznga, teriga, sochga va kayfiyatga birdek ta'sir qiladi. Eng ko'p uchraydigan sabablar — qalqonsimon bez faoliyati, polikistoz tuxumdon sindromi (PCOS) va prolaktin darajasi. Bularning hammasi oddiy qon tahlili va UTT orqali aniqlanadi.",
        urgent: "Tez va sababsiz vazn o'zgarishi; yuz va tanada kuchli tuklanish; homilador bo'lmasangiz ham ko'krakdan suyuqlik kelishi; doimiy holsizlik bilan birga yurak urishining tezlashishi.",
      },
      obesity: {
        title: "Ortiqcha vazn va semizlik",
        what: "Ortiqcha vazn ginekologiyada alohida o'rin tutadi: u ovulyatsiyani buzadi, homiladorlikni qiyinlashtiradi, bachadon shilliq qavati va ko'krak saratoni xavfini oshiradi. Ayni paytda bu — o'zgartirish MUMKIN bo'lgan omil, shuning uchun u bilan ishlashga arziydi.",
        urgent: "Tana massasi indeksi 30 dan yuqori bo'lsa; vazn ortishi bilan birga hayz buzilsa; oilada qandli diabet yoki yuqori bosim bo'lsa — endokrinolog bilan reja tuzish kerak.",
      },
      endometriosis: {
        title: "Endometrioz",
        what: "Bachadonning ichki qavatiga o'xshash to'qima undan tashqarida o'sadi. Asosiy belgilari — kuchli hayz og'rig'i, jinsiy aloqada og'riq va homilador bo'lolmaslik. Tashxis o'rtacha 7-8 yil kechikadi, chunki og'riq ko'pincha \"normal\" deb qabul qilinadi. Og'riqqa chidash shart emas.",
        urgent: "Og'riq sizni ishdan yoki o'qishdan qoldirsa; oddiy og'riq qoldiruvchi yordam bermasa; jinsiy aloqada, hojat yoki siyish paytida og'riq bo'lsa.",
      },
      contraception: {
        title: "Kontratseptsiya (himoya) muammolari",
        what: "Himoya usuli yoshga, sog'liq holatiga, tug'ish rejalariga va qanday yon ta'sirni ko'tara olishingizga qarab tanlanadi — hamma uchun yaroqli universal usul yo'q. Noto'g'ri tanlangan usul siklni buzadi va ishonchni yo'qotadi.",
        urgent: "Tabletka fonida kuchli bosh og'rig'i, oyoqda shish yoki og'riq, nafas qisishi paydo bo'lsa — DARHOL shifokorga. Himoyasiz aloqadan keyin 72 soat ichida shoshilinch kontratseptsiya haqida maslahat oling.",
      },
      intimate_hygiene: {
        title: "Jinsiy hayot gigiyenasi",
        what: "Qin o'z mikroflorasi yordamida o'zini tozalaydi — ortiqcha yuvish, antiseptik va xushbo'y vositalar aynan shu muvozanatni buzadi. Ko'p ajralma, hid yoki qichishish gigiyena yetishmasligidan emas, ko'pincha infeksiyadan bo'ladi.",
        urgent: "Hidli yoki rangi o'zgargan ajralma; qichishish va achishish; siyishda og'riq; yangi sherik bilan himoyasiz aloqadan keyin — tahlil topshiring.",
      },
      pregnancy_complications: {
        title: "Homiladorlik patologiyalari",
        what: "Bularga preeklampsiya (yuqori bosim), yo'ldosh muammolari, erta tug'ruq xavfi va homila rivojlanishining sekinlashuvi kiradi. Ularning deyarli hammasi VAQTIDA aniqlansa boshqariladi — shuning uchun navbatdagi ko'riklarni o'tkazib yubormaslik eng muhim himoya.",
        urgent: "Qonash; suv ketishi; kuchli qorin og'rig'i; qattiq bosh og'rig'i va ko'z oldining xiralashuvi; qo'l va yuzning shishi; homila harakatining kamayishi — zudlik bilan tez yordamga murojaat qiling.",
      },
      pregnancy_comorbidity: {
        title: "Homiladorlik davridagi hamroh kasalliklar",
        what: "Qandli diabet (shu jumladan faqat homiladorlikda paydo bo'ladigan gestatsion diabet), qalqonsimon bez muammolari, kamqonlik, yuqori bosim va infeksiyalar. Ular homiladorlikdan oldin ham bo'lishi, shu davrda paydo bo'lishi ham mumkin.",
        urgent: "Doimiy chanqoq va tez-tez siyish; bosim 140/90 dan yuqori; kuchli holsizlik va bosh aylanishi; isitma — tekshiruvni kechiktirmang.",
      },
      breastfeeding: {
        title: "Emizish tartibi va qoidalari",
        what: "Ko'krakka to'g'ri qo'yish texnikasi ko'pchilik muammoning oldini oladi: so'rg'ich yorilishi, sut turib qolishi (laktostaz), sut yetishmayotgandek tuyulishi. Birinchi haftalar eng qiyin kechadi va aynan o'sha paytda yordam so'rash kerak.",
        urgent: "Ko'krakda qattiq og'riqli tugun bilan birga isitma (mastit belgisi); chaqaloq vazn yig'masa; emizish paytida o'tkir og'riq — vaqt o'tkazmang.",
      },
      early_menopause: {
        title: "Erta va og'ir o'tuvchi klimaks",
        what: "45 yoshgacha hayzning butunlay to'xtashi — erta klimaks (tuxumdonlar yetishmovchiligi). Bu faqat hayz masalasi emas: estrogen yetishmasligi suyak va yurak-qon tomir sog'lig'iga uzoq muddatli ta'sir qiladi, shuning uchun uni kuzatuvsiz qoldirib bo'lmaydi.",
        urgent: "40 yoshgacha hayz 4 oydan ortiq kelmasa; issiqlik to'lqinlari, uyqusizlik va kayfiyat o'zgarishi kundalik hayotga jiddiy xalaqit bersa.",
      },
      menopause_later_life: {
        title: "Klimaks va keksa yoshdagi kasalliklar",
        what: "Klimaksdan keyin jinsiy a'zolar prolapsi (tushishi) va siydik tuta olmaslik keng tarqalgan. Lekin bular \"yoshga xos, chidash kerak\" narsa EMAS — chanoq tubi mashqlari, pessariy va jarrohlik davolash usullari mavjud.",
        urgent: "Klimaksdan keyin HAR QANDAY qonash — bu har doim tekshirilishi shart; qinda bosim yoki tushish hissi; yo'talganda, kulganda yoki yugurganda siydik ketishi.",
      },
    },
  },
  apiErrors: {
    invalid_tag: "Mavzu (tag) noto'g'ri",
    post_too_short: "Kamida bir necha so'z yozing",
    premium_required: "Bu funksiya Premium obuna talab qiladi",
    message_too_long: "Xabar juda uzun",
    daily_chat_limit_reached: "Bugungi xabarlar limiti tugadi — ertaga davom eting",
    ai_unavailable: "AI yordamchi hozir vaqtinchalik ishlamayapti — bu sizning savolingizda emas. Biroz keyinroq qayta urinib ko'ring.",
  },
};

export default uz;
