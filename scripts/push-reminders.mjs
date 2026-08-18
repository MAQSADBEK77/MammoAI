// Standalone process (run under pm2, see README) — the browser-notification
// equivalent of the Telegram bot's reminder loop, for people who never
// linked Telegram but did enable "Browser notifications" in their profile.
// Same two cadences as the bot: a retest nudge and a monthly self-exam nudge.

import Database from "better-sqlite3";
import path from "node:path";
import webpush from "web-push";

const DB_PATH = path.join(process.cwd(), "data", "mammoai.db");
const DEFAULT_RETEST_DAYS = 90;
const DEFAULT_SELF_EXAM_DAYS = 30;
const RETEST_COOLDOWN_DAYS = 30;
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

function getSetting(key) {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row?.value ?? null;
}

function ensureVapidKeys() {
  let publicKey = getSetting("vapid_public_key");
  let privateKey = getSetting("vapid_private_key");
  if (!publicKey || !privateKey) {
    // The Next.js app (server/push.ts) generates these on first use of any
    // push feature — if neither exists yet, nobody has enabled push
    // notifications yet, so there's nothing to send.
    return null;
  }
  webpush.setVapidDetails("mailto:admin@mammoai.uz", publicKey, privateKey);
  return { publicKey, privateKey };
}

async function sendPush(sub, payload) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
    return true;
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      db.prepare("DELETE FROM push_subscriptions WHERE id = ?").run(sub.id);
      return false;
    }
    console.error("push send error:", err.message);
    return true;
  }
}

async function checkReminders() {
  if (!ensureVapidKeys()) return;

  const retestDays = Number(getSetting("retest_days")) || DEFAULT_RETEST_DAYS;
  const selfExamDays = Number(getSetting("self_exam_days")) || DEFAULT_SELF_EXAM_DAYS;
  const now = Date.now();
  const retestCutoff = new Date(now - retestDays * 24 * 60 * 60 * 1000).toISOString();
  const retestCooldownCutoff = new Date(now - RETEST_COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const selfExamCutoff = new Date(now - selfExamDays * 24 * 60 * 60 * 1000).toISOString();

  const rows = db
    .prepare(
      `SELECT s.id, s.endpoint, s.p256dh, s.auth, s.last_reminder_sent_at, s.last_self_exam_sent_at,
        u.id AS user_id, u.created_at AS user_created_at,
        (SELECT created_at FROM quiz_attempts a WHERE a.user_id = u.id ORDER BY a.created_at DESC LIMIT 1) AS latest_at
       FROM push_subscriptions s JOIN users u ON u.id = s.user_id`
    )
    .all();

  let retestSent = 0;
  let selfExamSent = 0;

  for (const row of rows) {
    const retestDue =
      row.latest_at &&
      row.latest_at < retestCutoff &&
      (row.last_reminder_sent_at === null || row.last_reminder_sent_at < retestCooldownCutoff);
    if (retestDue) {
      const ok = await sendPush(row, {
        title: "MammoAI",
        body: `Oxirgi testingizdan ${retestDays} kundan ko'proq vaqt o'tdi. Qayta topshirish tavsiya etiladi.`,
        url: "/test",
      });
      if (ok) {
        db.prepare("UPDATE push_subscriptions SET last_reminder_sent_at = ? WHERE id = ?").run(
          new Date().toISOString(),
          row.id
        );
        retestSent += 1;
      }
    }

    const selfExamBaseline = row.last_self_exam_sent_at ?? row.user_created_at;
    if (selfExamBaseline && selfExamBaseline < selfExamCutoff) {
      const ok = await sendPush(row, {
        title: "MammoAI",
        body: "Oylik eslatma: o'z-o'zini ko'krak tekshiruvini unutmang.",
        url: "/qollanma",
      });
      if (ok) {
        db.prepare("UPDATE push_subscriptions SET last_self_exam_sent_at = ? WHERE id = ?").run(
          new Date().toISOString(),
          row.id
        );
        selfExamSent += 1;
      }
    }
  }

  if (retestSent || selfExamSent) {
    console.log(`[${new Date().toISOString()}] push reminders sent — retest: ${retestSent}, self-exam: ${selfExamSent}`);
  }
}

async function main() {
  console.log("MammoAI push-reminders process starting.");
  for (;;) {
    await checkReminders().catch((err) => console.error("push reminder check error:", err.message));
    await new Promise((r) => setTimeout(r, CHECK_INTERVAL_MS));
  }
}

main();
