import { Suspense } from "react";
import { ClinicsScreen } from "@/components/screens/ClinicsScreen";

/**
 * BRIDGE-01 — klinikalar endi HAQIQIY sahifa.
 *
 * Ilgari bu fayl `/asosiy` ga qayta yo'naltirardi, klinikalar ro'yxati esa
 * bosh sahifaning eng pastida, yopiq karta ichida turardi. Natijasi
 * o'lchovda ko'rindi: 30 kunda `/klinikalar` — 1 foydalanuvchi.
 *
 * Bu shunchaki joylashuv muammosi emas edi. Tekshiruvlar ekranidagi
 * "Klinika topish" tugmasi `/asosiy?checklistItemId=...` ga olib borardi —
 * ayol bosh sahifaning TEPASIGA tushardi, klinikalar bo'limi esa pastda
 * ochilardi va HECH QANDAY sakrash yo'q edi. Ya'ni u o'zining sikl
 * ma'lumotini ko'rardi va "klinika qani?" deb qolardi.
 *
 * "Tekshiruv kerak -> uni qayerda qilaman" — bu ilovaning asosiy zanjiri
 * (ko'prik modeli va B2B daromadi shunga bog'liq). Zanjirning aynan shu
 * bo'g'ini uzilgan edi.
 */
export default function KlinikalarPage() {
  // `ClinicsScreen` ichida `useSearchParams` bor — Next.js uni Suspense
  // chegarasini talab qiladi, aks holda butun sahifa dinamik render'ga
  // tushib qolardi.
  return (
    <Suspense fallback={null}>
      <ClinicsScreen />
    </Suspense>
  );
}
