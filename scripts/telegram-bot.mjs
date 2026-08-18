// Standalone process (run under pm2, see README) that turns the Telegram
// bot into a real alternative to the website for the parts that matter
// most day-to-day:
//   - /start <token>  links the account (token comes from the profile page)
//   - /test           takes the whole risk quiz right inside the chat,
//                      buttons for each answer, same scoring as the site
//   - /natija         shows the latest saved result without retaking it
//   - /yordam         lists the commands
//   - a reminder DM once a user is 90+ days past their last attempt
//
// Reads the bot token from the same SQLite database the Next.js app uses
// (set via the admin panel → Settings, not an env var) — so it can pick up
// a token added or changed at runtime without a restart.

import Database from "better-sqlite3";
import path from "node:path";
import { randomUUID } from "node:crypto";

const DB_PATH = path.join(process.cwd(), "data", "mammoai.db");
const RETEST_DAYS = 90;
const REMINDER_COOLDOWN_DAYS = 30;
const REMINDER_CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly

const RISK_LABELS = { past: "Past xavf", orta: "O'rta xavf", yuqori: "Yuqori xavf" };
const RISK_DESCRIPTIONS = {
  past: "Hozircha aniqlangan xavf omillari kam. Baribir yiliga bir marta profilaktik ko'rikdan o'ting.",
  orta: "Ba'zi xavf omillari aniqlandi. Yaqin orada mutaxassis shifokor ko'rigidan o'tishingiz tavsiya etiladi.",
  yuqori: "Bir nechta muhim xavf omili aniqlandi. Iloji boricha tezroq onkolog-mammolog shifokorga murojaat qiling.",
};

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

function getSetting(key) {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row?.value ?? null;
}

function getUserByChatId(chatId) {
  return db.prepare("SELECT * FROM users WHERE telegram_chat_id = ?").get(String(chatId));
}

function getOrderedQuestions() {
  const rows = db.prepare('SELECT * FROM quiz_questions ORDER BY "order" ASC').all();
  return rows.map((r) => ({ ...r, options: JSON.parse(r.options) }));
}

function riskLevelFromPercent(percent) {
  if (percent < 34) return "past";
  if (percent < 67) return "orta";
  return "yuqori";
}

