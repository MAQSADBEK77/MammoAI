// Haqiqiy telefon push-bildirishnomasi (roadmap 10-band) — ilgari faqat OS
// ruxsati so'ralardi (onboarding.tsx), token hech qachon olinmas/saqlanmas
// edi. Bu hook foydalanuvchi kirgach (yangi HAM, eski HAM) bir marta ishga
// tushadi: ruxsat holatini tekshiradi (QAYTA SO'RAMAYDI — faqat allaqachon
// berilgan bo'lsa), token oladi, serverga yuboradi.
//
// MUHIM: Android'da bu ISHLASHI uchun FCM (Firebase) hisob ma'lumotlari EAS
// orqali yuklangan bo'lishi kerak — hozircha sozlanmagan (google-services.json
// yo'q). Shuning uchun `getExpoPushTokenAsync` xato tashlashi mumkin — bu
// jimgina yutiladi, ilova ishlayveradi (matn/Telegram bildirishnomasi
// buzilmaydi), faqat push jismonan yetib bormaydi FCM sozlanmaguncha.
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useSession } from "./session";
import { api } from "./api";

export function usePushTokenRegistration(): void {
  const { status } = useSession();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (status !== "onboarded" || registeredRef.current) return;
    registeredRef.current = true;

    (async () => {
      try {
        const perm = await Notifications.getPermissionsAsync();
        if (perm.status !== "granted") return;
        const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
        const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        if (token) await api.notifications.registerPushToken(token);
      } catch {
        // FCM/APNs hali sozlanmagan bo'lishi mumkin — ilova ishlayveradi.
      }
    })();
  }, [status]);
}
