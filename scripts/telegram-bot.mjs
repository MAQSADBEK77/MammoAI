// Standalone process (run under pm2, see README) that makes the Telegram
// bot a full alternative to the website, not just a reminder pinger:
//   - sign up, right in the chat, if you don't have an account yet
//   - view/edit your profile
//   - take the whole risk quiz, one question per message with buttons
//   - see your latest result
//   - a reminder DM once you're 90+ days past your last attempt
//
// Reads the bot token from the same SQLite database the Next.js app uses
// (set via the admin panel → Settings, not an env var) — so it can pick up
// a token added or changed at runtime without a restart.

import Database from "better-sqlite3";
import path from "node:path";
import { randomUUID, randomBytes, scryptSync } from "node:crypto";

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

const BTN = {
  signup: "📝 Ro'yxatdan o'tish",
  test: "🧪 Test topshirish",
  profile: "👤 Profilim",
  result: "📊 Natijam",
  help: "ℹ️ Yordam",
  cancel: "❌ Bekor qilish",
  skipPhone: "Telefon kiritmayman",
};

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

// ---------------------------------------------------------------------------
// DB helpers (raw SQL — this script is standalone, doesn't share the TS
// server/ modules, so the handful of queries it needs are duplicated here)
// ---------------------------------------------------------------------------

function getSetting(key) {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row?.value ?? null;
}

function getUserByChatId(chatId) {
  return db.prepare("SELECT * FROM users WHERE telegram_chat_id = ?").get(String(chatId));
}

function getUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE lower(email) = lower(?)").get(email);
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function createUserFromBot(data, chatId) {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO users (id, email, password_hash, role, first_name, last_name, birth_date, passport_series, phone, created_at, telegram_chat_id)
     VALUES (@id, @email, @passwordHash, 'user', @firstName, @lastName, @birthDate, @passportSeries, @phone, @createdAt, @chatId)`
  ).run({
    id,
    email: data.email,
    passwordHash: hashPassword(data.password),
    firstName: data.firstName,
    lastName: data.lastName,
    birthDate: data.birthDate,
    passportSeries: data.passportSeries,
    phone: data.phone ?? "",
    createdAt: new Date().toISOString(),
    chatId: String(chatId),
  });
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

const PROFILE_FIELD_COLUMN = {
  firstName: "first_name",
  lastName: "last_name",
  phone: "phone",
  birthDate: "birth_date",
  passportSeries: "passport_series",
};

function updateProfileField(userId, field, value) {
  const column = PROFILE_FIELD_COLUMN[field];
  db.prepare(`UPDATE users SET ${column} = ? WHERE id = ?`).run(value, userId);
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

// yyyy-mm-dd -> d-month-yyyy (uz month names, matching the site's format.ts)
const UZ_MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
function formatDateUz(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d}-${UZ_MONTHS[m - 1]}, ${y}`;
}

// "12.05.1990" -> "1990-05-12", or null if invalid
function parseBirthDate(text) {
  const match = text.trim().match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (year < 1920 || year > new Date().getFullYear()) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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
  const data = await api(token, "sendMessage", { chat_id: chatId, text, reply_markup: replyMarkup });
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
      { command: "start", description: "Boshlash / bosh menyu" },
      { command: "test", description: "Xavf testini boshlash" },
      { command: "natija", description: "So'nggi natijangizni ko'rish" },
      { command: "profil", description: "Profilingiz" },
      { command: "yordam", description: "Yordam" },
    ],
  }).catch(() => {});
}

function mainMenu(isLinked) {
  const rows = isLinked
    ? [[BTN.test, BTN.result], [BTN.profile], [BTN.help]]
    : [[BTN.signup], [BTN.help]];
  return { keyboard: rows.map((r) => r.map((text) => ({ text }))), resize_keyboard: true, is_persistent: true };
}

function cancelKeyboard() {
  return { keyboard: [[{ text: BTN.cancel }]], resize_keyboard: true };
}

