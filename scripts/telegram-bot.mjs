// Standalone process (run under pm2, see README) that:
//   1. Long-polls Telegram for messages, linking a user's account when they
//      send /start <token> (the token comes from their profile page's
//      "Connect Telegram" button).
//   2. Periodically checks for users overdue for a retest and DMs them a
//      reminder.
//
// Reads the bot token from the same SQLite database the Next.js app uses
// (set via the admin panel → Settings, not an env var) — so it can pick up
// a token added or changed at runtime without a restart.

import Database from "better-sqlite3";
import path from "node:path";

const DB_PATH = path.join(process.cwd(), "data", "mammoai.db");
const RETEST_DAYS = 90;
const REMINDER_COOLDOWN_DAYS = 30;
const REMINDER_CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly
const SITE_URL = process.env.SITE_URL ?? "";

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

function getSetting(key) {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row?.value ?? null;
}

async function sendMessage(token, chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (err) {
    console.error("sendMessage failed:", err.message);
  }
}

async function getUpdates(token, offset) {
  const url = `https://api.telegram.org/bot${token}/getUpdates?timeout=25&offset=${offset}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.ok) throw new Error(`getUpdates failed: ${JSON.stringify(data)}`);
  return data.result;
}

function handleMessage(token, message) {
  const text = message.text ?? "";
  const chatId = String(message.chat.id);
  const match = text.match(/^\/start\s+(\S+)/);

  if (!match) {
    sendMessage(
      token,
      chatId,
      "Salom! MammoAI ilovasidagi profilingizdan \"Telegram orqali ulash\" tugmasini bosib, hisobingizni ulang."
    );
    return;
  }

  const linkToken = match[1];
  const user = db
    .prepare("SELECT id, first_name FROM users WHERE telegram_link_token = ?")
    .get(linkToken);

  if (!user) {
    sendMessage(token, chatId, "Havola eskirgan yoki noto'g'ri. Profilingizdan qayta urinib ko'ring.");
    return;
  }

  db.prepare("UPDATE users SET telegram_chat_id = ?, telegram_link_token = NULL WHERE id = ?").run(
    chatId,
    user.id
  );
  sendMessage(
    token,
    chatId,
    `Salom, ${user.first_name}! Endi qayta test topshirish vaqti kelganda MammoAI sizga shu yerga eslatma yuboradi.`
  );
}

async function checkReminders(token) {
  const retestCutoff = new Date(Date.now() - RETEST_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const cooldownCutoff = new Date(
    Date.now() - REMINDER_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const rows = db
    .prepare(
      `SELECT u.id, u.first_name, u.telegram_chat_id,
        (SELECT created_at FROM quiz_attempts a WHERE a.user_id = u.id ORDER BY a.created_at DESC LIMIT 1) AS latest_at
       FROM users u
       WHERE u.telegram_chat_id IS NOT NULL
         AND (u.last_reminder_sent_at IS NULL OR u.last_reminder_sent_at < ?)`
    )
    .all(cooldownCutoff);

  const due = rows.filter((r) => r.latest_at && r.latest_at < retestCutoff);
  const link = SITE_URL ? ` ${SITE_URL}/test` : "";

  for (const u of due) {
    await sendMessage(
      token,
      u.telegram_chat_id,
      `Salom, ${u.first_name}! Oxirgi MammoAI testingizdan ${RETEST_DAYS} kundan ko'proq vaqt o'tdi. Muntazam nazorat uchun qayta test topshirishni tavsiya qilamiz.${link}`
    );
    db.prepare("UPDATE users SET last_reminder_sent_at = ? WHERE id = ?").run(
      new Date().toISOString(),
      u.id
    );
  }

  if (due.length) console.log(`[${new Date().toISOString()}] sent ${due.length} reminder(s)`);
}

async function main() {
  console.log("MammoAI Telegram bot starting — waiting for a token in admin panel → Settings...");
  let offset = 0;
  let lastReminderCheck = 0;
  let wasConfigured = false;

  for (;;) {
    const token = getSetting("telegram_bot_token");

    if (!token) {
      if (wasConfigured) console.log("Telegram bot disconnected.");
      wasConfigured = false;
      offset = 0;
      await new Promise((r) => setTimeout(r, 15000));
      continue;
    }

    if (!wasConfigured) {
      console.log("Telegram bot token found — starting long-poll loop.");
      wasConfigured = true;
    }

    try {
      const updates = await getUpdates(token, offset);
      for (const update of updates) {
        offset = update.update_id + 1;
        if (update.message) handleMessage(token, update.message);
      }
    } catch (err) {
      console.error("getUpdates error:", err.message);
      await new Promise((r) => setTimeout(r, 5000));
    }

    if (Date.now() - lastReminderCheck > REMINDER_CHECK_INTERVAL_MS) {
      lastReminderCheck = Date.now();
      checkReminders(token).catch((err) => console.error("reminder check error:", err.message));
    }
  }
}

main();
