// Haqiqiy telefon push-bildirishnomasi — Expo Push API orqali (roadmap
// 10-band: "app ni o'zida bildirishnomalarni yaxshilash", ilgari faqat
// Telegram bot orqali edi, Mini App'da native push yo'qligi uchun; lekin
// haqiqiy mobil ilova — expo-notifications — buni qo'llab-quvvatlaydi).
//
// MUHIM: Android'da Expo push ISHLASHI uchun loyihada FCM (Firebase Cloud
// Messaging) hisob ma'lumotlari sozlangan bo'lishi kerak (`eas credentials`
// orqali yuklanadi) — bu HALI qilinmagan (google-services.json yo'q).
// Shuning uchun bu funksiya XAVFSIZ jim qoladi (xato tashlamaydi) agar
// token yo'q yoki Expo API xato qaytarsa — FCM sozlanmaguncha push
// jismonan yetib bormaydi, lekin ilova/boshqa bildirishnoma kanallari
// (Telegram, ilova ichi) buzilmaydi.

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendExpoPushNotification(token: string, payload: PushPayload): Promise<void> {
  try {
    await fetch(EXPO_PUSH_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        to: token,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        sound: "default",
      }),
    });
  } catch {
    // Tarmoq xatosi — push yo'qoladi, lekin asosiy amal davom etadi.
  }
}
