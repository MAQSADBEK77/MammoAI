// CYCLE-ALGO-14 — algoritm sozlash-parametrlarini (RECENCY_DECAY/SHRINKAGE_K/
// ADAPTIVE_MAX_CYCLES) HAQIQIY foydalanuvchi `cycle_logs` tarixiga qarshi
// o'lchov qilish uchun bir martalik skript. Bu ilgari faqat sintetik
// (qo'lda o'ylab topilgan) stsenariylarga qarab tanlangan edi — endi
// production'da haqiqiy ma'lumot bor, shuning uchun taxmin o'rniga
// o'LCHOV asosida qaror qabul qilinadi.
//
// MAXFIYLIK: bu skript hech qanday sana/simptom/foydalanuvchi ID'sini
// LOG'ga chiqarmaydi — faqat AGREGAT xato-statistikasi (avgErrorDays,
// within2DaysPct, qancha foydalanuvchi/sikl baholangani). Faqat O'QISH
// (SELECT) so'rovlari — hech narsa yozilmaydi/o'zgartirilmaydi.
//
// Ishga tushirish: node --import tsx scripts/backtest-real-users.ts

import { sql, ensureSchema } from "../src/server/db";
import {
  backtestPredictor,
  currentPredictor,
  makeTunablePredictor,
  type BacktestLog,
  type CyclePredictor,
} from "@mammoai/shared";

const MIN_CYCLES_FOR_BACKTEST = Number(process.env.MIN_CYCLES_FOR_BACKTEST ?? 4);

interface AggregateResult {
  name: string;
  usersEvaluated: number;
  cyclesEvaluated: number;
  // "avgErrorDays" ikki xil usulda: (1) har bir foydalanuvchining o'z
  // avgErrorDays'ini keyin o'rtachalash (oddiy, lekin kam-sikl
  // foydalanuvchini ko'p-sikl foydalanuvchi bilan TENG og'irlikda
  // hisoblaydi), (2) barcha sikllarning XOM xatolarini birlashtirib bitta
  // o'rtacha (statistik jihatdan to'g'riroq — ko'proq sikl = ko'proq
  // og'irlik). Qaror uchun (2) — "pooled" — asosiy ko'rsatkich sifatida
  // ishlatiladi, (1) faqat solishtirish uchun ko'rsatiladi.
  pooledAvgErrorDays: number;
  meanOfUserAvgErrorDays: number;
  within2DaysPct: number;
}

function aggregate(name: string, perUserResults: { avgErrorDays: number; within2DaysPct: number; cyclesEvaluated: number }[]): AggregateResult | null {
  if (perUserResults.length === 0) return null;
  const totalCycles = perUserResults.reduce((sum, r) => sum + r.cyclesEvaluated, 0);
  const pooledErrorSum = perUserResults.reduce((sum, r) => sum + r.avgErrorDays * r.cyclesEvaluated, 0);
  const pooledWithin2Sum = perUserResults.reduce((sum, r) => sum + (r.within2DaysPct / 100) * r.cyclesEvaluated, 0);
  const meanOfUserAvg = perUserResults.reduce((sum, r) => sum + r.avgErrorDays, 0) / perUserResults.length;
  return {
    name,
    usersEvaluated: perUserResults.length,
    cyclesEvaluated: totalCycles,
    pooledAvgErrorDays: Math.round((pooledErrorSum / totalCycles) * 100) / 100,
    meanOfUserAvgErrorDays: Math.round(meanOfUserAvg * 100) / 100,
    within2DaysPct: Math.round((pooledWithin2Sum / totalCycles) * 100),
  };
}

async function loadRealUserLogs(): Promise<Map<string, BacktestLog[]>> {
  await ensureSchema();
  // Faqat sinov/test hisoblari CHIQARIB tashlanadi — haqiqiy
  // foydalanuvchilarning haqiqiy tarixi kerak. `symptoms`ni ham olamiz
  // (kelajakdagi luteal-faza hisob-kitobi uchun kerak bo'lishi mumkin),
  // lekin HECH QACHON log'ga chiqarilmaydi.
  const rows = (await sql`
    SELECT cl.user_id, cl.date, cl.flow, cl.symptoms, cl.basal_body_temp
    FROM cycle_logs cl
    JOIN users u ON u.id = cl.user_id
    WHERE u.is_test_account = FALSE
    ORDER BY cl.user_id, cl.date
  `) as unknown as { user_id: string; date: string; flow: BacktestLog["flow"]; symptoms: string; basal_body_temp: number | null }[];

  const byUser = new Map<string, BacktestLog[]>();
  for (const row of rows) {
    const list = byUser.get(row.user_id) ?? [];
    list.push({
      date: row.date,
      flow: row.flow,
      symptoms: JSON.parse(row.symptoms ?? "[]"),
      basalBodyTemp: row.basal_body_temp,
    });
    byUser.set(row.user_id, list);
  }
  return byUser;
}

