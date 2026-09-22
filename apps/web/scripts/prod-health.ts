/**
 * Faqat O'QIYDIGAN diagnostika: production'da haqiqatan nima bo'layotganini
 * ko'rsatadi. Hech narsa yozmaydi/o'chirmaydi (barcha so'rovlar SELECT).
 *
 * Ishlatish:  npm run health --workspace=apps/web
 *
 * Nega kerak: `onboarding-funnel.ts` voronkasi 100%dan oshgan konversiya
 * ko'rsatadi (Telegram oqimi `welcome` qadamini KO'RMAYDI, ya'ni bazaviy
 * son noto'g'ri tanlanadi). Bu skript esa taxminsiz, jadvallardagi HAQIQIY
 * sonlarni sanaydi.
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false, ssl: "require" });

function bar(n: number, total: number, width = 28): string {
  if (total <= 0) return "";
  const filled = Math.round((n / total) * width);
  return "█".repeat(filled) + "░".repeat(Math.max(0, width - filled));
}

async function main() {
  const [{ total, yesterday, today, week }] = await sql<
    { total: number; yesterday: number; today: number; week: number }[]
  >`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE created_at::timestamptz::date = CURRENT_DATE - 1)::int AS yesterday,
      COUNT(*) FILTER (WHERE created_at::timestamptz::date = CURRENT_DATE)::int AS today,
      COUNT(*) FILTER (WHERE created_at::timestamptz > NOW() - INTERVAL '7 days')::int AS week
    FROM users
  `;

  console.log("\n=== FOYDALANUVCHILAR ===");
  console.log(`  Jami:            ${total}`);
  console.log(`  Bugun:           ${today}`);
  console.log(`  Kecha:           ${yesterday}`);
  console.log(`  Oxirgi 7 kun:    ${week}`);

  // Voronka — jadvallardagi haqiqiy holat bo'yicha (analytics emas).
  const [funnel] = await sql<
    {
      registered: number;
      onboarded: number;
      has_settings: number;
      has_last_period: number;
      has_any_log: number;
      has_flow_log: number;
      telegram: number;
      notif_on: number;
    }[]
  >`
    SELECT
      (SELECT COUNT(*) FROM users)::int AS registered,
      (SELECT COUNT(*) FROM onboarding_profiles)::int AS onboarded,
      (SELECT COUNT(*) FROM cycle_settings)::int AS has_settings,
      (SELECT COUNT(*) FROM cycle_settings WHERE last_period_start IS NOT NULL)::int AS has_last_period,
      (SELECT COUNT(DISTINCT user_id) FROM cycle_logs)::int AS has_any_log,
      (SELECT COUNT(DISTINCT user_id) FROM cycle_logs WHERE flow IS NOT NULL)::int AS has_flow_log,
      (SELECT COUNT(*) FROM users WHERE telegram_user_id IS NOT NULL)::int AS telegram,
      (SELECT COUNT(*) FROM users WHERE notifications_enabled)::int AS notif_on
  `;

  console.log("\n=== VORONKA (jadvallardagi haqiqiy holat) ===");
  const steps: [string, number][] = [
    ["Ro'yxatdan o'tdi", funnel.registered],
    ["Onboarding'ni tugatdi", funnel.onboarded],
    ["Sikl sozlamasi bor", funnel.has_settings],
    ["Oxirgi hayz sanasi bor", funnel.has_last_period],
    ["Hech bo'lmasa 1 qayd", funnel.has_any_log],
    ["Hayz qaydi bor (flow)", funnel.has_flow_log],
  ];
  for (const [label, n] of steps) {
    const pct = funnel.registered ? Math.round((n / funnel.registered) * 100) : 0;
    console.log(`  ${label.padEnd(24)} ${String(n).padStart(4)}  ${String(pct).padStart(3)}%  ${bar(n, funnel.registered)}`);
  }

  console.log("\n=== BILDIRISHNOMA IMKONIYATI ===");
  console.log(`  Telegram orqali kirgan:   ${funnel.telegram}  (push yuborish MUMKIN)`);
  console.log(`  Bildirishnoma yoqilgan:   ${funnel.notif_on}`);

  // ENG MUHIM: "Hayz N kun" xatosining qurboni bo'ladigan foydalanuvchilar —
  // onboarding'da sana bergan, lekin hech qachon hayz QAYD ETMAGAN.
  const [{ ghost_period }] = await sql<{ ghost_period: number }[]>`
    SELECT COUNT(*)::int AS ghost_period
    FROM cycle_settings cs
    WHERE cs.last_period_start IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM cycle_logs cl WHERE cl.user_id = cs.user_id AND cl.flow IS NOT NULL
      )
  `;
  console.log("\n=== 'HAYZ N-KUN' XATOSI ===");
  console.log(`  Onboarding sanasi bor, lekin hayz qaydi YO'Q: ${ghost_period}`);
  console.log(`  (bu foydalanuvchilarda bosh sahifa faqat onboarding javobiga`);
  console.log(`   tayanib "hayz ketmoqda" yoki bashorat ko'rsatadi)`);

  // Cron ishlayaptimi — bildirishnomalar yaratilganmi?
  const notif = await sql<{ type: string; n: number; last_at: string }[]>`
    SELECT type, COUNT(*)::int AS n, MAX(created_at::timestamptz)::text AS last_at
    FROM notifications GROUP BY type ORDER BY n DESC LIMIT 10
  `;
  console.log("\n=== BILDIRISHNOMALAR (cron ishlayaptimi?) ===");
  if (notif.length === 0) console.log("  HECH QANDAY bildirishnoma yo'q — kunlik cron hech qachon ishlamagan ko'rinadi");
  else for (const r of notif) console.log(`  ${r.type.padEnd(22)} ${String(r.n).padStart(5)}   oxirgi: ${r.last_at}`);

  // Onboarding qaysi qadamda to'xtaydi — analytics'dan, LEKIN oqim bo'yicha
  // ajratilgan (Telegram oqimi `welcome`ni ko'rmaydi).
  // Onboarding qaysi qadamda to'xtaydi. `analytics_events`da qadam nomi
  // `label` ustunida (`type` = hodisa turi) — 30 kunlik oyna.
  const kinds = await sql<{ type: string; n: number }[]>`
    SELECT type, COUNT(*)::int AS n
    FROM analytics_events
    WHERE created_at::timestamptz > NOW() - INTERVAL '30 days'
    GROUP BY type ORDER BY n DESC LIMIT 12
  `;
  console.log("\n=== ANALYTICS HODISA TURLARI (30 kun) ===");
  for (const r of kinds) console.log(`  ${r.type.padEnd(28)} ${String(r.n).padStart(6)}`);

  const stuck = await sql<{ step: string; n: number }[]>`
    WITH last_step AS (
      SELECT DISTINCT ON (session_id) session_id, label
      FROM analytics_events
      WHERE type = 'click'
        AND label LIKE 'onboarding_step:%'
        AND created_at::timestamptz > NOW() - INTERVAL '30 days'
      ORDER BY session_id, created_at DESC
    )
    SELECT substring(label from 'onboarding_step:(.*)') AS step, COUNT(*)::int AS n
    FROM last_step
    -- Tugatgan seanslar chiqarib tashlanadi: onboarding'ning OXIRGI qadami
    -- "analyzing" (backtick ISHLATMANG: bu JS shablon satri ichida).
    WHERE session_id NOT IN (
      SELECT session_id FROM analytics_events
      WHERE type = 'click' AND label = 'onboarding_step:analyzing'
    )
    GROUP BY label ORDER BY n DESC LIMIT 15
  `;
  console.log("\n=== TUGATMAGANLAR OXIRGI MARTA QAYSI QADAMDA TO'XTAGAN (30 kun) ===");
  if (stuck.length === 0) console.log("  (ma'lumot yo'q)");
  else for (const r of stuck) console.log(`  ${r.step.padEnd(24)} ${String(r.n).padStart(4)}`);

  await sql.end();
}

main().catch(async (error) => {
  console.error(error);
  await sql.end();
  process.exit(1);
});
