// Onboarding voronkasi — FAQAT O'QIYDI, hech narsani o'zgartirmaydi.
//
// Nima uchun alohida skript: admin paneldagi Traction sahifasi shu ma'lumotni
// allaqachon ko'rsatadi, lekin u faqat "tugatmaganlarning oxirgi qadami"ni
// beradi. Bu skript qo'shimcha ikkita narsani chiqaradi:
//   • har bir qadamga YETIB KELGANLAR soni (to'liq voronka);
//   • qadamdan qadamga o'tishda qancha foiz yo'qolgani.
// Shu ikkalasi birgalikda "qayerda qotib qolishgan" degan savolga aniq javob
// beradi.
//
// Ishlatish (apps/web ichidan):
//   npm run funnel
//   npm run funnel -- 90        (oxirgi 90 kun; standart 30)

import { sql } from "../src/server/db";

/** Onboarding qadamlari — onboarding/page.tsx dagi `Step` turi bilan AYNAN
 * bir xil tartibda. Tartib muhim: voronka shu ketma-ketlik bo'yicha o'qiladi. */
const STEPS = [
  "welcome",
  "language",
  "account_choice",
  "account_identifier",
  "phone_verify",
  "privacy",
  "name",
  "age",
  "goal",
  "cycle_regularity",
  "cycle_lengths",
  "last_period",
  "preview",
  "typical_symptoms",
  "period_attitude",
  "health_conditions",
  "family_history",
  "sexually_active",
  "last_checkup",
  "height_weight",
  "notifications",
  "analyzing",
] as const;