function saveAttempt(userId, questions, answers) {
  const maxScore = questions.reduce((sum, q) => sum + Math.max(...q.options.map((o) => o.score), 0), 0);
  const totalScore = answers.reduce((sum, a) => sum + a.score, 0);
  const percent = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const riskLevel = riskLevelFromPercent(percent);
  db.prepare(
    `INSERT INTO quiz_attempts (id, user_id, answers, total_score, max_score, percent, risk_level, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(randomUUID(), userId, JSON.stringify(answers), totalScore, maxScore, percent, riskLevel, new Date().toISOString());
  return { percent, riskLevel, totalScore, maxScore };
}

function getLatestAttempt(userId) {
  return db
    .prepare("SELECT * FROM quiz_attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(userId);
}

// ---------------------------------------------------------------------------
// Telegram API helpers
// ---------------------------------------------------------------------------

async function api(token, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json().catch(() => ({ ok: false }));
}

async function sendMessage(token, chatId, text, replyMarkup) {
  const data = await api(token, "sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: replyMarkup,
  });
  return data?.result?.message_id;
}

async function clearButtons(token, chatId, messageId) {
  if (!messageId) return;
  await api(token, "editMessageReplyMarkup", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: { inline_keyboard: [] },
  }).catch(() => {});
}

async function answerCallback(token, callbackQueryId, text) {
  await api(token, "answerCallbackQuery", { callback_query_id: callbackQueryId, text }).catch(() => {});
}

async function setMyCommands(token) {
  await api(token, "setMyCommands", {
    commands: [
      { command: "test", description: "Xavf testini boshlash" },
      { command: "natija", description: "So'nggi natijangizni ko'rish" },
      { command: "yordam", description: "Yordam" },
    ],
  }).catch(() => {});
}

// ---------------------------------------------------------------------------
// Quiz-in-chat session state (in memory — a bot restart mid-quiz just means
// the user types /test again, no persistence needed for this)
// ---------------------------------------------------------------------------

const sessions = new Map(); // chatId -> { userId, questions, index, answers }

async function sendQuestion(token, chatId, session) {
  const q = session.questions[session.index];
  const keyboard = q.options.map((o, i) => [{ text: o.text, callback_data: `a:${session.index}:${i}` }]);
  const header = `📋 Savol ${session.index + 1}/${session.questions.length}${q.category ? ` · ${q.category}` : ""}`;
  session.lastMessageId = await sendMessage(token, chatId, `${header}\n\n${q.text}`, {
    inline_keyboard: keyboard,
  });
}

async function startQuiz(token, chatId, user) {
  const questions = getOrderedQuestions();
  if (questions.length === 0) {
    await sendMessage(token, chatId, "Hozircha test savollari mavjud emas.");
    return;
  }
  const session = { userId: user.id, questions, index: 0, answers: [] };
  sessions.set(chatId, session);
  await sendMessage(
    token,
    chatId,
    "🩺 MammoAI xavf testi boshlandi. Har bir savolga eng mos javobni tanlang."
  );
  await sendQuestion(token, chatId, session);
}

async function sendResult(token, chatId, result) {
  const lines = [
    "✅ Test yakunlandi!",
    "",
    `Natija: ${result.percent}% (${result.totalScore}/${result.maxScore})`,
    `Xavf darajasi: ${RISK_LABELS[result.riskLevel]}`,
    "",
    RISK_DESCRIPTIONS[result.riskLevel],
    "",
    "⚠️ Bu natija tibbiy tashxis emas, faqat dastlabki xabardorlik uchun mo'ljallangan. Xavotir bo'lsa shifokorga murojaat qiling.",
  ];
  await sendMessage(token, chatId, lines.join("\n"));
}

async function handleCallback(token, callbackQuery) {
  const chatId = callbackQuery.message?.chat?.id;
  const data = callbackQuery.data ?? "";
  const match = data.match(/^a:(\d+):(\d+)$/);

  if (!match || !chatId) {
    await answerCallback(token, callbackQuery.id, "");
    return;
  }

  const session = sessions.get(chatId);
  const qIndex = Number(match[1]);
  const oIndex = Number(match[2]);

  if (!session || session.index !== qIndex) {
    await answerCallback(token, callbackQuery.id, "Bu savol eskirgan.");
    return;
  }

  const question = session.questions[qIndex];
  const option = question.options[oIndex];
  if (!option) {
    await answerCallback(token, callbackQuery.id, "Noto'g'ri javob.");
    return;
  }

  session.answers.push({ questionId: question.id, optionId: option.id, score: option.score });
  await answerCallback(token, callbackQuery.id, `✓ ${option.text}`);
  await clearButtons(token, chatId, session.lastMessageId);

  session.index += 1;
  if (session.index < session.questions.length) {
    await sendQuestion(token, chatId, session);
    return;
  }

  const result = saveAttempt(session.userId, session.questions, session.answers);
  sessions.delete(chatId);
  await sendResult(token, chatId, result);
}

async function handleMessage(token, message) {
  const chatId = message.chat.id;
  const text = (message.text ?? "").trim();

  const startMatch = text.match(/^\/start(?:\s+(\S+))?/);
  if (startMatch) {
    const linkToken = startMatch[1];
    if (!linkToken) {
      const existing = getUserByChatId(chatId);
      await sendMessage(
        token,
        chatId,
        existing
          ? `Salom, ${existing.first_name}! /test — testni boshlash, /natija — so'nggi natijangiz, /yordam — yordam.`
          : "Salom! Hisobingizni ulash uchun MammoAI saytidagi profilingizdan \"Telegram orqali ulash\" tugmasini bosing."
      );
      return;
    }
    const user = db.prepare("SELECT id, first_name FROM users WHERE telegram_link_token = ?").get(linkToken);
    if (!user) {
      await sendMessage(token, chatId, "Havola eskirgan yoki noto'g'ri. Profilingizdan qayta urinib ko'ring.");
      return;
    }
    db.prepare("UPDATE users SET telegram_chat_id = ?, telegram_link_token = NULL WHERE id = ?").run(
      String(chatId),
      user.id
    );
    await sendMessage(
      token,
      chatId,
      `Salom, ${user.first_name}! Hisobingiz ulandi. Endi shu yerdan:\n\n/test — xavf testini topshirish\n/natija — so'nggi natijangizni ko'rish\n\nQayta test topshirish vaqti kelganda ham shu yerga eslataman.`
    );
    return;
  }

  const user = getUserByChatId(chatId);

  if (text === "/test") {
    if (!user) {
      await sendMessage(
        token,
        chatId,
        "Avval MammoAI saytida ro'yxatdan o'ting va profilingizdan Telegram hisobingizni ulang."
      );
      return;
    }
    await startQuiz(token, chatId, user);
    return;
  }

  if (text === "/natija" || text === "/natijam") {
    if (!user) {
      await sendMessage(token, chatId, "Avval hisobingizni ulang: saytdagi profilingizdan \"Telegram orqali ulash\".");
      return;
    }
    const latest = getLatestAttempt(user.id);
    if (!latest) {
      await sendMessage(token, chatId, "Siz hali test topshirmagansiz. /test yozib boshlang.");
      return;
    }
    await sendResult(token, chatId, {
      percent: latest.percent,
      riskLevel: latest.risk_level,
      totalScore: latest.total_score,
      maxScore: latest.max_score,
    });
    return;
  }

  if (text === "/yordam" || text === "/help") {
    await sendMessage(
      token,
      chatId,
      "/test — xavf testini topshirish\n/natija — so'nggi natijangizni ko'rish\n/yordam — shu xabar"
    );
    return;
  }

  if (!sessions.has(chatId)) {
    await sendMessage(token, chatId, "Buyruqni tushunmadim. /yordam yozing.");
  }
}

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------

async function checkReminders(token) {
  const retestCutoff = new Date(Date.now() - RETEST_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const cooldownCutoff = new Date(Date.now() - REMINDER_COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();

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

  for (const u of due) {
    await sendMessage(
      token,
      u.telegram_chat_id,
      `Salom, ${u.first_name}! Oxirgi MammoAI testingizdan ${RETEST_DAYS} kundan ko'proq vaqt o'tdi. Muntazam nazorat uchun qayta test topshirishni tavsiya qilamiz — shu yerga /test deb yozing.`
    );
    db.prepare("UPDATE users SET last_reminder_sent_at = ? WHERE id = ?").run(new Date().toISOString(), u.id);
  }

  if (due.length) console.log(`[${new Date().toISOString()}] sent ${due.length} reminder(s)`);
}

// ---------------------------------------------------------------------------
// Long-poll loop
// ---------------------------------------------------------------------------

async function getUpdates(token, offset) {
  const url = `https://api.telegram.org/bot${token}/getUpdates?timeout=25&offset=${offset}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.ok) throw new Error(`getUpdates failed: ${JSON.stringify(data)}`);
  return data.result;
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
      setMyCommands(token);
    }

    try {
      const updates = await getUpdates(token, offset);
      for (const update of updates) {
        offset = update.update_id + 1;
        if (update.message) await handleMessage(token, update.message);
        else if (update.callback_query) await handleCallback(token, update.callback_query);
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