async function sendMainMenu(token, chatId, text, isLinked) {
  await sendMessage(token, chatId, text, mainMenu(isLinked));
}

// ---------------------------------------------------------------------------
// Per-chat conversation state (in memory — a bot restart mid-flow just means
// the user taps the menu button again; nothing destructive is ever half-done)
// ---------------------------------------------------------------------------

const sessions = new Map();

function resetSession(chatId) {
  sessions.delete(chatId);
}

// --- Quiz -------------------------------------------------------------------

async function sendQuestion(token, chatId, session) {
  const q = session.questions[session.index];
  const keyboard = q.options.map((o, i) => [{ text: o.text, callback_data: `a:${session.index}:${i}` }]);
  const header = `📋 Savol ${session.index + 1}/${session.questions.length}${q.category ? ` · ${q.category}` : ""}`;
  session.lastMessageId = await sendMessage(token, chatId, `${header}\n\n${q.text}`, { inline_keyboard: keyboard });
}

async function startQuiz(token, chatId, user) {
  const questions = getOrderedQuestions();
  if (questions.length === 0) {
    await sendMessage(token, chatId, "Hozircha test savollari mavjud emas.");
    return;
  }
  const session = { type: "quiz", userId: user.id, questions, index: 0, answers: [] };
  sessions.set(chatId, session);
  await sendMessage(token, chatId, "🩺 MammoAI xavf testi boshlandi. Har bir savolga eng mos javobni tanlang.");
  await sendQuestion(token, chatId, session);
}

function formatResult(result) {
  return [
    `Natija: ${result.percent}% (${result.totalScore}/${result.maxScore})`,
    `Xavf darajasi: ${RISK_LABELS[result.riskLevel]}`,
    "",
    RISK_DESCRIPTIONS[result.riskLevel],
    "",
    "⚠️ Bu natija tibbiy tashxis emas, faqat dastlabki xabardorlik uchun mo'ljallangan. Xavotir bo'lsa shifokorga murojaat qiling.",
  ].join("\n");
}

async function finishQuiz(token, chatId, session) {
  const result = saveAttempt(session.userId, session.questions, session.answers);
  resetSession(chatId);
  await sendMessage(token, chatId, `✅ Test yakunlandi!\n\n${formatResult(result)}`);
  await sendMainMenu(token, chatId, "Yana nima qilamiz?", true);
}

async function handleQuizCallback(token, chatId, session, data, callbackQueryId) {
  const match = data.match(/^a:(\d+):(\d+)$/);
  if (!match) {
    await answerCallback(token, callbackQueryId, "");
    return;
  }
  const qIndex = Number(match[1]);
  const oIndex = Number(match[2]);
  if (session.index !== qIndex) {
    await answerCallback(token, callbackQueryId, "Bu savol eskirgan.");
    return;
  }
  const question = session.questions[qIndex];
  const option = question.options[oIndex];
  if (!option) {
    await answerCallback(token, callbackQueryId, "Noto'g'ri javob.");
    return;
  }
  session.answers.push({ questionId: question.id, optionId: option.id, score: option.score });
  await answerCallback(token, callbackQueryId, `✓ ${option.text}`);
  await clearButtons(token, chatId, session.lastMessageId);

  session.index += 1;
  if (session.index < session.questions.length) {
    await sendQuestion(token, chatId, session);
  } else {
    await finishQuiz(token, chatId, session);
  }
}

// --- Sign up ------------------------------------------------------------

const SIGNUP_STEPS = ["firstName", "lastName", "email", "password", "birthDate", "passportSeries", "phone"];