async function main() {
  const days = Number(process.argv[2]) || 30;
  const interval = `${Math.min(Math.max(days, 1), 365)} days`;

  // 1) Har bir qadamga yetib kelgan UNIKAL seanslar soni.
  const reached = (await sql`
    SELECT substring(label from 'onboarding_step:(.*)') AS step,
           count(DISTINCT session_id)::int AS sessions
    FROM analytics_events
    WHERE type = 'click'
      AND label LIKE 'onboarding_step:%'
      AND (created_at)::timestamptz >= now() - ${interval}::interval
    GROUP BY step
  `) as unknown as { step: string; sessions: number }[];

  // 2) Tugatmaganlarning OXIRGI qadami (admin paneldagi bilan bir xil mantiq).
  const stuck = (await sql`
    WITH ranked AS (
      SELECT e.session_id,
             substring(e.label from 'onboarding_step:(.*)') AS step,
             row_number() OVER (PARTITION BY e.session_id ORDER BY e.created_at DESC) AS rn
      FROM analytics_events e
      LEFT JOIN onboarding_profiles o ON o.user_id = e.user_id
      WHERE e.type = 'click'
        AND e.label LIKE 'onboarding_step:%'
        AND o.user_id IS NULL
        AND (e.created_at)::timestamptz >= now() - ${interval}::interval
    )
    SELECT step, count(*)::int AS count FROM ranked WHERE rn = 1 GROUP BY step
  `) as unknown as { step: string; count: number }[];

  const reachedMap = new Map(reached.map((r) => [r.step, r.sessions]));
  const stuckMap = new Map(stuck.map((r) => [r.step, r.count]));
  // MUHIM: Telegram Mini App orqali kelgan foydalanuvchida `welcome`,
  // `account_choice`, `account_identifier`, `phone_verify` qadamlari YO'Q
  // (onboarding/page.tsx ularni filtrlaydi). Shuning uchun voronka bazasi
  // "welcome" bo'lsa, Telegram oqimida u 0 bo'lib, skript "ma'lumot yo'q"
  // deb chiqib ketardi. Endi baza — ro'yxatdagi BIRINCHI mavjud qadam.
  const firstStep = STEPS.find((st) => (reachedMap.get(st) ?? 0) > 0);
  const total = firstStep ? (reachedMap.get(firstStep) ?? 0) : 0;

  console.log(`\nONBOARDING VORONKASI — oxirgi ${days} kun\n`);
  if (total === 0) {
    console.log("Ma'lumot yo'q. Sabablari:");
    console.log("  • `onboarding_step:*` hodisasi yaqinda qo'shilgan — tarixiy ma'lumot yo'q;");
    console.log("  • yoki shu davrda hech kim onboarding'ni boshlamagan.");
    await sql.end();
    return;
  }

  console.log("qadam".padEnd(22) + "yetdi".padStart(7) + "  konv.".padStart(8) + "  yo'qotish".padStart(11) + "  qotib qoldi".padStart(13));
  console.log("-".repeat(64));

  let prev = total;
  for (const step of STEPS) {
    const n = reachedMap.get(step) ?? 0;
    if (n === 0 && prev === 0) continue;
    const conv = total ? ((n / total) * 100).toFixed(0) + "%" : "—";
    const drop = prev > 0 ? (((prev - n) / prev) * 100).toFixed(0) + "%" : "—";
    const st = stuckMap.get(step) ?? 0;
    // Qadamdan qadamga 20%+ yo'qotish — diqqat talab qiladigan joy.
    const flag = prev > 0 && (prev - n) / prev >= 0.2 ? "  ← DIQQAT" : "";
    console.log(
      step.padEnd(22) + String(n).padStart(7) + conv.padStart(8) + drop.padStart(11) + String(st).padStart(13) + flag
    );
    if (n > 0) prev = n;
  }

  // --- A/B: `onboarding_preview` tajribasi (AB-01) ------------------------
  // Har bir variant bo'yicha: nechta seans boshlagan va nechtasi oxirgi
  // qadamga yetgan. Tugatish foizi — tajribaning asosiy ko'rsatkichi.
  const ab = (await sql`
    WITH assigned AS (
      SELECT DISTINCT session_id,
             substring(label from 'ab:onboarding_preview=(.*)') AS variant
      FROM analytics_events
      WHERE type = 'click'
        AND label LIKE 'ab:onboarding_preview=%'
        AND (created_at)::timestamptz >= now() - ${interval}::interval
    ),
    started AS (
      SELECT DISTINCT session_id FROM analytics_events
      WHERE type = 'click' AND label = 'onboarding_step:language'
        AND (created_at)::timestamptz >= now() - ${interval}::interval
    ),
    completed AS (
      SELECT DISTINCT session_id FROM analytics_events
      WHERE type = 'click' AND label = 'onboarding_step:analyzing'
        AND (created_at)::timestamptz >= now() - ${interval}::interval
    )
    SELECT a.variant,
           count(DISTINCT s.session_id)::int AS started,
           count(DISTINCT c.session_id)::int AS completed
    FROM assigned a
    LEFT JOIN started s ON s.session_id = a.session_id
    LEFT JOIN completed c ON c.session_id = a.session_id
    GROUP BY a.variant ORDER BY a.variant
  `) as unknown as { variant: string; started: number; completed: number }[];

  if (ab.length > 0) {
    console.log("\nA/B — onboarding_preview (so'rovnoma o'rtasidagi bashorat)\n");
    console.log("variant".padEnd(10) + "boshladi".padStart(10) + "tugatdi".padStart(10) + "  tugatish".padStart(11));
    console.log("-".repeat(42));
    for (const r of ab) {
      const rate = r.started ? ((r.completed / r.started) * 100).toFixed(1) + "%" : "—";
      const label = r.variant === "on" ? "on (yangi)" : r.variant === "off" ? "off (eski)" : r.variant;
      console.log(label.padEnd(10) + String(r.started).padStart(10) + String(r.completed).padStart(10) + rate.padStart(11));
    }
    const min = Math.min(...ab.map((r) => r.started));
    if (min < 100) {
      console.log(`\n⚠️  Eng kichik guruhda ${min} ta seans — xulosa chiqarish uchun KAM.`);
      console.log("   Har bir variantda kamida ~100 seans to'planishini kuting, aks holda");
      console.log("   farq tasodifiy bo'lishi mumkin.");
    }
  }

  const finished = reachedMap.get("analyzing") ?? 0;
  console.log("-".repeat(64));
  console.log(`\nBoshladi: ${total} · Oxirgi qadamga yetdi: ${finished} · Umumiy konversiya: ${total ? ((finished / total) * 100).toFixed(1) : 0}%`);
  console.log("\n'qotib qoldi' = onboarding'ni TUGATMAGAN seanslarning oxirgi qadami.\n");

  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
