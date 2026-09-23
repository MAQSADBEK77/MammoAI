// CAMPAIGN-02 — rejimga moslashtirilgan xabar yuborish (deep-link tugma bilan).
//
// Nega alohida skript: mavjud "broadcast" bitta matnni HAMMAGA, tugmasiz
// yuboradi. Bizga kerak bo'lgani boshqacha — ayol qaysi maqsad bilan
// kelganiga qarab boshqa matn, va har birida to'g'ridan-to'g'ri kerakli
// ekranni ochadigan tugma.
//
// STANDART HOLDA HECH NARSA YUBORMAYDI. Ko'rish uchun:
//   npx tsx apps/web/scripts/send-campaign.ts
// Haqiqatan yuborish uchun ANIQ bayroq kerak:
//   npx tsx apps/web/scripts/send-campaign.ts --send
//
// Natija `?c=<kampaniya>` orqali o'lchanadi (CAMPAIGN-01): tugma bosilgani
// analitikaga `campaign:<id>` yorlig'i bilan yoziladi.

import { sql, ensureSchema } from "../src/server/db";
import { sendTelegramMessage, miniAppInlineKeyboard } from "../src/server/telegram-bot";

const CAMPAIGN = process.env.CAMPAIGN_ID ?? "c1";
const BASE = "https://mammo.uz";
const SEND = process.argv.includes("--send");

/** Telegram cheklovlari: sekundiga ~30 xabar. Ehtiyot uchun sekinroq. */
const DELAY_MS = 120;

interface Segment {
  key: string;
  goals: string[] | null; // null = onboardingni tugatmaganlar
  text: string;
  button: string;
  next: string;
}

const SEGMENTS: Segment[] = [
  {
    key: "unfinished",
    goals: null,
    text:
      "Siz MammoAI'ni ochgan edingiz, lekin sozlashni tugatmabsiz.\n\n" +
      "Bu bor-yo'g'i ikki daqiqa. Tugatsangiz — hayzingiz qachon boshlanishini oldindan aytib beramiz " +
      "va qaysi tekshiruvlar aynan sizga kerakligini ko'rsatamiz.\n\n" +
      "Sog'ligingiz haqida o'ylash uchun kech emas.",
    button: "Tugatish",
    next: "/onboarding",
  },
  {
    key: "cycle",
    goals: ["cycle", "wellbeing", "skin", "understand_body", "planning_pregnancy"],
    text:
      "Bugun o'zingizni qanday his qilyapsiz?\n\n" +
      "Bir daqiqa ajratib belgilab qo'ying — kayfiyat, og'riq yoki oqim. " +
      "Har bir belgilash bashoratni aniqroq qiladi, ya'ni ertaga tanangiz nima qilishini yaxshiroq bilasiz.\n\n" +
      "Kichik odat, katta farq.",
    button: "Belgilash",
    next: `/asosiy?log=1&c=${CAMPAIGN}`,
  },
  {
    key: "pregnancy",
    goals: ["pregnancy"],
    text:
      "Homiladorlik davrida o'zingizni qanday his qilayotganingiz muhim.\n\n" +
      "Bugungi holatingizni belgilab qo'ying — keyinchalik shifokorga aytish oson bo'ladi.",
    button: "Belgilash",
    next: `/asosiy?log=1&c=${CAMPAIGN}`,
  },
  {
    key: "checkups",
    goals: ["checkups"],
    text:
      "Tekshiruvlar ro'yxatingiz sizni kutyapti.\n\n" +
      "Qaysi biri muddati kelganini ko'ring — va qayerda qilish mumkinligini toping. " +
      "Erta aniqlangan narsa oson davolanadi.",
    button: "Ro'yxatni ochish",
    next: `/tekshiruvlar?c=${CAMPAIGN}`,
  },
];

async function main() {
  await ensureSchema();

  console.log(SEND ? "HAQIQIY YUBORISH\n" : "QURUQ KO'RISH — hech narsa yuborilmaydi (--send bilan yuboriladi)\n");
  console.log(`Kampaniya: ${CAMPAIGN}\n`);

  let grandTotal = 0;
  let sentTotal = 0;
  let failedTotal = 0;

  for (const seg of SEGMENTS) {
    const rows = (await (seg.goals === null
      ? sql`
          SELECT u.id, u.telegram_user_id AS tg FROM users u
          LEFT JOIN onboarding_profiles o ON o.user_id = u.id
          WHERE u.telegram_user_id IS NOT NULL AND u.is_test_account = FALSE AND u.is_blocked = FALSE
            AND o.user_id IS NULL
        `
      : sql`
          SELECT u.id, u.telegram_user_id AS tg FROM users u
          JOIN onboarding_profiles o ON o.user_id = u.id
          WHERE u.telegram_user_id IS NOT NULL AND u.is_test_account = FALSE AND u.is_blocked = FALSE
            AND o.primary_goal = ANY(${seg.goals})
        `)) as unknown as { id: string; tg: string }[];

    grandTotal += rows.length;
    console.log(`── ${seg.key} — ${rows.length} kishi`);
    console.log(`   tugma: [${seg.button}] → ${seg.next}`);
    console.log(`   ${seg.text.replace(/\n/g, "\n   ")}\n`);

    if (!SEND || rows.length === 0) continue;

    const url = `${BASE}/tg?next=${encodeURIComponent(seg.next)}`;
    for (const r of rows) {
      try {
        await sendTelegramMessage(r.tg, seg.text, miniAppInlineKeyboard(seg.button, url));
        sentTotal++;
      } catch (error) {
        failedTotal++;
        console.error(`   ✗ ${r.id.slice(0, 8)}: ${error instanceof Error ? error.message : String(error)}`);
      }
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
    console.log(`   yuborildi: ${sentTotal}, xato: ${failedTotal}\n`);
  }

  console.log(`\nJAMI qabul qiluvchi: ${grandTotal}`);
  if (SEND) console.log(`Yuborildi: ${sentTotal} | Xato: ${failedTotal}`);
  else console.log("Yuborilmadi (quruq ko'rish).");
  process.exit(0);
}

main().catch((error) => {
  console.error("Kampaniya xatolik bilan to'xtadi:", error);
  process.exit(1);
});