const SIGNUP_PROMPTS = {
  firstName: "Ismingizni kiriting:",
  lastName: "Familiyangizni kiriting:",
  email: "Email manzilingizni kiriting:",
  password: "Parol o'ylab toping (kamida 6 ta belgi):",
  birthDate: "Tug'ilgan sanangizni kiriting (masalan: 12.05.1990):",
  passportSeries: "Passport seriya raqamingizni kiriting (masalan: AB1234567):",
  phone: "Telefon raqamingizni kiriting (ixtiyoriy):",
};

async function startSignup(token, chatId) {
  sessions.set(chatId, { type: "signup", step: 0, data: {} });
  await sendMessage(
    token,
    chatId,
    "Ro'yxatdan o'tish uchun bir nechta savolga javob bering. Istalgan vaqtda \"❌ Bekor qilish\" tugmasini bosing.",
    cancelKeyboard()
  );
  await sendMessage(token, chatId, SIGNUP_PROMPTS[SIGNUP_STEPS[0]]);
}

async function handleSignupStep(token, chatId, session, text) {
  const field = SIGNUP_STEPS[session.step];
  const value = text.trim();

  if (field === "firstName" || field === "lastName") {
    if (!value) {
      await sendMessage(token, chatId, "Bo'sh bo'lishi mumkin emas. Qayta kiriting:");
      return;
    }
    session.data[field] = value;
  } else if (field === "email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      await sendMessage(token, chatId, "Email noto'g'ri ko'rinadi. Qayta kiriting:");
      return;
    }
    if (getUserByEmail(value)) {
      await sendMessage(
        token,
        chatId,
        "Bu email allaqachon ro'yxatdan o'tgan. Agar bu sizning hisobingiz bo'lsa, saytdagi profilingizdan \"Telegram orqali ulash\" tugmasidan foydalaning. Boshqa email kiriting:"
      );
      return;
    }
    session.data.email = value.toLowerCase();
  } else if (field === "password") {
    if (value.length < 6) {
      await sendMessage(token, chatId, "Parol kamida 6 ta belgidan iborat bo'lishi kerak. Qayta kiriting:");
      return;
    }
    session.data.password = value;
  } else if (field === "birthDate") {
    const iso = parseBirthDate(value);
    if (!iso) {
      await sendMessage(token, chatId, "Sana formati noto'g'ri. Masalan: 12.05.1990 shaklida kiriting:");
      return;
    }
    session.data.birthDate = iso;
  } else if (field === "passportSeries") {
    if (value.length < 5) {
      await sendMessage(token, chatId, "Passport seriya raqami noto'g'ri. Masalan: AB1234567. Qayta kiriting:");
      return;
    }
    session.data.passportSeries = value.toUpperCase();
  } else if (field === "phone") {
    session.data.phone = value === BTN.skipPhone ? "" : value;
  }

  session.step += 1;

  if (session.step >= SIGNUP_STEPS.length) {
    const user = createUserFromBot(session.data, chatId);
    resetSession(chatId);
    await sendMessage(
      token,
      chatId,
      `Tabriklaymiz, ${user.first_name}! Hisobingiz yaratildi va ulandi.`
    );
    await sendMainMenu(token, chatId, "Endi nima qilamiz?", true);
    return;
  }

  const nextField = SIGNUP_STEPS[session.step];
  const replyMarkup =
    nextField === "phone" ? { keyboard: [[{ text: BTN.skipPhone }], [{ text: BTN.cancel }]], resize_keyboard: true } : cancelKeyboard();
  await sendMessage(token, chatId, SIGNUP_PROMPTS[nextField], replyMarkup);
}

// --- Profile --------------------------------------------------------------

function profileEditKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "Ism", callback_data: "ef:firstName" }, { text: "Familiya", callback_data: "ef:lastName" }],
      [{ text: "Telefon", callback_data: "ef:phone" }, { text: "Tug'ilgan sana", callback_data: "ef:birthDate" }],
      [{ text: "Passport seriya", callback_data: "ef:passportSeries" }],
    ],
  };
}

