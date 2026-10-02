import { lastFlowStreakStart, daysBetween, deriveAdaptiveCycleSettings, predictCycle, tashkentDateStr } from "@mammoai/shared";
import { ensureSchema, sql } from "../src/server/db";
import { getCycleSettings, listCycleLogs } from "../src/server/repo";

async function main() {
  await ensureSchema();
  const today = tashkentDateStr();
  // Ekrandagi holatga mos nomzodlar: 29-sentabrda qayd qilganlar
  const rows = (await sql`
    SELECT DISTINCT u.id, u.theme, (u.avatar_url IS NOT NULL) AS avatari_bor, o.primary_goal
    FROM users u
    JOIN cycle_logs c ON c.user_id = u.id AND c.date = '2026-09-29' AND c.flow IS NOT NULL
    LEFT JOIN onboarding_profiles o ON o.user_id = u.id
    WHERE u.is_test_account IS NOT TRUE
  `) as unknown as { id: string; theme: string; avatari_bor: boolean; primary_goal: string | null }[];

  console.log(`bugun: ${today}  |  29-sentabrda qayd qilganlar: ${rows.length}\n`);
  for (const r of rows) {
    const [settings, logs] = await Promise.all([getCycleSettings(r.id), listCycleLogs(r.id, 365)]);
    if (!settings) { console.log(`${r.id.slice(0,8)}  sozlama yo'q`); continue; }
    const adaptive = deriveAdaptiveCycleSettings(logs, settings);
    const prediction = adaptive ? predictCycle(adaptive) : null;
    const lastStart = lastFlowStreakStart(logs);
    const expected = prediction?.averagePeriodLength ?? settings.averagePeriodLength ?? 5;
    const dayIndex = lastStart ? daysBetween(lastStart, today) + 1 : null;
    const loggedToday = logs.some((l) => l.date === today && !!l.flow);
    const show = dayIndex !== null && dayIndex >= 2 && dayIndex <= expected + 2 && !loggedToday;
    const recent = [...logs].filter((l) => l.flow).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4).map((l)=>`${l.date}=${l.flow}`).join(" ");
    console.log(
      `${r.id.slice(0,8)}  KARTA=${show ? "CHIQADI" : "CHIQMAYDI"}\n` +
      `   rejim=${r.primary_goal}  mavzu=${r.theme}  avatar=${r.avatari_bor}\n` +
      `   seriya boshlanishi=${lastStart}  bugun nechanchi kun=${dayIndex}  kutilgan davomiylik=${expected}  (oyna: 2..${expected + 2})\n` +
      `   bugun belgilanganmi=${loggedToday}\n` +
      `   oxirgi qaydlar: ${recent}`
    );
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
