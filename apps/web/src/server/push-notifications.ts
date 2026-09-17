// Haqiqiy telefon push-bildirishnomasi — Expo Push API orqali (roadmap
// 10-band). Bu FAQAT o'chirilgan apps/mobile (Expo/expo-notifications)
// uchun mo'ljallangan edi — Mini App/veb'da native push yo'q.
//
// WEB2-04 (2026-09-17): apps/mobile butunlay olib tashlandi (d7b52f5),
// shuning uchun bazadagi barcha `expo_push_token` qiymatlari ENDI ABADIY
// yaroqsiz — ularga yuborilgan har bir so'rov 100% muvaffaqiyatsiz
// bo'lishi kafolatlangan (hech qanday klient bu token'larni yangilay
// olmaydi — POST /api/push-token'ga endi hech kim so'rov yubormaydi).
// Avval bu funksiya "xavfsiz jim" qolardi (FCM sozlanmagani uchun xato
// yutilardi) — endi esa har chaqiriqda ATAYLAB behuda tarmoq so'rovi
// yuborilardi (notifyUser() har bir bildirishnomada, daily-reminders.ts
// kuniga bir marta). Shu behuda so'rovlarni to'xtatish uchun funksiya
// endi hech narsa qilmasdan darhol qaytadi — chaqiruvchi tomonlarni
// (repo.ts#notifyUser, daily-reminders.ts) o'zgartirish shart emas,
// ular allaqachon xatoni/natijani e'tiborsiz qoldiradi.
//
// KEYINGI TOZALASH BOSQICHI (hozircha REJALASHTIRILGAN, bajarilmagan):
// `expo_push_token` ustunini (db.ts) va uni o'qiydigan/yozadigan barcha
// joylarni (repo.ts#setExpoPushToken/notifyUser, daily-reminders.ts,
// apps/web/src/app/api/push-token/route.ts) butunlay olib tashlash —
// bu DB sxemasini o'zgartiradigan alohida migratsiya talab qiladi,
// shuning uchun bu safar qilinmadi.
export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendExpoPushNotification(token: string, payload: PushPayload): Promise<void> {
  // Ataylab no-op — yuqoridagi izohga qarang.
}