async function sendProfile(token, chatId, user) {
  const lines = [
    "👤 Profilingiz",
    "",
    `Ism: ${user.first_name}`,
    `Familiya: ${user.last_name}`,
    `Email: ${user.email}`,
    `Telefon: ${user.phone || "—"}`,
    `Tug'ilgan sana: ${formatDateUz(user.birth_date)}`,
    `Passport seriya: ${user.passport_series}`,
    "",
    "O'zgartirish uchun quyidagidan tanlang:",
  ];
  await sendMessage(token, chatId, lines.join("\n"), profileEditKeyboard());
}

const EDIT_FIELD_PROMPTS = {
  firstName: "Yangi ismingizni kiriting:",
  lastName: "Yangi familiyangizni kiriting:",
  phone: "Yangi telefon raqamingizni kiriting:",
  birthDate: "Yangi tug'ilgan sanangizni kiriting (masalan: 12.05.1990):",
  passportSeries: "Yangi passport seriya raqamingizni kiriting:",
};

async function handleEditFieldCallback(token, chatId, data, callbackQueryId) {
  const field = data.slice(3); // "ef:firstName" -> "firstName"
  if (!EDIT_FIELD_PROMPTS[field]) {
    await answerCallback(token, callbackQueryId, "");
    return;
  }
  await answerCallback(token, callbackQueryId, "");
  sessions.set(chatId, { type: "editField", field });
  await sendMessage(token, chatId, EDIT_FIELD_PROMPTS[field], cancelKeyboard());
}

async function handleEditFieldStep(token, chatId, session, user, text) {
  const { field } = session;
  const value = text.trim();

  if (field === "firstName" || field === "lastName") {
    if (!value) {
      await sendMessage(token, chatId, "Bo'sh bo'lishi mumkin emas. Qayta kiriting:");
      return;
    }
    updateProfileField(user.id, field, value);
  } else if (field === "phone") {
    updateProfileField(user.id, field, value);
  } else if (field === "birthDate") {
    const iso = parseBirthDate(value);
    if (!iso) {
      await sendMessage(token, chatId, "Sana formati noto'g'ri. Masalan: 12.05.1990 shaklida kiriting:");
      return;
    }
    updateProfileField(user.id, field, iso);
  } else if (field === "passportSeries") {
    if (value.length < 5) {
      await sendMessage(token, chatId, "Passport seriya raqami noto'g'ri. Qayta kiriting:");
      return;
    }
    updateProfileField(user.id, field, value.toUpperCase());
  }

  resetSession(chatId);
  await sendMessage(token, chatId, "✅ Saqlandi.");
  await sendProfile(token, chatId, getUserByChatId(chatId));
}

// ---------------------------------------------------------------------------
// Update routing
// ---------------------------------------------------------------------------

async function handleCallback(token, callbackQuery) {
  const chatId = callbackQuery.message?.chat?.id;
  const data = callbackQuery.data ?? "";
  if (!chatId) return;

  const session = sessions.get(chatId);

  if (data.startsWith("a:")) {
    if (session?.type === "quiz") {
      await handleQuizCallback(token, chatId, session, data, callbackQuery.id);
    } else {
      await answerCallback(token, callbackQuery.id, "Bu test sessiyasi eskirgan. /test bilan qayta boshlang.");
    }
    return;
  }

  if (data.startsWith("ef:")) {
    await handleEditFieldCallback(token, chatId, data, callbackQuery.id);
    return;
  }

  await answerCallback(token, callbackQuery.id, "");
}

