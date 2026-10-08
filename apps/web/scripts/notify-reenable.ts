// NOTIF-REENABLE-01 — bildirishnomasi o'chib qolganlarga BIR MARTALIK xabar.
//
// Nega kerak: productionda 119 ayolning Telegram'i bog'langan, lekin
// bildirishnomasi o'chirilgan. Bu eski NOTIF-01 xatosining izi — rozilik
// brauzer ruxsatiga bog'langan edi va ruxsat yiqilsa, ayol "Yoqish"ni
// bossa ham jimgina o'chirilgan holatda qolardi. Onboarding tuzatildi,
// lekin eski hisoblar o'z holicha qoldi va ilovadagi karta ularga yetib
// bormaydi (ilovani ochmasa — ko'rmaydi).
//
// Xabar HECH NARSANI o'zgartirmaydi: u faqat so'raydi. Yoqish ayolning
// o'z bosishi bilan, /eslatmalar sahifasida sodir bo'ladi.
//
// Ishga tushirish:
//   npm run notify:reenable --workspace=apps/web            (faqat ko'rish)
//   npm run notify:reenable --workspace=apps/web -- --send  (yuborish)

import { dictionaries } from "@mammoai/shared";
import type { Language } from "@mammoai/shared";
import { sql } from "../src/server/db";
import { miniAppInlineKeyboard, sendTelegramMessage } from "../src/server/telegram-bot";

const SEND = process.argv.includes("--send");
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://mammo.uz";
const DEEP_LINK = `${BASE_URL}/tg?next=${encodeURIComponent("/eslatmalar")}`;

/** Har bir yuborish orasidagi pauza — Telegram'ning umumiy chegarasidan
 *  xavfsiz pastda qolish uchun (broadcastTelegramMessage bilan bir xil g'oya). */
const DELAY_MS = 120;

async function main() {
  const rows = (await sql`
    SELECT id, language, telegram_user_id AS chat_id, name
    FROM users
    WHERE is_test_account = FALSE
      AND is_blocked = FALSE
      AND notifications_enabled = FALSE
      AND telegram_user_id IS NOT NULL
    ORDER BY created_at ASC
  `) as unknown as { id: string; language: Language; chat_id: string; name: string | null }[];

  const byLang = new Map<string, number>();
  for (const r of rows) byLang.set(r.language, (byLang.get(r.language) ?? 0) + 1);

  console.log(`Qabul qiluvchilar: ${rows.length}`);
  for (const [lang, n] of byLang) console.log(`  ${lang}: ${n}`);
  console.log("\nXabar namunasi (uz):");
  console.log("  " + dictionaries.uz.enableRemindersPrompt.text);
  console.log("  [tugma] " + dictionaries.uz.enableRemindersPrompt.button);
  console.log("  havola: " + DEEP_LINK);

  if (!SEND) {
    console.log("\nHech narsa yuborilmadi. Yuborish uchun: -- --send");
    process.exit(0);
  }

  let sent = 0;
  const failures: { name: string | null; error: string }[] = [];
  for (const r of rows) {
    const dict = dictionaries[r.language] ?? dictionaries.uz;
    try {
      await sendTelegramMessage(
        r.chat_id,
        dict.enableRemindersPrompt.text,
        miniAppInlineKeyboard(dict.enableRemindersPrompt.button, DEEP_LINK)
      );
      sent++;
    } catch (error) {
      failures.push({ name: r.name, error: error instanceof Error ? error.message : String(error) });
    }
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }

  console.log(`\nYuborildi: ${sent} / ${rows.length}`);
  if (failures.length) {
    console.log(`Yetkazilmadi: ${failures.length}`);
    // Sabablarini guruhlab ko'rsatamiz — "bot bloklangan" eng ko'p uchraydi.
    const byReason = new Map<string, number>();
    for (const f of failures) byReason.set(f.error.slice(0, 60), (byReason.get(f.error.slice(0, 60)) ?? 0) + 1);
    for (const [reason, n] of byReason) console.log(`  ${String(n).padStart(4)}  ${reason}`);
  }
  await sql.end();
  process.exit(0);
}

main().catch((error) => {
  console.error("Xatolik:", error);
  process.exit(1);
});
