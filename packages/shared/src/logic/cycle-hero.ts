// TTC-01 — "asosiy" ekranning markaziy ikki qatorli blokini (hero) QAYSI
// holatda ko'rsatishni hal qiluvchi SOF funksiya.
//
// Nega alohida fayl: bu qaror ayolga ekranning eng katta shriftida nima
// yozilishini belgilaydi, ya'ni u ilovadan oladigan ASOSIY xabar. Uni
// komponent ichida qoldirsak, faqat brauzerda, haqiqiy sikl tarixi bilan
// tekshirish mumkin bo'lardi — buni esa test bilan qamrab bo'lmaydi.
// Shuning uchun bu yerda faqat QAROR qabul qilinadi; matnlar (tarjimalar)
// komponentda qo'shiladi.

export type CycleHeroState =
  /** Hozir hayz ketyapti — "Hayz: 3-kun". */
  | { kind: "period"; day: number }
  /** Homiladorlikka tayyorgarlik + bugun unumdor oyna ichida. */
  | { kind: "fertile-today" }
  /** Homiladorlikka tayyorgarlik + ovulyatsiyagacha `days` kun qoldi. */
  | { kind: "ovulation-in"; days: number }
  /** Keyingi hayzgacha `days` kun (0 = bugun). */
  | { kind: "next-period-in"; days: number }
  /** Hayz `days` kunga kechikkan. */
  | { kind: "delayed"; days: number }
  /** Ikki qatorga bo'linmaydigan holat — chaqiruvchi bitta izoh qatorini ko'rsatadi. */
  | { kind: "none" };

export type CycleHeroInput = {
  /** Bugungi sana, "YYYY-MM-DD". */
  today: string;
  /** Bashorat yo'q yoki eskirgan bo'lsa `null`. */
  prediction: {
    ovulationDay: string;
    fertileWindowStart: string;
    fertileWindowEnd: string;
    daysUntilNextPeriod: number;
    isStale: boolean;
  } | null;
  /** Bashorat kutilgan, lekin hayz belgilanmagan holat. */
  periodExpectedButUnlogged: boolean;
  isOnPeriod: boolean;
  /** Hayzning nechanchi kuni (faqat `isOnPeriod` bo'lganda ma'noli). */
  periodDay: number | null;
  isIrregular: boolean;
  isLowInfoPrediction: boolean;
  /** Gormonal kontratseptsiya — unumdorlik hisobi ma'noli emas. */
  suppressFertility: boolean;
  /** `primaryGoal === "planning_pregnancy"`. */
  isTryingToConceive: boolean;
};

/** Ikki sana orasidagi kunlar farqi (`b - a`). */
function daysBetween(a: string, b: string): number {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export function resolveCycleHero(input: CycleHeroInput): CycleHeroState {
  const { prediction } = input;
  if (!prediction || prediction.isStale || input.periodExpectedButUnlogged) return { kind: "none" };

  if (input.isOnPeriod && input.periodDay !== null) return { kind: "period", day: input.periodDay };
  if (input.isOnPeriod) return { kind: "none" };

  // Tartibsiz sikl yoki past ishonchda ANIQ kun aytish soxta aniqlik bo'lardi —
  // bu holatlar o'zining alohida, yumshoqroq matnini oladi.
  if (input.isIrregular || input.isLowInfoPrediction) return { kind: "none" };

  // Homiladorlikka TAYYORGARLIK rejimida hero "keyingi hayzgacha necha kun"
  // deb boshlanmaydi: homilador bo'lmoqchi bo'lgan ayol uchun hayz aynan u
  // KUTMAYDIGAN natija, unga kerakli sana esa ovulyatsiya.
  if (input.isTryingToConceive && !input.suppressFertility) {
    if (input.today >= prediction.fertileWindowStart && input.today <= prediction.fertileWindowEnd) {
      return { kind: "fertile-today" };
    }
    const toOvulation = daysBetween(input.today, prediction.ovulationDay);
    if (toOvulation > 0) return { kind: "ovulation-in", days: toOvulation };
  }

  const days = prediction.daysUntilNextPeriod;
  return days < 0 ? { kind: "delayed", days: Math.abs(days) } : { kind: "next-period-in", days };
}
