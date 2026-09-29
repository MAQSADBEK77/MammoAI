/**
 * AUTH-03 — telefon tasdiqlangandan keyin nima qilish kerak.
 *
 * Telegram'dan kirgan ayolda endi TELEFONSIZ hisob ochiladi. Keyinroq u
 * raqamini kiritsa, to'rtta holat bo'lishi mumkin va ularni chalkashtirib
 * yuborish ma'lumot yo'qolishiga olib keladi. Shuning uchun qaror shu
 * yerda, testlar bilan qotirilgan.
 *
 * Eng nozik holat — uchinchisi: ayol ilgari telefon bilan ro'yxatdan
 * o'tgan (o'sha hisobda sikl tarixi bor), endi esa Mini App unga YANGI,
 * bo'sh hisob ochib bergan. Bunday paytda ESKI hisob saqlanadi va
 * Telegram bog'lanishi o'sha yoqqa ko'chiriladi. Teskarisi — yangi
 * bo'sh hisobni saqlab, eskisini tashlab yuborish — ayolning butun
 * tarixini ko'rinmas qilib qo'yardi.
 */

export type PhoneLinkAction =
  /** Hech qanday hisob yo'q edi — telefon bilan yangi hisob ochiladi. */
  | { kind: "create-account" }
  /** Joriy (telefonsiz) hisobga telefon biriktiriladi. */
  | { kind: "attach-phone"; userId: string }
  /** Telefon boshqa, ESKI hisobga tegishli — o'shanga o'tamiz. */
  | { kind: "switch-to-existing"; userId: string; moveTelegramFrom: string | null }
  /** Telefon allaqachon shu hisobniki — hech narsa o'zgarmaydi. */
  | { kind: "already-linked"; userId: string };

export function resolvePhoneLink(input: {
  /** Hozir kim tizimda (sessiya) — bo'lmasa null. */
  currentUserId: string | null;
  /** Joriy hisobda telefon bormi. */
  currentUserHasPhone: boolean;
  /** Shu telefon qaysi hisobga tegishli (bo'lmasa null). */
  existingUserId: string | null;
}): PhoneLinkAction {
  const { currentUserId, currentUserHasPhone, existingUserId } = input;

  if (existingUserId && currentUserId && existingUserId === currentUserId) {
    return { kind: "already-linked", userId: currentUserId };
  }
  if (existingUserId) {
    // Telegram bog'lanishi faqat joriy hisob TELEFONSIZ bo'lsa ko'chiriladi:
    // u shu ochilishda yaratilgan bo'sh hisob. Telefoni bor hisobdan
    // ko'chirish — boshqa odamning hisobini o'g'irlash yo'li bo'lardi.
    const moveFrom = currentUserId && !currentUserHasPhone ? currentUserId : null;
    return { kind: "switch-to-existing", userId: existingUserId, moveTelegramFrom: moveFrom };
  }
  if (currentUserId && !currentUserHasPhone) {
    return { kind: "attach-phone", userId: currentUserId };
  }
  return { kind: "create-account" };
}
