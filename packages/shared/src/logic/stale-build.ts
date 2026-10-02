/**
 * DEPLOY-02 — telefonda eski nusxa qolib ketishi.
 *
 * Muammo (foydalanuvchi uch marta takrorladi: "nega hali ham
 * ishlamayapti / o'zgarmadi"): kod `main`ga tushgan, Vercel deploy
 * qilgan, `/api/version` yangi commit'ni ko'rsatadi — lekin Telegram
 * Mini App webview'i ESKI hujjatni va eski JS bo'laklarini ishlatishda
 * davom etadi. Tashqaridan bu "o'zgarish qilinmagan"dek ko'rinadi va
 * har safar qo'lda tekshirishga to'g'ri keladi.
 *
 * Yechim: ilova o'z versiyasini jonli serverdagisi bilan solishtiradi
 * va farq bo'lsa BIR MARTA qayta yuklanadi.
 *
 * Qaror shu yerda, sof funksiyada — chunki noto'g'ri yozilsa u
 * CHEKSIZ qayta yuklash halqasiga aylanadi va ilovani butunlay
 * ishlatib bo'lmay qoladi.
 */
export function shouldReloadForNewBuild(input: {
  /** Ishlab turgan to'plamga build paytida yozilgan commit. */
  builtCommit: string | null | undefined;
  /** Serverdagi jonli commit. */
  liveCommit: string | null | undefined;
  /** Shu sessiyada qaysi commit uchun allaqachon qayta yuklangan. */
  alreadyReloadedFor: string | null | undefined;
}): boolean {
  const { builtCommit, liveCommit, alreadyReloadedFor } = input;
  // Lokal ishlab chiqishda commit yo'q — hech qachon qayta yuklamaymiz.
  if (!builtCommit || !liveCommit) return false;
  if (builtCommit === "local" || liveCommit === "local") return false;
  if (builtCommit === liveCommit) return false;
  // Eng muhim himoya: shu commit uchun bir marta qayta yuklaganmiz.
  // Busiz, deploy yarim yo'lda bo'lsa (bir server eski, biri yangi),
  // ilova cheksiz aylanardi.
  if (alreadyReloadedFor === liveCommit) return false;
  return true;
}
