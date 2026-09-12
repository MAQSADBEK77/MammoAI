// QA-001 — sikl API'si uchun integratsiya testlari (faqat sof funksiyalar emas).
// packages/shared'dagi 114 ta unit test cycle.ts'ning MATEMATIKASINI to'liq
// qamraydi, lekin CYCLE-001 aynan bu qatlamda — repo.ts'ning bazaga YOZISH
// mantig'ida — yashiringan edi, u yerda hech qanday avtomatik test yo'q edi.
// Bu skript ALOHIDA, bir martalik bazaga qarshi emas — CI'da har push'da
// GitHub Actions'ning vaqtinchalik `postgres:16` xizmat konteynerига qarshi
// ishga tushadi (.github/workflows/ci.yml), shuning uchun productionga
// HECH QANDAY ta'sir qilmaydi va real foydalanuvchi ma'lumotlariga tegmaydi.
//
// Ishga tushirish: DATABASE_URL=... node --import tsx scripts/integration-test.ts

import { randomUUID } from "node:crypto";
import { sql, ensureSchema } from "../src/server/db";
import { getCycleSettings, upsertCycleLog, deleteCycleLog, listCycleLogs, updateCycleSettings } from "../src/server/repo";
import { buildCycleResponse } from "../src/server/views";

let failures = 0;
let checks = 0;

function assert(condition: unknown, message: string): void {
  checks++;
  if (!condition) {
    failures++;
    console.error(`✗ FAIL: ${message}`);
  } else {
    console.log(`✓ ${message}`);
  }
}

async function main() {
  await ensureSchema();
  const userId = randomUUID();
  await sql`INSERT INTO users (id, phone, created_at) VALUES (${userId}, ${"+9989" + Math.floor(Math.random() * 1e8)}, now()::text)`;

  try {
    // --- 1. Boshlang'ich holat: hech narsa qayd etilmagan ---
    const initialSettings = await getCycleSettings(userId);
    assert(initialSettings.lastPeriodStart === null, "boshlang'ich lastPeriodStart null");

    const initialResponse = await buildCycleResponse(userId);
    assert(initialResponse.prediction === null, "oxirgi hayz sanasi yo'qligida bashorat null (fabrikatsiya qilinmaydi)");

    // --- 2. Birinchi hayzning 1-kuni qayd etiladi ---
    await upsertCycleLog(userId, { date: "2026-01-01", flow: "heavy", mood: null, symptoms: [] });
    let settings = await getCycleSettings(userId);
    assert(settings.lastPeriodStart === "2026-01-01", "1-kun qayd etilgach lastPeriodStart = 2026-01-01");

    let response = await buildCycleResponse(userId, "2026-01-05");
    assert(response.prediction !== null, "1 kunlik tarixda ham bashorat mavjud (standart qiymatga tayanib)");
    assert(response.prediction!.cyclesAnalyzed === 0, "hali 2 tadan kam sikl aniqlangan — cyclesAnalyzed 0 (taxminiy)");
    assert(response.prediction!.confidence === "insufficient", "shuning uchun ishonch darajasi 'insufficient'");

    // --- 3. CYCLE-001 REGRESSION: hayzning 2-, 3-kuni qayd etiladi ---
    // Bu aynan bugun tuzatilgan bug: 2-, 3-kunni qayd etish lastPeriodStart'ni
    // "bugun"ga surib yubormasligi kerak — bir xil hayz davom etmoqda.
    await upsertCycleLog(userId, { date: "2026-01-02", flow: "medium", mood: "tired", symptoms: ["cramps"] });
    settings = await getCycleSettings(userId);
    assert(settings.lastPeriodStart === "2026-01-01", "CYCLE-001: 2-kunni qayd etish boshlanish sanasini SURMAYDI");

    await upsertCycleLog(userId, { date: "2026-01-03", flow: "light", mood: null, symptoms: [] });
    settings = await getCycleSettings(userId);
    assert(settings.lastPeriodStart === "2026-01-01", "CYCLE-001: 3-kunni qayd etish ham boshlanish sanasini SURMAYDI");

    // --- 4. Haqiqiy YANGI hayz — real bo'shliqdan keyin (2026-01-29, 28 kun keyin) ---
    await upsertCycleLog(userId, { date: "2026-01-29", flow: "medium", mood: null, symptoms: [] });
    settings = await getCycleSettings(userId);
    assert(settings.lastPeriodStart === "2026-01-29", "haqiqiy yangi hayz (28 kunlik bo'shliqdan keyin) boshlanishni to'g'ri yangilaydi");

    response = await buildCycleResponse(userId, "2026-01-30");
    assert(response.prediction!.cyclesAnalyzed >= 1, "endi kamida 1 ta sikl uzunligi aniqlangan (2 ta boshlanish)");
    assert(response.prediction!.confidence === "low", "1-2 sikl bilan ishonch darajasi 'low'");

    // --- 5. Tahrirlash: mavjud kunga faqat kayfiyat qo'shish oqimni o'zgartirmaydi ---
    await upsertCycleLog(userId, { date: "2026-01-29", flow: "medium", mood: "calm", symptoms: [] });
    settings = await getCycleSettings(userId);
    assert(settings.lastPeriodStart === "2026-01-29", "faqat kayfiyatni tahrirlash boshlanish sanasini o'zgartirmaydi");

    // --- 6. Oqimni bekor qilish (flow'ni null qilish) — CYCLE-002 tuzatishi ---
    // Ikkinchi hayzning yagona kuni "bekor qilinsa", faqat birinchi hayz qoladi
    // — lastPeriodStart 2026-01-01'ga QAYTISHI kerak.
    await upsertCycleLog(userId, { date: "2026-01-29", flow: null, mood: "calm", symptoms: [] });
    settings = await getCycleSettings(userId);
    assert(settings.lastPeriodStart === "2026-01-01", "CYCLE-002: oqimni bekor qilish boshlanishni to'g'ri qayta hisoblaydi");

    // --- 7. O'chirish: kunni butunlay o'chirish ---
    await upsertCycleLog(userId, { date: "2026-01-29", flow: "medium", mood: null, symptoms: [] }); // qayta tiklaymiz
    await deleteCycleLog(userId, "2026-01-29");
    const logsAfterDelete = await listCycleLogs(userId);
    assert(!logsAfterDelete.some((l) => l.date === "2026-01-29"), "o'chirilgan kun ro'yxatda endi yo'q");
    settings = await getCycleSettings(userId);
    assert(settings.lastPeriodStart === "2026-01-01", "o'chirishdan keyin ham boshlanish to'g'ri qayta hisoblanadi");

    // --- 8. Sikl uzunligini o'zgartirish ---
    await updateCycleSettings(userId, { averageCycleLength: 35 });
    settings = await getCycleSettings(userId);
    assert(settings.averageCycleLength === 35, "sikl uzunligi sozlamasi saqlanadi");
    response = await buildCycleResponse(userId, "2026-01-10");
    assert(response.prediction!.nextPeriodStart === "2026-02-05", "yangi sikl uzunligi bashoratga darhol ta'sir qiladi (2026-01-01 + 35)");
  } finally {
    await sql`DELETE FROM users WHERE id = ${userId}`;
  }

  console.log(`\n${checks - failures}/${checks} tekshiruv o'tdi.`);
  if (failures > 0) {
    console.error(`${failures} ta tekshiruv MUVAFFAQIYATSIZ.`);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error("Integratsiya testi kutilmagan xatolik bilan to'xtadi:", error);
  process.exit(1);
});
