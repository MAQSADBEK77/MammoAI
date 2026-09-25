// MODE-CONSOLIDATE-01 — rejimlarni to'rttaga qisqartirish.
//
// Nega kerak: loyiha egasining qaroriga ko'ra ilovada faqat to'rtta rejim
// qoladi — hayz nazorati, homiladorlik, homiladorlikka tayyorgarlik va
// hamkorni kuzatish. Qolganlari onboardingning eski versiyasida taklif
// qilingan va ayollar ularga tasodifan tushib qolgan.
//
// MUHIM — bu ko'chirish ayollar KO'RADIGAN narsani deyarli o'zgartirmaydi:
// `goalToLandingTab` bo'yicha `wellbeing`, `skin` va `understand_body`
// ALLAQACHON sikl ekraniga tushadi. Ya'ni ular uchun bu sof ma'lumot
// tozalash. Faqat `checkups` rejimidagilar uchun bosh ekran o'zgaradi
// (tekshiruvlar -> sikl), lekin tekshiruvlar bo'limi hammaga menyuda
// qolaveradi.
//
// `perimenopause` ATAYLAB tegilmaydi — u alohida qurilgan rejim
// (bashorat o'rniga simptom kuzatuvi) va uni siklga ko'chirish 40+
// ayolga ma'nosiz bashoratlarni ko'rsatib qo'yardi. Uning taqdiri
// alohida hal qilinadi.
//
// Ishlatish (apps/web ichidan):
//   node --env-file=.env.local --import tsx scripts/migrate-modes.ts
//   node --env-file=.env.local --import tsx scripts/migrate-modes.ts --write

import { sql } from "../src/server/db";

const WRITE = process.argv.includes("--write");

/** Olib tashlanadigan rejimlar va ularning yangi manzili. */
const RETIRED = ["wellbeing", "skin", "understand_body", "checkups"] as const;
const TARGET = "cycle";

async function main() {
  console.log(WRITE ? "YOZISH rejimi\n" : "QURUQ KO'RISH — hech narsa o'zgarmaydi (--write bilan yoziladi)\n");

  const before = (await sql`
    SELECT primary_goal, COUNT(*)::int AS n
    FROM onboarding_profiles
    GROUP BY primary_goal ORDER BY n DESC
  `) as unknown as { primary_goal: string; n: number }[];

  console.log("Hozirgi holat:");
  for (const row of before) {
    const mark = (RETIRED as readonly string[]).includes(row.primary_goal) ? "  -> cycle" : "";
    console.log(`  ${row.primary_goal.padEnd(20)} ${String(row.n).padStart(3)}${mark}`);
  }

  const moving = before
    .filter((r) => (RETIRED as readonly string[]).includes(r.primary_goal))
    .reduce((sum, r) => sum + r.n, 0);
  console.log(`\nKo'chiriladi: ${moving} ta profil -> ${TARGET}`);

  if (!WRITE) {
    process.exit(0);
  }

  const updated = (await sql`
    UPDATE onboarding_profiles
    SET primary_goal = ${TARGET}
    WHERE primary_goal = ANY(${RETIRED as unknown as string[]})
    RETURNING user_id
  `) as unknown as { user_id: string }[];

  console.log(`Ko'chirildi: ${updated.length}`);

  const after = (await sql`
    SELECT primary_goal, COUNT(*)::int AS n
    FROM onboarding_profiles
    GROUP BY primary_goal ORDER BY n DESC
  `) as unknown as { primary_goal: string; n: number }[];
  console.log("\nYangi holat:");
  for (const row of after) console.log(`  ${row.primary_goal.padEnd(20)} ${String(row.n).padStart(3)}`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Ko'chirishda xatolik:", error);
  process.exit(1);
});
