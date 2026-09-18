// Trendlar/statistika — AI Yordamchi ekranining "Statistika" segmenti uchun.
// Alohida "stats" jadvali yo'q: hammasi mavjud cycle_logs ustida sof JS
// agregatsiya (ML emas) — Flo uslubidagi "simptomlar qachon takrorlanadi",
// "sikl uzunligi qanday o'zgaryapti" kabi savollarga javob beradi.
//
// DATA-ACCURACY-01: sof hisob-kitob mantig'i (avval shu faylda edi)
// `@mammoai/shared`ga ko'chirildi (`logic/insights.ts`) — DB'ga bog'liq
// `./repo` importi tufayli bu fayl HECH QACHON vitest bilan sinalmas edi.
// Endi bu yerda faqat DB'dan o'qish + sof funksiyaga uzatish qoladi.
import { listCycleLogs } from "./repo";
import { computeInsightsSummary } from "@mammoai/shared";
import type { InsightsSummary } from "@mammoai/shared";

export async function getInsightsSummary(userId: string): Promise<InsightsSummary> {
  const logs = await listCycleLogs(userId, 365);
  return computeInsightsSummary(logs);
}
