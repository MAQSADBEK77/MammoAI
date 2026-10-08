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
    selectPlaceholder: "Tanlang",
    daysShort: "kun",
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
    tools: "Vositalar",
    articles: "Maqolalar",
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
    linkTelegram: "Telegram orqali ulash",
    linkTelegramHint: "Telegram raqamingizni bir bosishda ulaydi — kod kutish shart emas.",
    linkByPhone: "Telefon raqam bilan",
    linkTelegramFailed: "Telegram javob bermadi — qaytadan urinib ko'ring",
    linkTitle: "Hisobimni ulash",
    linkSubtitle: "Ilgari telefon raqamingiz bilan ro'yxatdan o'tgan bo'lsangiz, raqamingizni kiriting — eski ma'lumotlaringiz qaytadi. Kod SMS orqali emas, Telegram boti orqali keladi.",
    sendCode: "Kod olish",
    openBot: "Telegram botni ochib, kodni oling",
    confirm: "Tasdiqlash",
    codeWrong: "Kod noto'g'ri yoki muddati o'tgan",
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
    // ONB-CONSENT-01: alohida-alohida rozilik (Clue/Flo naqshi).
    consentTitle: "Maxfiylik — birinchi o'rinda",
    consentSubtitle:
      "Ma'lumotlaringiz sizniki. Davom etishdan oldin nimaga rozilik berayotganingizni bilib oling.",
    consentOfferPrefix: "",
    consentOfferLink: "Ommaviy oferta",
    consentOfferSuffix: " shartlarini qabul qilaman.",
    consentPrivacyPrefix: "",
    consentPrivacyLink: "Maxfiylik siyosatini",
    consentPrivacySuffix: " o'qib chiqdim.",
    consentHealthLabel:
      "Sog'lig'im haqidagi ma'lumotlarni — hayz sikli, simptomlar, tekshiruvlar — ilova xizmatini ko'rsatish uchun qayta ishlashga roziman.",
    consentHealthNote: "Bu ma'lumotlar sotilmaydi va reklama uchun ishlatilmaydi.",
    acceptAll: "Hammasiga roziman",
    hideOffer: "Matnni yopish",
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
    backdropAbout: "Avval siz bilan tanishamiz",
    backdropCycle: "Siklingiz haqida bir necha savol",
    backdropHealth: "Oxirgi bosqich — sog'lig'ingiz haqida",
    backdropLead: "Javoblaringiz bashoratni aniq qiladi.",
    sectionAbout: "Siz haqingizda",
    sectionCycle: "Siklingiz",
    sectionHealth: "Sog'lig'ingiz",
    sectionProgress: (current: number, total: number) => `${current}/${total}`,
    // ONB-02: so'rovnoma O'RTASIDA ko'rsatiladigan dastlabki bashorat.
    // Maqsad — qiymatni oldinga chiqarish: foydalanuvchi qolgan savollarga
    // javob berishdan OLDIN ilova nima berayotganini ko'radi.
    previewHeadlinePrefix: "Keyingi hayzingiz taxminan",
    previewHeadlineSuffix: "atrofida boshlanadi",
    previewNotifTitle: "Hayzingiz yaqinlashmoqda",
    previewNotifBody: "Bir necha kundan keyin boshlanishi kutilmoqda — tayyor turing.",
    previewNotifNow: "hozir",
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

    nameIntro: "Keling, yaqinroq tanishamiz!",
    nameQuestion: "Sizga qanday murojaat qilishimizni istaysiz?",
    namePlaceholder: "Ismingizni kiriting",

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

    periodLengthHint: "Hayz odatda 4–7 kun davom etadi.",
    cycleLengthHint: "Ikki hayz boshlanishi orasidagi davr — odatda 23–35 kun.",
    notSure: "Aniq bilmayman",
    averageCycleLengthQuestion: "Siklingiz odatda necha kun davom etadi?",
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

    heightTitle: "Bo'yingiz",
    weightTitle: "Vazningiz",
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
    notificationsDeclineButton: "Hozir emas",

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
    ongoingTitle: "Hayzingiz davom etyaptimi?",
    ongoingSpottingTitle: "Dog'lanish davom etyaptimi?",
    ongoingSpottingSubtitle: "Hayz boshlangan bo'lsa, belgilab qo'ying — kalendarda bashorat emas, haqiqiy kun bo'lib qoladi.",
    ongoingSubtitle: (day: number) => `${day}-kun. Belgilansa, kalendarda bashorat emas, haqiqiy kun bo'lib qoladi.`,
    ongoingYes: "Ha, davom etyapti",
    ongoingEnded: "Tugadi",
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
    heroFertileLabel: "Unumdor kunlar",
    heroFertileTodayValue: "Bugun",
    heroOvulationLabel: "Ovulyatsiya",
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
    // TTC-03
    lhTestLabel: "Ovulyatsiya testi (LH)",
    lhTestPositive: "Musbat",
    lhTestNegative: "Manfiy",
    intercourseLabel: "Bugun jinsiy aloqa bo'ldi",
    fertileCoverageTitle: "Unumdor oyna",
    fertileCoverageValue: (covered: number, total: number) => `${total} kundan ${covered} tasi belgilangan`,
    fertileCoverageEmpty: "Bu oynada hali hech narsa belgilanmagan",
    monthsTryingLabel: (months: number) => (months === 0 ? "Birinchi oy" : `${months}-oy urinilmoqda`),
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
    menopauseSuggestTitle: "Bu davr uchun alohida rejim bor",
    menopauseSuggestBody:
      "Siklingiz o'zgaruvchan bo'lib qolgan. Shu yoshda bashorat o'rniga belgilaringizni (issiqlik bosishi, uyqu, kayfiyat) kuzatish va kerakli tekshiruvlardan o'tish ancha foydaliroq.",
    menopauseSuggestSwitch: "Shu rejimga o'tish",
    menopauseSuggestDismiss: "Hozir emas",
    menopauseSuggestNote: "Rejimni istalgan vaqtda profildan qaytarib o'zgartirasiz.",
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
    // PREG-HERO-01
    weekDayLabel: (week: number, day: number) => `${week} hafta, ${day} kun`,
    weekContentMissing: "Bu hafta uchun matn hali tayyorlanmagan.",
    insightsTitle: "Kunlik tavsiyalar",
    insightsAddLabel: "Bugungi holatni qayd eting",
    detailsButton: "Batafsil",
    weekLabel: (week: number) => `${week}-hafta`,
    daysRemaining: (days: number) => `Tug'ilishga ${days} kun qoldi`,
    trimester: (t: number) => `${t}-trimestr`,
    sizeComparison: (size: string) => `Bolangiz hozir ${size} kattaligida`,
    earlyWeekNote: "Hisob oxirgi hayzingizning birinchi kunidan boshlanadi — bu haftada urug'lanish hali sodir bo'lmagan",
    visitsTitle: "Tashrif va eslatmalar",
    addVisitButton: "Tashrif qo'shish",
    // PREG-LABOR-01
    contractionsTitle: "Shvat sanagichi",
    contractionsHint: "Qisqarish boshlanganda bosing, tugaganda yana bosing.",
    contractionsStart: "Boshlash",
    contractionsStop: "Tugatish",
    contractionsCount: "So'nggi soatda",
    contractionsAvgDuration: "O'rtacha davomiylik",
    contractionsAvgInterval: "O'rtacha oraliq",
    contractionsRuleMet: "Shifokoringizga hoziroq bog'laning",
    contractionsRuleMetHint: "Qisqarishlar bir soatdan beri har 5 daqiqada va kamida 1 daqiqadan davom etmoqda \u2014 bu tug'ruqxonaga borish vaqti degan keng qo'llaniladigan chegara (5-1-1 qoidasi).",
    contractionsDisclaimer: "Bu sanagich tashxis qo'ymaydi va tug'ruq boshlanganini tasdiqlamaydi. Qon ketishi, suv ketishi yoki homila harakati kamayganda chegarani kutmang \u2014 darhol shifokorga murojaat qiling.",
    kicksTitle: "Harakat sanagichi",
    kicksHint: "Chaqaloq harakatlanganda tugmani bosing. Maqsad — 2 soat ichida 10 ta harakat.",
    kicksButton: "Harakat",
    kicksProgress: (n: number) => `${n} / 10 harakat`,
    kicksElapsed: (n: number) => `${n} daqiqa o'tdi`,
    kicksDone: "10 ta harakat qayd etildi 🎉",
    kicksDoneHint: "Bu — yaxshi belgi. Lekin odatdagidan kamroq harakat sezsangiz, sanoq to'lgan bo'lsa ham shifokorga murojaat qiling.",
    kicksLow: "2 soat ichida 10 taga yetmadi",
    kicksLowHint: "Bir stakan salqin suv iching, chap yonboshingizga yotib yana bir soat sanang. Shundan keyin ham kam bo'lsa — kechiktirmasdan shifokoringizga yoki tug'ruqxonaga murojaat qiling.",
    kicksReset: "Yangi seans",
    kicksDisclaimer: "Harakatlarni har kuni bir xil vaqtda, chaqaloq eng faol bo'lgan paytda sanash qulay. Bu sanoq tekshiruv o'rnini bosmaydi.",
    kicksWeekHint: "Harakatlarni sanash 28-haftadan boshlab tavsiya etiladi.",
    articlesCardTitle: "Qiziqarli maqolalar",
    completedWeekLabel: "O'tgan hafta",
    remainingWeekLabel: "Qolgan hafta",
    // CONTENT-001 — admin panel orqali tahrirlanadigan haftalik kontent sarlavhalari.
    babyDevelopmentTitle: "Chaqalog'ingiz bu hafta",
    motherChangesTitle: "Sizda nima o'zgaradi",
    // PREG-END-01
    // PREG-SCHED-01
    scheduleTitle: "Homiladorlik jadvali",
    scheduleNote: "O'zbekiston Sog'liqni saqlash vazirligi protokoli bo'yicha. Sanalar sizning haftangizdan hisoblangan.",
    scheduledCheckupTitle: "Jadval bo'yicha navbatdagi tekshiruv",
    scheduledCheckupNow: "Hozir vaqti keldi",
    scheduledCheckupOverdue: "Muddati o'tdi",
    endedLink: "Homiladorlik tugadimi?",
    endedTitle: "Homiladorlik tugadi",
    endedHint: "Buni bilsak, ilova sizga to'g'ri narsani ko'rsatadi. Aks holda u haftalarni sanashda davom etadi.",
    endedBirth: "Farzandim tug'ildi",
    endedLoss: "Homiladorlik to'xtadi",
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
    // PREG-DETAIL-01: emoji faqat `public/emoji` da MAVJUD bo'lganlaridan
    // tanlandi — u yerda atigi 87 ta Twemoji SVG bor va yo'g'i singan
    // rasm bo'lib chiqadi (bu loyihada allaqachon uchragan xato).
    // Ba'zi mevaning aniq belgisi yo'q, shuning uchun eng yaqini olindi.
    sizeEmoji: {
      poppySeed: "\ud83c\udf31",
      raspberry: "\ud83e\udad0",
      lime: "\ud83c\udf4b",
      lemon: "\ud83c\udf4b",
      avocado: "\ud83e\udd51",
      corn: "\ud83c\udf3d",
      eggplant: "\ud83c\udf46",
      coconut: "\ud83e\udd65",
      pineapple: "\ud83c\udf4d",
      watermelon: "\ud83c\udf49",
    },
    weekDetailTitle: (week: number) => `${week}-haftada nima bo'ladi`,
    detailLength: (cm: number) => `Uzunligi: ${cm} sm`,
    detailWeight: (g: number) => (g < 1000 ? `Vazni: ${g} g` : `Vazni: ${(g / 1000).toFixed(2)} kg`),
    measureCrownRump: "Uzunlik boshdan dumg'azagacha o'lchanadi.",
    measureCrownHeel: "Uzunlik boshdan tovongacha o'lchanadi \u2014 20-haftadan boshlab usul shunday o'zgaradi.",
    detailAverageNote: "Bular o'rtacha qiymatlar; sog'lom homila ulardan farq qilishi mumkin.",
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
    // PREG-PHOTO-01
    photoPromptTitle: (week: number) => `${week}-hafta keldi!`,
    photoPromptBody: "Qorin suratini olish vaqti",
    photoPromptCta: "Olish",
    gridTitle: "Muhim",
    gridNutrition: "Ovqatlanish",
    albumTitle: "Homiladorlik albomi",
    albumSubtitle: "Qorin/chaqaloq rasmingizni yuklang — har hafta uchun chiroyli xotira",
    albumAddButton: "Rasm qo'shish",
    albumUploading: "Yuklanmoqda…",
    albumEmpty: "Hali rasm yo'q — birinchisini qo'shing",
    albumTabBump: "Qorin suratlari",
    albumTabUltrasound: "UZI suratlari",
    albumEmptyUltrasound: "Hali UZI surati yo'q — birinchisini qo'shing",
    gainTitle: "Vazn oshishi",
    gainNone: "Vaznni kiriting — me'yor bilan solishtiramiz",
    gainCurrent: (kg: number) => `${kg > 0 ? "+" : ""}${kg} kg`,
    gainRange: (low: number, high: number) => `Bu haftada me'yor: ${low}–${high} kg`,
    gainTotal: (low: number, high: number) => `Butun muddat uchun: ${low}–${high} kg`,
    gainNote: "Me'yor homiladorlikdan oldingi tana massasi indeksiga qarab hisoblangan (IOM, 2009). Bu tashxis emas, suhbat uchun asos.",
    gainStatus: {
      below: "Me'yordan sekinroq",
      within: "Me'yor ichida",
      above: "Me'yordan tezroq",
    },
    gainStatusHint: {
      below: "Bu o'z-o'zidan xavf degani emas. Ishtahangiz pastmi yoki ko'ngil aynishi bormi — keyingi qabulda shifokorga ayting.",
      within: "Vazn oshishi kutilgandek ketyapti.",
      above: "Bu ham ko'pincha normal. Agar bir haftada 1 kg dan ko'p qo'shilsa yoki shish paydo bo'lsa — shifokorga murojaat qiling.",
    },
    gainCategories: {
      underweight: "Kam vazn",
      normal: "Normal vazn",
      overweight: "Ortiqcha vazn",
      obese: "Semizlik",
    },
    warningTitle: "Xavfli belgilar",
    warningSubtitle: "Qaysi belgi kutishga yaramaydi — va nima qilish kerak",
    warningCall: "103 ga qo'ng'iroq qilish",
    warningNote: "Shubhalansangiz — murojaat qiling. \"Bezovta qilyapmanmi?\" degan o'y tufayli kechikkandan ko'ra, bekorga borgan yaxshi.",
    warningTile: "Xavfli belgilar",
    warningActions: {
      emergency: "Darhol 103 ga qo'ng'iroq qiling",
      maternity: "Darhol tug'ruqxonaga boring",
      today: "Bugun shifokorga murojaat qiling",
    },
    warningList: {
      heavy_bleeding: { name: "Ko'p qon ketishi", note: "Prokladka bir soatda to'lsa yoki laxta bilan qon kelsa" },
      seizure: { name: "Tirishish yoki hushni yo'qotish", note: "Eklampsiya belgisi bo'lishi mumkin" },
      severe_abdominal_pain: { name: "Qorinda kuchli, tinmaydigan og'riq", note: "Ayniqsa qorin toshdek qotib qolsa" },
      fainting: { name: "Hushdan ketish yoki qattiq holsizlik", note: "O'rnidan turolmaslik darajasida" },
      breathing_chest_pain: { name: "Nafas qisilishi yoki ko'krak og'rig'i", note: "Birdan paydo bo'lgan bo'lsa" },
      reduced_movement: { name: "Homila harakati kamaydi yoki to'xtadi", note: "Salqin suv iching, chap yonboshga yoting, bir soat sanang. Kam bo'lsa — kutmang." },
      waters_breaking: { name: "Suv ketishi", note: "Rangi va vaqtini eslab qoling — shifokor so'raydi" },
      severe_headache_vision: { name: "Kuchli bosh og'rig'i, ko'z oldi xiralashishi", note: "Preeklampsiya belgisi bo'lishi mumkin" },
      sudden_swelling: { name: "Yuz va qo'llarning keskin shishishi", note: "Bir kechada paydo bo'lgan shish" },
      preterm_contractions: { name: "37-haftagacha muntazam shvatlar", note: "Soatiga to'rttadan ko'p qisqarish" },
      fever: { name: "38 °C dan yuqori isitma", note: "Ayniqsa titroq bilan birga" },
      persistent_vomiting: { name: "To'xtamaydigan qusish", note: "Suvni ham ushlab turolmasangiz" },
      light_bleeding: { name: "Oz miqdorda qon yoki dog'", note: "Miqdori ortsa — darhol tug'ruqxonaga" },
      itching: { name: "Kaft va tovonning qattiq qichishishi", note: "Toshmasiz qichishish jigar bilan bog'liq bo'lishi mumkin" },
      painful_urination: { name: "Siyish paytida og'riq yoki achishish", note: "Bel og'rig'i qo'shilsa — kechiktirmang" },
      fall_or_blow: { name: "Yiqilish yoki qoringa zarba", note: "O'zingizni yaxshi his qilsangiz ham tekshirtiring" },
    },
    bagTitle: "Tug'ruqxona sumkasi",
    bagSubtitle: "34-haftaga tayyor bo'lsin — tug'ruqning 10 foizi 37-haftagacha boshlanadi",
    bagCardTitle: "Tug'ruqxona sumkasi",
    bagCardHint: "Ro'yxatni ochish",
    bagEssential: "Majburiy",
    bagReady: "Sumka tayyor 🎒",
    bagReadyHint: "Barcha majburiy narsalar belgilandi. Sumkani eshik oldida, ko'rinadigan joyda saqlang.",
    bagMissing: (n: number) => `${n} ta majburiy narsa belgilanmagan`,
    bagProgress: (checked: number, total: number) => `${checked} / ${total} belgilandi`,
    bagNote: "Tug'ruqxonangizning o'z talablari bo'lishi mumkin — qabulga yozilganda so'rab qo'ying.",
    bagGroups: {
      documents: "Hujjatlar",
      mother: "Ona uchun",
      baby: "Chaqaloq uchun",
    },
    bagList: {
      passport: "Pasport",
      exchange_card: "Almashinuv kartasi",
      test_results: "Analiz natijalari (qog'ozda)",
      birth_contract: "Tug'ruq shartnomasi yoki polis",
      partner_tests: "Hamroh uchun flyuorografiya va analizlar",
      nightgown: "Oldi ochiladigan tungi ko'ylak (2 ta)",
      robe: "Xalat",
      slippers: "Yuviladigan shippak",
      towels: "Sochiq (2 ta)",
      postpartum_pads: "Tug'ruqdan keyingi prokladkalar",
      disposable_underwear: "Bir martalik ichki kiyim",
      nursing_bra: "Emizish uchun byustgalter",
      breast_pads: "Ko'krak uchun prokladkalar",
      toiletries: "Gigiyena: tish cho'tkasi, sovun, taroq",
      hair_tie: "Soch rezinkasi",
      phone_charger: "Telefon va uzun zaryadlovchi",
      water_snacks: "Suv va yengil gazak",
      dishes: "Piyola, qoshiq, krujka",
      compression_socks: "Kompression paypoq",
      going_home_outfit: "Uyga chiqish kiyimi",
      newborn_diapers: "Yangi tug'ilganlar uchun tagliklar",
      wet_wipes: "Nam salfetka",
      bodysuits: "Bodi va ichki kiyim (3-4 ta)",
      swaddles: "Yo'rgak va pelyonka",
      baby_hat: "Chaqaloq shapkasi",
      baby_socks: "Paypoq",
      mittens: "Qo'lqopcha (tirnamasligi uchun)",
      baby_soap: "Chaqaloq sovuni va kremi",
      baby_blanket: "Yengil ko'rpacha",
      car_seat: "Avtokreslo (uyga qaytish uchun)",
    },
    foodTitle: "Mumkinmi?",
    foodSubtitle: "Mahsulot nomini yozing — javob uch so'zda",
    foodSearchPlaceholder: "Qurut, kofe, somsa...",
    foodEmpty: "Bu mahsulot ro'yxatda yo'q. Shubhalansangiz — shifokordan so'rang.",
    foodArticleLink: "Batafsil maqola: homiladorlikda ovqatlanish",
    foodDisclaimer: "Ro'yxat JSST va Sog'liqni saqlash vazirligi tavsiyalariga asoslangan. U shifokor maslahatining o'rnini bosmaydi.",
    foodVerdicts: {
      safe: "Mumkin",
      limit: "Cheklang",
      avoid: "Mumkin emas",
    },
    foodGroups: {
      dairy: "Sut mahsulotlari",
      meat: "Go'sht, baliq, tuxum",
      drinks: "Ichimliklar",
      produce: "Meva-sabzavot",
      other: "Boshqa",
    },
    foodList: {
      boiled_milk: { name: "Qaynatilgan sut", note: "Qaynatilgan yoki pasterizatsiyalangan sut — kaltsiy manbai" },
      raw_milk: { name: "Xom sut", note: "Listeriya va brutsellyoz xavfi. Bozor sutini albatta qaynating." },
      qatiq: { name: "Qatiq, ayron", note: "Qaynatilgan yoki sanoat sutidan bo'lsa — hazmga yaxshi" },
      suzma: { name: "Suzma", note: "Faqat pasterizatsiyalangan sutdan. Bozorda ochiq sotilganidan saqlaning." },
      qurut: { name: "Qurut", note: "Ko'pincha xom sutdan va juda sho'r — kamdan-kam, qadoqlanganini tanlang" },
      hard_cheese: { name: "Qattiq pishloq", note: "Gauda, parmezan, rossiyskiy — xavfsiz" },
      soft_cheese: { name: "Yumshoq pishloq (brinza, suluguni)", note: "Pasterizatsiyalanmagan sutdan bo'lsa — listeriya xavfi" },
      butter: { name: "Sariyog'", note: "Me'yorida — muammo yo'q" },
      ice_cream: { name: "Muzqaymoq", note: "Sanoat muzqaymog'i mumkin; uyda xom tuxum bilan tayyorlangani — yo'q" },
      cooked_meat: { name: "Pishirilgan go'sht", note: "To'liq pishirilgan go'sht — temir manbai" },
      raw_meat: { name: "Xom yoki chala pishgan go'sht", note: "Toksoplazmoz va listeriya. Ichi qizil qolgan go'sht ham kirmaydi." },
      chicken: { name: "Tovuq go'shti", note: "Yaxshi pishirilgan bo'lsa — oqsil manbai" },
      qazi: { name: "Qazi, hasib, dudlangan kolbasa", note: "Chala pishgan va dudlangan mahsulotlar — listeriya xavfi" },
      liver: { name: "Jigar", note: "A vitamini juda ko'p — haftasiga bir martadan oshirmang" },
      cooked_fish: { name: "Pishirilgan baliq", note: "Haftasiga 2-3 marta — omega-3 chaqaloq miyasi uchun" },
      raw_fish: { name: "Xom baliq, sushi", note: "Xom yoki yengil tuzlangan baliq — parazit va listeriya" },
      high_mercury_fish: { name: "Orkinos, akula, qilichbaliq", note: "Bu baliqlarda simob to'planadi" },
      cooked_egg: { name: "To'liq pishgan tuxum", note: "Oqi va sarig'i qotgan bo'lsa — mumkin" },
      raw_egg: { name: "Xom tuxum", note: "Salmonellyoz: uy mayonezi, xom krem, chala qovurilgan tuxum" },
      water: { name: "Suv", note: "Kuniga 8-10 stakan — shish va qabziyatga yordam beradi" },
      coffee: { name: "Kofe", note: "Kuniga 200 mg kofeindan oshirmang — bu taxminan 2 chashka" },
      black_tea: { name: "Qora choy", note: "Temir so'rilishini kamaytiradi — ovqatdan bir soat keyin iching" },
      green_tea: { name: "Ko'k choy", note: "Folat so'rilishiga xalaqit beradi — kuniga 1-2 piyola" },
      herbal_tea: { name: "Dorivor giyoh choylari", note: "Hamma giyoh ham xavfsiz emas — shifokordan so'rang" },
      alcohol: { name: "Alkogol", note: "Xavfsiz miqdori YO'Q — har qanday dozada chaqaloq miyasiga ta'sir qiladi" },
      energy_drink: { name: "Energetik ichimlik", note: "Kofein va taurin juda yuqori" },
      soda: { name: "Gazlangan ichimlik", note: "Shakar ko'p — gestatsion diabet xavfi" },
      fresh_juice: { name: "Yangi siqilgan sharbat", note: "Yuvilgan mevadan, kuniga bir stakan" },
      washed_produce: { name: "Yuvilgan meva-sabzavot", note: "Kuniga 5 porsiya — folat, tola va vitaminlar" },
      unwashed_produce: { name: "Yuvilmagan meva-sabzavot", note: "Tuproq qoldig'i — toksoplazmoz. Ko'katlarni ayniqsa yaxshilab yuving." },
      melon: { name: "Qovun, tarvuz", note: "Mumkin, lekin kesilganini uzoq saqlamang" },
      pomegranate: { name: "Anor", note: "Temir va folatga boy" },
      grapes: { name: "Uzum", note: "Yaxshilab yuvilgan bo'lsa — mumkin" },
      dried_fruit: { name: "Quruq mevalar", note: "Shakar zich — bir hovuchdan oshirmang" },
      nuts: { name: "Yong'oq, bodom", note: "Kuniga bir hovuch — oqsil va foydali yog'" },
      sprouts: { name: "Xom nihollar", note: "Xom nihollarda salmonella ko'payadi" },
      wild_mushroom: { name: "Yovvoyi qo'ziqorin", note: "Zaharlanish xavfi. Sanoat qo'ziqorini pishirilgan holda mumkin." },
      bread: { name: "Non, patir", note: "Asosiy energiya manbai" },
      osh: { name: "Osh (palov)", note: "Yangi tayyorlangan bo'lsa — mumkin, lekin yog'i ko'pini me'yorida" },
      somsa: { name: "Somsa, manti", note: "Issiq va yangi bo'lsa. Sovib qolgan go'shtli somsa — yo'q." },
      street_food: { name: "Ko'cha ovqati", note: "Saqlash sharoiti noma'lum — oziq-ovqat infeksiyasi homiladorlikda og'irroq kechadi" },
      salt: { name: "Tuz", note: "Kuniga 5 g gacha — shish va bosimga ta'sir qiladi" },
      sugar: { name: "Shakar va shirinliklar", note: "Ko'p bo'lsa — gestatsion diabet xavfi" },
      honey: { name: "Asal", note: "Homilador ayolga mumkin (bir yoshgacha bolaga emas)" },
      spicy: { name: "Achchiq ovqat", note: "Zarar qilmaydi, lekin jig'ildon qaynashini kuchaytiradi" },
      legumes: { name: "Mosh, loviya, no'xat", note: "Oqsil va folat manbai" },
      supplements: { name: "Vitamin va qo'shimchalar", note: "Faqat shifokor tayinlagani. A vitamini va giyoh qo'shimchalari xavfli bo'lishi mumkin." },
    },
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
      tryingSince: {
        title: "Qancha vaqtdan beri homiladorlikka urinyapsiz?",
        hint: "Shifokorga qachon murojaat qilish kerakligi shunga bog'liq: 35 yoshgacha 12 oy, 35-40 yoshda 6 oy. Bu chegarani bilmaslik ko'p vaqt yo'qotadi.",
        options: { lt6: "6 oydan kam", m6to12: "6-12 oy", gt12: "Bir yildan ortiq" },
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
      folic_acid_start: {
        title: "Folat kislotasini boshlash (400 mkg)",
        why: "Homiladorlikka tayyorgarlikdagi eng isbotlangan bitta qadam — bolada nerv naychasi nuqsonlari xavfini kamaytiradi. Homiladorlik aniqlangach boshlash KECH: u homiladorlikdan kamida bir oy oldin boshlanishi kerak. Dorixonada retseptsiz sotiladi.",
      },
      fertility_evaluation: {
        title: "Homiladorlik bo'lmasa — tekshiruvdan o'tish",
        why: "Urinish muddati chegaradan oshdi (35 yoshgacha 12 oy, 35-40 yoshda 6 oy). Bu «bepushtlik» degani emas — sabablarning ko'pi davolanadi, lekin oldin aniqlanishi kerak. Kutish qancha uzaysa, imkoniyat shuncha kamayadi.",
      },
      partner_semen_analysis: {
        title: "Hamkoringiz uchun spermogramma",
        why: "Bepushtlik holatlarining taxminan yarmida sabab erkakda. Spermogramma — arzon, tez va og'riqsiz tekshiruv, lekin ko'pincha u eng oxirida qilinadi. Uni ayolning tekshiruvi bilan bir vaqtda qilish oylarni tejaydi.",
      },
      colorectal_cancer_screening: {
        title: "Yo'g'on ichak saratoni skrininggi",
        why: "Ginekologik tekshiruv emas, lekin 45 yoshdan keyingi standart skrining. Erta bosqichda aniqlansa davolash ancha oson, kech bosqichda esa ancha og'ir.",
      },
      bone_density_screening: {
        title: "Suyak zichligi tekshiruvi (densitometriya)",
        why: "Menopauzadan keyin suyak tez yupqalashadi va bu BELGISIZ kechadi — birinchi alomat ko'pincha sinishning o'zi bo'ladi. Son suyagi singan ayollarning katta qismi mustaqil yurish qobiliyatini yo'qotadi. Tekshiruv og'riqsiz, 10-15 daqiqa oladi.",
      },
      lipid_panel: {
        title: "Xolesterin (lipid paneli)",
        why: "Menopauzadan keyin yurak-qon tomir kasalligi xavfi keskin oshadi — bu yoshdagi ayollarda saratondan KO'RA ko'proq o'lim sababi. Oddiy qon tahlili bilan aniqlanadi va vaqtida topilsa boshqariladi.",
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
    // BOOKMARK-01
    saveAction: "Saqlash",
    unsaveAction: "Saqlanganlardan olib tashlash",
    savedTab: "Saqlanganlar",
    allTab: "Barchasi",
    savedEmpty: "Hali hech narsa saqlamagansiz. Maqolani keyinroq o'qish uchun xatcho'p belgisini bosing.",
    saveFailed: "Saqlab bo'lmadi — qayta urinib ko'ring.",
    commentsTitle: "Izohlar",
    commentPlaceholder: "Savolingiz yoki tajribangizni yozing...",
    commentSend: "Yuborish",
    commentsEmpty: "Hali izoh yo'q — birinchi bo'ling.",
    readingTime: (min: number) => `${min} daqiqa o'qish`,
    relatedTitle: "Yana o'qing",
    sourcesTitle: "Manbalar",
    unreviewedNotice: "Bu matn hali shifokor ko'rigidan o'tmagan. Sog'lig'ingizga oid qaror qabul qilishdan oldin shifokor bilan maslahatlashing.",
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
    moderationNotice: "Bu yerdagi javoblar — shaxsiy tajriba, tibbiy maslahat emas.",
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
  tools: {
    title: "Vositalar",
    subtitle: "Ilovaning barcha bo'limlari bir joyda",
    articles: "Maqolalar",
    articlesHint: "Shifokor tekshirgan materiallar",
    doctorsTile: "Shifokorlar",
    doctorsTileHint: "Tasdiqlangan tashriflar bo'yicha baho",
    clinics: "Klinikalar",
    clinicsHint: "Yaqin klinika va bepul skrining",
    report: "Shifokor uchun hisobot",
    reportHint: "Qabulga olib boring",
    stats: "Statistika",
    statsHint: "Sikl va simptomlar tahlili",
    riskQuiz: "Xavf testi",
    riskQuizHint: "Shaxsiy xavf darajangiz",
    concerns: "Sizni nima bezovta qilyapti",
    concernsHint: "12 ta yo'nalish bo'yicha yordam",
    food: "Mumkinmi?",
    foodHint: "Ovqat xavfsizligi ro'yxati",
    warningSigns: "Xavfli belgilar",
    warningSignsHint: "Qachon kutmaslik kerak",
    bag: "Tug'ruqxona sumkasi",
    bagHint: "30 ta band bo'yicha ro'yxat",
    partner: "Juft",
    partnerHint: "Hamkoringiz bilan ulashish",
  },
  doctors: {
    title: "Shifokorlar",
    subtitle: "Tasdiqlangan tashriflar asosidagi baho",
    all: "Hammasi",
    empty: "Hozircha shifokor qo'shilmagan. Tez orada to'ldiriladi.",
    newDoctor: "Yangi",
    reviews: (n: number) => `${n} ta baho`,
    years: (n: number) => `${n} yil tajriba`,
    goButton: "Men shu shifokorga boraman",
    wentButton: "Bordim",
    rateTitle: "Tashrifingiz qanday o'tdi?",
    rateSend: "Bahoni yuborish",
    rated: "Bahoyingiz uchun rahmat",
    onlyAfterVisit: "Baho faqat tashrifdan keyin qoldiriladi — shuning uchun bu yerdagi raqamlar haqiqiy.",
    callClinic: "Klinikaga qo'ng'iroq",
  },
  menopause: {
    title: "Klimaks",
    mrsTitle: "Simptomlar testi",
    mrsIntro: "11 ta savol, bir daqiqa. Natija shifokor tushunadigan shkala bo'yicha chiqadi (MRS).",
    start: "Testni boshlash",
    retake: "Qaytadan topshirish",
    save: "Natijani saqlash",
    cancel: "Bekor qilish",
    resultTitle: "Natijangiz",
    lastTaken: (date: string) => `Oxirgi marta: ${date}`,
    stagePeri: "Perimenopauza",
    stageMeno: "Menopauza",
    stagePost: "Postmenopauza",
    stagePre: "Hali boshlanmagan",
    stageHintPeri: "Sikl o'zgaruvchan bo'lishi mumkin — bu shu davrning odatiy belgisi.",
    stageHintMeno: "Oxirgi hayzdan 12 oydan ko'proq o'tdi.",
    stageHintPost: "Menopauzadan bir necha yil o'tdi. Asosiy e'tibor — suyak, yurak va skrining.",
    sevNone: "Simptomlar sezilarli emas",
    sevMild: "Yengil",
    sevModerate: "O'rtacha",
    sevSevere: "Og'ir",
    doctorHint: "Simptomlaringiz hayot sifatiga ta'sir qilyapti. Bu “chidash kerak” degani emas — davolash usullari bor. Shifokor bilan gaplashing.",
    bleedTitle: "Qon ketishni e'tiborsiz qoldirmang",
    bleedBody: "Menopauzadan keyin har qanday qon ketish — shifokorga zudlik bilan murojaat qilish uchun sabab. Ko'p hollarda sabab xavfsiz, lekin buni faqat tekshiruv aytadi.",
    screeningTitle: "Shu yoshdagi tekshiruvlar",
    screeningBody: "Mammografiya, suyak zichligi, qon bosimi va xolesterin — aynan shu davrda eng muhim.",
    screeningCta: "Tekshiruvlarim",
    doctorsCta: "Mutaxassis topish",
    scoreOf: (total: number, max: number) => `${total} / ${max}`,
    domains: { somatic: "Jismoniy", psychological: "Kayfiyat va asab", urogenital: "Siydik-jinsiy" },
    dynamicsTitle: "O'zgarish",
    dynamicsHint: "Davolash yordam berayotganini faqat shu chiziq ko'rsatadi.",
    todayTitle: "Bugungi belgilar",
    todayBody: "Issiq to'lqinlar, uyqu, kayfiyat — har kuni belgilansa, shifokorga ko'rsatadigan tasvir aniq bo'ladi.",
    todayCta: "Bugunni belgilash",
    levels: ["Yo'q", "Yengil", "O'rtacha", "Og'ir", "Juda og'ir"],
    items: {
      hot_flashes: "Issiq to'lqinlar, terlash",
      heart_discomfort: "Yurak notinchligi (tez urishi, siqilish)",
      sleep_problems: "Uyqu buzilishi",
      joint_muscle: "Bo'g'im va mushak og'rig'i",
      depressive_mood: "Tushkun kayfiyat",
      irritability: "Asabiylashish",
      anxiety: "Xavotir, ichki notinchlik",
      exhaustion: "Jismoniy va ruhiy charchoq",
      sexual_problems: "Jinsiy hayotdagi o'zgarishlar",
      bladder_problems: "Siydik pufagi muammolari",
      vaginal_dryness: "Quruqlik hissi",
    },
  },
  reminders: {
    logToday: "Bugungi holatingizni hali belgilamadingiz. Bir daqiqa ajratib, sikl kuzatuvini davom ettiring 🌸",
    logButton: "Belgilash",
    periodToday: "Bugun hayzingiz boshlanishi kutilmoqda 🩷",
    periodTomorrow: "Ertaga hayzingiz boshlanishi kutilmoqda — tayyorgarlik ko'ring 🩷",
    periodSoon: (days: number) => `${days} kundan keyin hayzingiz boshlanadi 🩷`,
    periodOngoing: (day: number) => `Hayzingizning ${day}-kuni. Bugun ham davom etyaptimi? Bir bosishda belgilab qo'ying 🩷`,
    // PERIOD-TRACK-04: dog'lanish hayz boshlanishi SANALMAYDI, shuning
    // uchun bu yerda kun soni ham, "hayzingiz" so'zi ham ishlatilmaydi.
    spottingOngoing: "Dog'lanishni belgilagansiz. Bugun hayz boshlandimi? Bir bosishda belgilab qo'ying 🩷",
    periodEndedAsk: "Hayzingiz tugadimi? Oxirgi kunini belgilab qo'ysangiz, keyingi bashorat aniqroq bo'ladi 🩷",
    periodConfirm: "Hayzingiz shu kunlarda kutilyapti. Boshlangan bo'lsa, belgilab qo'ying — shunda bashorat aniqroq bo'ladi 🩷",
    periodLate: (days: number) => `Hayzingiz ${days} kun kechikmoqda — bu me'yorda bo'lishi ham mumkin, lekin kuzatib boring 🩷`,
    // CYCLE-ALGO-12: ovulyatsiya signalini qayd etishga nozik taklif —
    // ilovaga qaytganda bashoratni aniqlashtirish imkoniyatini eslatadi.
    fertileWindow: "Siz hozir unumdor oyna ichidasiz. Ovulyatsiya belgilarini sezsangiz, ilovada belgilang — bashorat aniqroq bo'ladi 🌸",
    // REMIND-02: onboardingni tugatmaganlar uchun ALOHIDA matn. Ularga
    // "kuzatuvni DAVOM ETTIRING" deyish noto'g'ri edi — ular hech qachon
    // boshlamagan. Bu xabar ko'pi bilan uch marta yuboriladi.
    finishSetup: "Sozlashni tugatmabsiz. Bir-ikki savol qoldi — shundan keyin sikl bashorati va eslatmalar ishlay boshlaydi 🌸",
    finishSetupButton: "Tugatish",
    // SCREEN-01: muddati o'tgan tekshiruv. Ohang ayblovchi emas —
    // qo'rquv bu yerda harakatga undamaydi, ortga suradi.
    checkupOverdue: (count: number) =>
      count === 1
        ? "Bitta tekshiruvingiz muddati o'tdi. Yaqin klinikani ko'rib chiqaylikmi? \ud83e\ude7a"
        : `${count} ta tekshiruvingiz muddati o'tdi. Yaqin klinikani ko'rib chiqaylikmi? \ud83e\ude7a`,
    checkupButton: "Ko'rish",
    // Homiladorlik rejimi uchun — ilgari bu ayollarga UMUMAN xabar
    // yuborilmasdi (sikl matnlari ularga to'g'ri kelmagani uchun jim
    // qolinardi, lekin o'rniga hech narsa qo'yilmagan edi).
    pregnancyWeek: (week: number) => `${week}-hafta. Bugun o'zingizni qanday his qilyapsiz? Belgilab qo'ying 🤰`,
    pregnancyLogToday: "Bugungi holatingizni belgilamadingiz. Bir daqiqa ajratsangiz, shifokorga ko'rsatadigan yozuvingiz to'liq bo'ladi 🤰",
  },

  feedback: {
    menuLabel: "Fikr bildirish",
    title: "Fikr-mulohazangiz",
    subtitle: "Ilova sizga qanday yordam berayotgani haqida gapiring",
    ratingLabel: "Umumiy bahoingiz",
    // PREMIUM-01
    premiumTitle: "Premium so'rovi",
    premiumSubtitle: "So'rovingizni qoldiring — biz bog'lanamiz",
    premiumPlaceholder: "Qaysi imkoniyat kerakligini yozsangiz bo'ladi (majburiy emas)",
    premiumSubmit: "So'rov yuborish",
    premiumThankYou: "So'rovingiz qabul qilindi. Tez orada bog'lanamiz.",
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
      perimenopause: "Klimaks",
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
  // NOTIF-02: eslatmalarni yoqish taklifi (bosh ekranda, bir marta).
  notificationsOptIn: {
    title: "Eslatmalarni yoqasizmi?",
    body: "Hayzingiz yaqinlashganda va tekshiruv muddati kelganda Telegram orqali xabar beramiz. Kuniga bittadan ko'p emas.",
    enable: "Yoqish",
    later: "Keyinroq",
  },
  // REPORT-01: shifokor qabuliga olib boriladigan xulosa.
  doctorReport: {
    title: "Shifokor uchun hisobot",
    subtitle: "Qabulga olib boring — telefonda ko'rsating yoki chop eting",
    premiumTitle: "Hisobot — Premium",
    premiumBody: "Sikl tarixingiz, takrorlanuvchi simptomlaringiz va tekshiruvlaringiz bir sahifada. Shifokor qabulida xotiradan gapirish shart emas.",
    generatedOn: (date: string) => `Tuzilgan: ${date}`,
    lastPeriod: "Oxirgi hayz boshlanishi",
    cycleLength: "Sikl uzunligi",
    cycleRange: (avg: number, min: number, max: number) => `${avg} kun (${min}–${max})`,
    cyclesObserved: "Kuzatilgan sikllar",
    loggedDays: "Qayd etilgan kunlar",
    age: "Yosh",
    familyHistory: "Oilada saraton tarixi",
    symptomsTitle: "Eng ko'p uchragan simptomlar",
    days: (n: number) => `${n} kun`,
    overdueTitle: "Muddati o'tgan tekshiruvlar",
    completedTitle: "Bajarilgan tekshiruvlar",
    limitedDataNotice: "Hozircha 3 tadan kam sikl kuzatilgan — bu raqamlar dastlabki, ishonchli xulosa uchun yetarli emas.",
    disclaimer: "Bu hisobot foydalanuvchining o'z yozuvlaridan tuzilgan. U tibbiy hujjat emas va tashxis o'rnini bosmaydi.",
    printButton: "Chop etish",
  },
  registerGate: {
    title: "Bu funksiya uchun hisob kerak",
    action: "Hisob ochish yoki kirish",
    note: "Qolgan hamma narsa — sikl kuzatuvi, kalendar, maqolalar, tekshiruvlar va klinikalar — hisobsiz ham ochiq.",
    reasons: {
      "ai-chat": "Yordamchi javoblari pullik xizmat orqali tayyorlanadi, shuning uchun u hisobga bog'lanadi.",
      "community-post": "Jamiyatda yozilgan har bir matn uchun kimdir javobgar bo'lishi kerak — shuning uchun yozish hisob talab qiladi. O'qish ochiq.",
      reminders: "Eslatmalar Telegram orqali yuboriladi — hisob bo'lmasa, ularni yuboradigan manzil ham bo'lmaydi.",
      partner: "Hamkor aloqasi hisobga bog'lanadi. Hisobsiz u qurilma almashtirilsa yo'qolib ketardi.",
      "doctor-report": "Hisobot sizning uzoq muddatli tarixingizdan tuziladi — uni saqlab turish uchun hisob kerak.",
    },
  },
  enableReminders: {
    title: "Eslatmalar",
    doneTitle: "Eslatmalar yoqildi",
    doneBody: "Endi hayz, unumdor oyna va tekshiruv muddatlari haqida Telegram orqali xabar olasiz. Istalgan vaqtda profildan o'chirasiz.",
    continueButton: "Davom etish",
    undo: "Yo'q, o'chirib qo'ying",
  },
  enableRemindersPrompt: {
    text:
      "Sizda MammoAI eslatmalari o'chirilgan \u2014 ehtimol bu bizning xatomiz tufayli: ilgari ruxsat so'rovi yiqilsa, eslatma jimgina o'chib qolardi.\n\nYoqsangiz, hayzingiz kutilayotgan kun, unumdor oyna va tekshiruv muddatlari haqida xabar beramiz. Kuniga ko'pi bilan bitta xabar, istalgan vaqtda o'chirasiz.",
    button: "\ud83d\udd14 Eslatmalarni yoqish",
  },
  apiErrors: {
    pregnancy_date_future: "Bu sana kelajakda — oxirgi hayz sanasi bugundan keyin bo'lishi mumkin emas.",
    pregnancy_date_too_old: "Bu sana juda eski — homiladorlik muddati 44 haftadan oshmaydi. Sanani tekshiring.",
    pregnancy_date_invalid: "Sana noto'g'ri kiritildi.",
    registration_required: "Bu funksiya uchun hisob kerak",
    invalid_tag: "Mavzu (tag) noto'g'ri",
    post_too_short: "Kamida bir necha so'z yozing",
    premium_required: "Bu funksiya Premium obuna talab qiladi",
    message_too_long: "Xabar juda uzun",
    daily_chat_limit_reached: "Bugungi xabarlar limiti tugadi — ertaga davom eting",
    ai_unavailable: "AI yordamchi hozir vaqtinchalik ishlamayapti — bu sizning savolingizda emas. Biroz keyinroq qayta urinib ko'ring.",
  },
};

export default uz;
