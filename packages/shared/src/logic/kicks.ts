/**
 * PREG-KICKS-01 — homila harakatlari sanagichi.
 *
 * Nega bu shunchaki sanoq emas: 28-haftadan keyin harakatlarning
 * KAMAYISHI — shifokorga zudlik bilan murojaat qilish uchun eng muhim
 * belgilardan biri. Ayol buni "bugun kamroq tepdi shekilli" degan
 * noaniq his bilan emas, RAQAM bilan ko'rishi kerak.
 *
 * Qoida: bir seansda 10 ta harakat. Ko'p qo'llanmalarda "2 soat ichida
 * 10 ta" deyiladi — shuning uchun 2 soat to'lgach seans yopiladi va
 * agar 10 taga yetmagan bo'lsa, bu ALOHIDA aytiladi.
 *
 * MUHIM: bu ekran "hammasi joyida" demaydi. 10 taga yetgan seans ham
 * faqat "yetdi" deydi, chunki normal sanoq kasallikni istisno qilmaydi.
 * Ayolning o'z sezgisi ("odatdagidan kamroq") har qanday raqamdan
 * ustun turadi va matnda shu aytiladi.
 */

export const KICK_TARGET = 10;
export const KICK_SESSION_MAX_MIN = 120;
/** Harakatlarni sanash tavsiya etiladigan eng erta hafta. */
export const KICK_START_WEEK = 28;

export interface KickSession {
  /** ISO vaqt — seansning birinchi harakati. */
  startedAt: string;
  /** Har bir harakatning ISO vaqti (birinchisi `startedAt` bilan bir xil). */
  kicks: string[];
}

export interface KickSummary {
  count: number;
  /** Seans boshlanganidan beri o'tgan daqiqa. */
  elapsedMin: number;
  /** 10 taga yetdimi. */
  reachedTarget: boolean;
  /** 2 soat to'ldi va 10 taga yetmadi — shifokorga murojaat qilish sababi. */
  lowCount: boolean;
  /** Yangi harakat qabul qilinadimi (seans hali ochiqmi). */
  open: boolean;
}

/**
 * Seansning hozirgi holati.
 *
 * `now` majburiy: sof funksiya bo'lishi uchun vaqt tashqaridan beriladi
 * (loyihadagi boshqa mantiq modullari ham shunday).
 */
export function summarizeKickSession(session: KickSession | null, now: Date): KickSummary {
  if (!session || session.kicks.length === 0) {
    return { count: 0, elapsedMin: 0, reachedTarget: false, lowCount: false, open: true };
  }
  const start = Date.parse(session.startedAt);
  const elapsedMin = Math.max(0, Math.floor((now.getTime() - start) / 60000));
  const count = session.kicks.length;
  const reachedTarget = count >= KICK_TARGET;
  const timeUp = elapsedMin >= KICK_SESSION_MAX_MIN;
  return {
    count,
    elapsedMin,
    reachedTarget,
    // Vaqt tugaganda va nishonga yetilmaganda — ogohlantirish. Nishonga
    // yetilgan bo'lsa vaqt tugashi muhim emas.
    lowCount: timeUp && !reachedTarget,
    open: !reachedTarget && !timeUp,
  };
}

/**
 * Yozuvlardan joriy seansni yig'adi.
 *
 * Seans — ketma-ket harakatlar to'plami. Oxirgi harakatdan beri 2 soatdan
 * ko'p o'tgan bo'lsa, u seans YOPILGAN hisoblanadi va yangi harakat yangi
 * seansni boshlaydi. Aks holda kechagi bitta harakat bugungi sanoqqa
 * qo'shilib, raqamni yolg'on ko'rsatardi.
 */
export function currentKickSession(kickTimes: string[], now: Date): KickSession | null {
  if (kickTimes.length === 0) return null;
  const sorted = [...kickTimes].sort();
  const session: string[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const t = Date.parse(sorted[i]);
    const first = session.length > 0 ? Date.parse(session[0]) : now.getTime();
    // Seansning boshidan 2 soatdan uzoq orqada qolgan harakat boshqa seans.
    if (session.length > 0 && first - t > KICK_SESSION_MAX_MIN * 60000) break;
    if (session.length === 0 && now.getTime() - t > KICK_SESSION_MAX_MIN * 60000) break;
    session.unshift(sorted[i]);
  }
  if (session.length === 0) return null;
  return { startedAt: session[0], kicks: session };
}
