// Web'dagi PregnancyWeekImage.tsx bilan bir xil naqsh — izoh o'sha yerda.
// Statik ommaviy rasm (album fotosuratlaridan farqli, autentifikatsiya
// kerak emas) — to'g'ridan-to'g'ri https://mammo.uz'dan yuklanadi.
import { useState } from "react";
import { Image } from "react-native";
import { getEmbryoImageWeek } from "@mammoai/shared";
import { SizeIllustration } from "@/components/SizeIllustration";

export function PregnancyWeekImage({ week, icon }: { week: number; icon: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <SizeIllustration icon={icon} />;

  return (
    <Image
      source={{ uri: `https://mammo.uz/embryo/week${getEmbryoImageWeek(week)}.jpg` }}
      style={{ width: 160, height: 160, borderRadius: 80, alignSelf: "center" }}
      onError={() => setFailed(true)}
    />
  );
}