async function handleMessage(token, message) {
  const chatId = message.chat.id;
  const text = (message.text ?? "").trim();
  const session = sessions.get(chatId);

  // Cancel always works, from anywhere.
  if (text === BTN.cancel || text === "/bekor") {
    resetSession(chatId);
    const user = getUserByChatId(chatId);
    await sendMainMenu(token, chatId, "Bekor qilindi.", Boolean(user));
    return;
  }

  // Mid-flow input takes priority over menu/commands.
  if (session?.type === "signup") {
    await handleSignupStep(token, chatId, session, text);
    return;
  }
  if (session?.type === "editField") {
    const user = getUserByChatId(chatId);
    if (!user) {
      resetSession(chatId);
      return;
    }
    await handleEditFieldStep(token, chatId, session, user, text);
    return;
  }

  const startMatch = text.match(/^\/start(?:\s+(\S+))?/);
  if (startMatch?.[1]) {
    // Linking flow from the website's profile page ("Connect Telegram" button).
    const linkToken = startMatch[1];
    const user = db.prepare("SELECT id, first_name FROM users WHERE telegram_link_token = ?").get(linkToken);
    if (!user) {
      await sendMessage(token, chatId, "Havola eskirgan yoki noto'g'ri. Profilingizdan qayta urinib ko'ring.");
      return;
    }
    db.prepare("UPDATE users SET telegram_chat_id = ?, telegram_link_token = NULL WHERE id = ?").run(String(chatId), user.id);
    await sendMainMenu(token, chatId, `Salom, ${user.first_name}! Hisobingiz ulandi.`, true);
    return;
  }

  const user = getUserByChatId(chatId);

  if (startMatch || text === "/menu") {
    await sendMainMenu(token, chatId, user ? `Salom, ${user.first_name}!` : "Salom! MammoAI botiga xush kelibsiz.", Boolean(user));
    return;
  }

  if (text === BTN.signup || text === "/royxatdan_otish") {
    if (user) {
      await sendMainMenu(token, chatId, "Siz allaqachon ro'yxatdan o'tgansiz.", true);
      return;
    }
    await startSignup(token, chatId);
    return;
  }

  if (text === BTN.test || text === "/test") {
    if (!user) {
      await sendMessage(token, chatId, "Avval ro'yxatdan o'ting yoki saytdagi profilingizdan hisobingizni ulang.");
      await sendMainMenu(token, chatId, "", false);
      return;
    }
    await startQuiz(token, chatId, user);
    return;
  }

  if (text === BTN.result || text === "/natija" || text === "/natijam") {
    if (!user) {
      await sendMainMenu(token, chatId, "Avval ro'yxatdan o'ting yoki hisobingizni ulang.", false);
      return;
    }
    const latest = getLatestAttempt(user.id);
    if (!latest) {
      await sendMessage(token, chatId, "Siz hali test topshirmagansiz.");
      await sendMainMenu(token, chatId, "", true);
      return;
    }
    await sendMessage(
      token,
      chatId,
      `📊 So'nggi natijangiz\n\n${formatResult({
        percent: latest.percent,
        riskLevel: latest.risk_level,
        totalScore: latest.total_score,
        maxScore: latest.max_score,
      })}`
    );
    return;
  }

  if (text === BTN.profile || text === "/profil") {
    if (!user) {
      await sendMainMenu(token, chatId, "Avval ro'yxatdan o'ting yoki hisobingizni ulang.", false);
      return;
    }
    await sendProfile(token, chatId, user);
    return;
  }

  if (text === BTN.help || text === "/yordam" || text === "/help") {
    await sendMainMenu(
      token,
      chatId,
      "MammoAI boti orqali ro'yxatdan o'tishingiz, testdan o'tishingiz va profilingizni boshqarishingiz mumkin. Quyidagi menyudan tanlang:",
      Boolean(user)
    );
    return;
  }

  await sendMainMenu(token, chatId, "Buyruqni tushunmadim. Quyidagi menyudan tanlang:", Boolean(user));
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
      `Salom, ${u.first_name}! Oxirgi MammoAI testingizdan ${RETEST_DAYS} kundan ko'proq vaqt o'tdi. Muntazam nazorat uchun qayta test topshirishni tavsiya qilamiz — pastdagi "${BTN.test}" tugmasini bosing.`,
      mainMenu(true)
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
