"use client";

// Haftalik chaqaloq rasmi — avval mevalar bilan taqqoslaydigan aylantirish
// mumkin 3D model bo'lgan (CC-BY litsenziyali, litsenziyasiz "tibbiy-realistik"
// variant topilmagani uchun). Endi foydalanuvchi o'zi AI orqali generatsiya
// qilgan (o'z huquqi) haftalik rasmlar to'plami bilan almashtirildi —
// `apps/web/public/embryo/week<N>.jpg`. Tarmoq/rasm yuklanmasa placeholder
// emoji-doiraga tushadi (SizeIllustration, eski komponent).

import { useState } from "react";
import { getEmbryoImageWeek } from "@mammoai/shared";
import { SizeIllustration } from "@/components/SizeIllustration";

export function PregnancyWeekImage({ week, icon }: { week: number; icon: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <SizeIllustration icon={icon} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- statik hafta rasmi, next/image optimizatsiyasi kerak emas
    <img
      src={`/embryo/week${getEmbryoImageWeek(week)}.jpg`}
      alt=""
      className="mx-auto h-40 w-40 rounded-full object-cover shadow-lg"
      onError={() => setFailed(true)}
    />
  );
}