function runVariant(byUser: Map<string, BacktestLog[]>, predictor: CyclePredictor): AggregateResult | null {
  const perUserResults: { avgErrorDays: number; within2DaysPct: number; cyclesEvaluated: number }[] = [];
  for (const logs of byUser.values()) {
    const result = backtestPredictor(logs, predictor, MIN_CYCLES_FOR_BACKTEST);
    if (result) perUserResults.push(result);
  }
  return aggregate(predictor.name, perUserResults);
}

async function main() {
  console.log("Haqiqiy foydalanuvchi cycle_logs tarixini yuklamoqda...");
  const byUser = await loadRealUserLogs();
  console.log(`Jami ${byUser.size} ta foydalanuvchi (test hisoblarisiz) topildi.`);

  // CYCLE-ALGO-14: joriy konstantalar + har biriga 2 tadan muqobil qiymat —
  // bir vaqtning o'zida FAQAT bitta parametr o'zgartiriladi (qolganlari
  // joriy qiymatda qoladi), natija talqin qilish osonroq bo'lishi uchun.
  const variants: { name: string; tunables: { recencyDecay: number; shrinkageK: number; adaptiveMaxCycles: number } }[] = [
    { name: "joriy (decay=0.7, k=3, maxCycles=6)", tunables: { recencyDecay: 0.7, shrinkageK: 3, adaptiveMaxCycles: 6 } },
    { name: "decay=0.6", tunables: { recencyDecay: 0.6, shrinkageK: 3, adaptiveMaxCycles: 6 } },
    { name: "decay=0.8", tunables: { recencyDecay: 0.8, shrinkageK: 3, adaptiveMaxCycles: 6 } },
    { name: "shrinkageK=2", tunables: { recencyDecay: 0.7, shrinkageK: 2, adaptiveMaxCycles: 6 } },
    { name: "shrinkageK=4", tunables: { recencyDecay: 0.7, shrinkageK: 4, adaptiveMaxCycles: 6 } },
    { name: "maxCycles=8", tunables: { recencyDecay: 0.7, shrinkageK: 3, adaptiveMaxCycles: 8 } },
    { name: "maxCycles=12", tunables: { recencyDecay: 0.7, shrinkageK: 3, adaptiveMaxCycles: 12 } },
  ];

  const results: AggregateResult[] = [];

  const currentResult = runVariant(byUser, currentPredictor);
  if (currentResult) results.push({ ...currentResult, name: "currentPredictor (jonli kod, tekshirish uchun)" });

  for (const v of variants) {
    const predictor = makeTunablePredictor(v.name, v.tunables);
    const result = runVariant(byUser, predictor);
    if (result) results.push(result);
  }

  if (results.length === 0) {
    console.log(
      `\nHech qanday foydalanuvchida kamida ${MIN_CYCLES_FOR_BACKTEST} ta aniqlangan sikl boshlanishi topilmadi — ` +
        "backtest o'tkazish uchun HALI YETARLI real tarix yo'q. Hech qanday parametr o'zgartirilmadi " +
        "(taxminga asoslangan qaror qabul qilmaslik uchun — bu skriptning o'zi qoldirildi, kelajakda " +
        "yetarli tarix to'planganda qayta ishga tushirish uchun: " +
        "`MIN_CYCLES_FOR_BACKTEST=2 node --import tsx scripts/backtest-real-users.ts`)."
    );
    process.exit(0);
    return;
  }

  console.log("\n=== Natijalar (shaxsiy ma'lumotsiz, faqat agregat) ===\n");
  console.table(
    results.map((r) => ({
      variant: r.name,
      users: r.usersEvaluated,
      cycles: r.cyclesEvaluated,
      pooledAvgErrorDays: r.pooledAvgErrorDays,
      meanOfUserAvgErrorDays: r.meanOfUserAvgErrorDays,
      within2DaysPct: r.within2DaysPct,
    }))
  );

  const best = [...results].sort((a, b) => a.pooledAvgErrorDays - b.pooledAvgErrorDays)[0];
  console.log(`\nEng past pooledAvgErrorDays: "${best.name}" (${best.pooledAvgErrorDays} kun).`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Backtest skripti muvaffaqiyatsiz bo'ldi:", err);
  process.exit(1);
});
