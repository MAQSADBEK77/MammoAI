// Standalone process (run under pm2, see README) that makes the Telegram
// bot a full alternative to the website, not just a reminder pinger:
//   - sign up, right in the chat, if you don't have an account yet
//   - view/edit your profile, switch language, unlink or delete the account
//   - take the whole risk quiz, one question per message with buttons
//   - see your latest result
//   - a 90-day retest reminder AND a separate monthly self-exam reminder
//
// Reads the bot token from the same SQLite database the Next.js app uses
// (set via the admin panel → Settings, not an env var) — so it can pick up
// a token added or changed at runtime without a restart.
//
// Every user-facing string is localized (uz/ru/en), mirroring the site's
// own i18n content (src/lib/i18n/*.ts) where the wording overlaps. The
// chosen language lives per Telegram chat (table telegram_prefs below) —
// independent of the site's own language toggle, since the same person
// could use the site in one language and the bot in another.

import Database from "better-sqlite3";
import path from "node:path";
import { randomUUID, randomBytes, scryptSync } from "node:crypto";

const DB_PATH = path.join(process.cwd(), "data", "mammoai.db");
const RETEST_DAYS = 90;
const RETEST_COOLDOWN_DAYS = 30; // min gap between repeated retest nudges
const SELF_EXAM_INTERVAL_DAYS = 30;
const REMINDER_CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");
db.pragma("foreign_keys = ON");

// Bot-only table: which language each chat prefers. Not part of the
// Next.js app's schema (src/server/db.ts) since nothing on the website
// reads it — self-contained here, created on first run.
db.exec(`CREATE TABLE IF NOT EXISTS telegram_prefs (chat_id TEXT PRIMARY KEY, lang TEXT NOT NULL DEFAULT 'uz')`);

// ---------------------------------------------------------------------------
// i18n — every bot-generated string in one place, keyed uz/ru/en. Question
// and answer text itself comes from the admin-authored quiz_questions table
// and is shown as-is (same behaviour as the website: only the chrome is
// translated, not admin content).
// ---------------------------------------------------------------------------

const MSG = {
  welcomeBack: { uz: "Salom, {name}!", ru: "Здравствуйте, {name}!", en: "Hello, {name}!" },
  welcomeNew: {
    uz: "Salom! MammoAI botiga xush kelibsiz.",
    ru: "Здравствуйте! Добро пожаловать в бот MammoAI.",
    en: "Hello! Welcome to the MammoAI bot.",
  },
  linkedGreeting: {
    uz: "Salom, {name}! Hisobingiz ulandi.",
    ru: "Здравствуйте, {name}! Ваш аккаунт подключён.",
    en: "Hello, {name}! Your account is connected.",
  },
  linkTokenInvalid: {
    uz: "Havola eskirgan yoki noto'g'ri. Profilingizdan qayta urinib ko'ring.",
    ru: "Ссылка устарела или неверна. Попробуйте ещё раз из профиля на сайте.",
    en: "This link is invalid or expired. Please try again from your profile on the site.",
  },
  alreadyRegistered: {
    uz: "Siz allaqachon ro'yxatdan o'tgansiz.",
    ru: "Вы уже зарегистрированы.",
    en: "You're already signed up.",
  },
  needAccountForTest: {
    uz: "Avval ro'yxatdan o'ting yoki saytdagi profilingizdan hisobingizni ulang.",
    ru: "Сначала зарегистрируйтесь или подключите аккаунт из профиля на сайте.",
    en: "Please sign up first, or connect your account from your profile on the site.",
  },
  needAccountGeneric: {
    uz: "Avval ro'yxatdan o'ting yoki hisobingizni ulang.",
    ru: "Сначала зарегистрируйтесь или подключите аккаунт.",
    en: "Please sign up first, or connect your account.",
  },
  noAttemptsYet: {
    uz: "Siz hali test topshirmagansiz.",
    ru: "Вы ещё не проходили тест.",
    en: "You haven't taken the test yet.",
  },
  latestResultHeader: {
    uz: "📊 So'nggi natijangiz",
    ru: "📊 Ваш последний результат",
    en: "📊 Your latest result",
  },
  helpText: {
    uz: "MammoAI boti orqali ro'yxatdan o'tishingiz, testdan o'tishingiz va profilingizni boshqarishingiz mumkin. Quyidagi menyudan tanlang:",
    ru: "Через бота MammoAI вы можете зарегистрироваться, пройти тест и управлять своим профилем. Выберите нужное действие в меню ниже:",
    en: "Through the MammoAI bot you can sign up, take the test, and manage your profile. Choose an option from the menu below:",
  },
  unknownCommand: {
    uz: "Buyruqni tushunmadim. Quyidagi menyudan tanlang:",
    ru: "Не понял команду. Выберите действие в меню ниже:",
    en: "I didn't understand that. Please choose from the menu below:",
  },
  cancelled: { uz: "Bekor qilindi.", ru: "Отменено.", en: "Cancelled." },
  whatNext: { uz: "Yana nima qilamiz?", ru: "Что дальше?", en: "What next?" },
  nowWhat: { uz: "Endi nima qilamiz?", ru: "Что теперь сделаем?", en: "What would you like to do now?" },

  quizStart: {
    uz: "🩺 MammoAI xavf testi boshlandi. Har bir savolga eng mos javobni tanlang.",
    ru: "🩺 Начался тест на риск MammoAI. Выбирайте наиболее подходящий ответ на каждый вопрос.",
    en: "🩺 The MammoAI risk test has started. Pick the answer that fits best for each question.",
  },
  noQuestions: {
    uz: "Hozircha test savollari mavjud emas.",
    ru: "Пока нет вопросов теста.",
    en: "There are no test questions yet.",
  },
  questionLabel: { uz: "Savol", ru: "Вопрос", en: "Question" },
  quizStale: { uz: "Bu savol eskirgan.", ru: "Этот вопрос устарел.", en: "This question is stale." },
  quizBadOption: { uz: "Noto'g'ri javob.", ru: "Некорректный ответ.", en: "Invalid answer." },
  quizSessionExpired: {
    uz: "Bu test sessiyasi eskirgan. /test bilan qayta boshlang.",
    ru: "Сессия теста устарела. Начните заново командой /test.",
    en: "This test session has expired. Start again with /test.",
  },
  quizFinished: { uz: "✅ Test yakunlandi!", ru: "✅ Тест завершён!", en: "✅ Test complete!" },
  resultLine: {
    uz: "Natija: {percent}% ({total}/{max})",
    ru: "Результат: {percent}% ({total}/{max})",
    en: "Result: {percent}% ({total}/{max})",
  },
  riskLine: {
    uz: "Xavf darajasi: {risk}",
    ru: "Уровень риска: {risk}",
    en: "Risk level: {risk}",
  },
  resultDisclaimer: {
    uz: "⚠️ Bu natija tibbiy tashxis emas, faqat dastlabki xabardorlik uchun mo'ljallangan. Xavotir bo'lsa shifokorga murojaat qiling.",
    ru: "⚠️ Этот результат не является медицинским диагнозом, он предназначен только для первичного информирования. При беспокойстве обратитесь к врачу.",
    en: "⚠️ This result is not a medical diagnosis — it's intended for early awareness only. If you're concerned, please see a doctor.",
  },

  signupIntro: {
    uz: 'Ro\'yxatdan o\'tish uchun bir nechta savolga javob bering. Istalgan vaqtda "{cancelBtn}" tugmasini bosing.',
    ru: 'Ответьте на несколько вопросов, чтобы зарегистрироваться. В любой момент можно нажать "{cancelBtn}".',
    en: 'Answer a few questions to sign up. You can tap "{cancelBtn}" at any time.',
  },
  promptFirstName: { uz: "Ismingizni kiriting:", ru: "Введите имя:", en: "Enter your first name:" },
  promptLastName: { uz: "Familiyangizni kiriting:", ru: "Введите фамилию:", en: "Enter your last name:" },
  promptEmail: { uz: "Email manzilingizni kiriting:", ru: "Введите ваш email:", en: "Enter your email address:" },
  promptPassword: {
    uz: "Parol o'ylab toping (kamida 6 ta belgi):",
    ru: "Придумайте пароль (минимум 6 символов):",
    en: "Choose a password (at least 6 characters):",
  },
  promptBirthDate: {
    uz: "Tug'ilgan sanangizni kiriting (masalan: 12.05.1990):",
    ru: "Введите дату рождения (например: 12.05.1990):",
    en: "Enter your date of birth (e.g. 12.05.1990):",
  },
  promptPassportSeries: {
    uz: "Passport seriya raqamingizni kiriting (masalan: AB1234567):",
    ru: "Введите серию и номер паспорта (например: AB1234567):",
    en: "Enter your passport number (e.g. AB1234567):",
  },
  promptPhone: {
    uz: "Telefon raqamingizni kiriting (ixtiyoriy):",
    ru: "Введите номер телефона (необязательно):",
    en: "Enter your phone number (optional):",
  },
  errEmpty: { uz: "Bo'sh bo'lishi mumkin emas. Qayta kiriting:", ru: "Поле не может быть пустым. Повторите:", en: "This can't be empty. Please try again:" },
  errEmailInvalid: {
    uz: "Email noto'g'ri ko'rinadi. Qayta kiriting:",
    ru: "Email выглядит некорректно. Повторите:",
    en: "That email doesn't look valid. Please try again:",
  },
  errEmailTaken: {
    uz: 'Bu email allaqachon ro\'yxatdan o\'tgan. Agar bu sizning hisobingiz bo\'lsa, saytdagi profilingizdan "Telegram orqali ulash" tugmasidan foydalaning. Boshqa email kiriting:',
    ru: 'Этот email уже зарегистрирован. Если это ваш аккаунт, используйте кнопку "Подключить Telegram" в профиле на сайте. Введите другой email:',
    en: 'This email is already registered. If it\'s your account, use the "Connect Telegram" button on your profile on the site. Enter a different email:',
  },
  errPasswordShort: {
    uz: "Parol kamida 6 ta belgidan iborat bo'lishi kerak. Qayta kiriting:",
    ru: "Пароль должен содержать минимум 6 символов. Повторите:",
    en: "Password must be at least 6 characters. Please try again:",
  },
  errBirthDateFormat: {
    uz: "Sana formati noto'g'ri. Masalan: 12.05.1990 shaklida kiriting:",
    ru: "Неверный формат даты. Введите в формате 12.05.1990:",
    en: "Invalid date format. Please enter it like 12.05.1990:",
  },
  errPassportShort: {
    uz: "Passport seriya raqami noto'g'ri. Masalan: AB1234567. Qayta kiriting:",
    ru: "Неверный номер паспорта. Например: AB1234567. Повторите:",
    en: "Invalid passport number. E.g. AB1234567. Please try again:",
  },
  signupSuccess: {
    uz: "Tabriklaymiz, {name}! Hisobingiz yaratildi va ulandi.",
    ru: "Поздравляем, {name}! Ваш аккаунт создан и подключён.",
    en: "Congratulations, {name}! Your account has been created and connected.",
  },

  profileHeader: { uz: "👤 Profilingiz", ru: "👤 Ваш профиль", en: "👤 Your profile" },
  fieldFirstName: { uz: "Ism", ru: "Имя", en: "First name" },
  fieldLastName: { uz: "Familiya", ru: "Фамилия", en: "Last name" },
  fieldEmail: { uz: "Email", ru: "Email", en: "Email" },
  fieldPhone: { uz: "Telefon", ru: "Телефон", en: "Phone" },
  fieldBirthDate: { uz: "Tug'ilgan sana", ru: "Дата рождения", en: "Date of birth" },
  fieldPassportSeries: { uz: "Passport seriya", ru: "Серия паспорта", en: "Passport number" },
  profileEditPrompt: {
    uz: "O'zgartirish uchun quyidagidan tanlang:",
    ru: "Выберите, что изменить:",
    en: "Choose what to change:",
  },
  editFirstNamePrompt: { uz: "Yangi ismingizni kiriting:", ru: "Введите новое имя:", en: "Enter your new first name:" },
  editLastNamePrompt: { uz: "Yangi familiyangizni kiriting:", ru: "Введите новую фамилию:", en: "Enter your new last name:" },
  editPhonePrompt: { uz: "Yangi telefon raqamingizni kiriting:", ru: "Введите новый номер телефона:", en: "Enter your new phone number:" },
  editBirthDatePrompt: {
    uz: "Yangi tug'ilgan sanangizni kiriting (masalan: 12.05.1990):",
    ru: "Введите новую дату рождения (например: 12.05.1990):",
    en: "Enter your new date of birth (e.g. 12.05.1990):",
  },
  editPassportSeriesPrompt: {
    uz: "Yangi passport seriya raqamingizni kiriting:",
    ru: "Введите новую серию паспорта:",
    en: "Enter your new passport number:",
  },
  savedOk: { uz: "✅ Saqlandi.", ru: "✅ Сохранено.", en: "✅ Saved." },

  chooseLanguage: { uz: "Tilni tanlang:", ru: "Выберите язык:", en: "Choose a language:" },
  languageChanged: { uz: "✅ Til o'zgartirildi.", ru: "✅ Язык изменён.", en: "✅ Language changed." },

  unlinkConfirmPrompt: {
    uz: "Botni hisobingizdan uzmoqchimisiz? Test va profil funksiyalari botda ishlamay qoladi, lekin hisobingiz saytda saqlanib qoladi.",
    ru: "Отключить бота от вашего аккаунта? Тест и профиль перестанут работать в боте, но аккаунт останется на сайте.",
    en: "Disconnect the bot from your account? The test and profile won't work in the bot anymore, but your account stays on the site.",
  },
  unlinkDone: {
    uz: "🔌 Bot hisobingizdan uzildi. Qayta ulash uchun saytdagi profilingizdan foydalaning.",
    ru: "🔌 Бот отключён от вашего аккаунта. Чтобы подключить снова, используйте профиль на сайте.",
    en: "🔌 The bot has been disconnected from your account. Use your profile on the site to reconnect.",
  },
  deleteConfirmPrompt: {
    uz: "⚠️ DIQQAT: hisobingiz va barcha test natijalaringiz butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi. Davom etasizmi?",
    ru: "⚠️ ВНИМАНИЕ: ваш аккаунт и все результаты тестов будут удалены безвозвратно. Это действие нельзя отменить. Продолжить?",
    en: "⚠️ WARNING: your account and all your test results will be permanently deleted. This cannot be undone. Continue?",
  },
  deleteDone: {
    uz: "🗑 Hisobingiz butunlay o'chirildi. Xayr!",
    ru: "🗑 Ваш аккаунт полностью удалён. До свидания!",
    en: "🗑 Your account has been permanently deleted. Goodbye!",
  },

  selfExamReminder: {
    uz: "🎗 Oylik eslatma: o'z-o'zini ko'krak tekshiruvini unutmang!\n\nHar oy bir xil kunda ko'zguda va yotgan holda ko'krakni aylana harakatlar bilan tekshiring — shakl, o'lcham yoki teri o'zgarishiga e'tibor bering. Batafsil qo'llanma saytda mavjud.\n\nShuningdek, muntazam xavf testidan o'tishni ham unutmang.",
    ru: "🎗 Ежемесячное напоминание: не забывайте о самообследовании груди!\n\nКаждый месяц в один и тот же день проверяйте грудь перед зеркалом и лёжа круговыми движениями — обращайте внимание на изменение формы, размера или кожи. Подробное руководство есть на сайте.\n\nТакже не забывайте регулярно проходить тест на риск.",
    en: "🎗 Monthly reminder: don't forget your breast self-exam!\n\nEach month, on the same date, check your breasts in the mirror and lying down using circular motions — watch for any change in shape, size, or skin. A detailed guide is on the site.\n\nAlso remember to retake the risk test regularly.",
  },
  retestReminder: {
    uz: 'Salom, {name}! Oxirgi MammoAI testingizdan {days} kundan ko\'proq vaqt o\'tdi. Muntazam nazorat uchun qayta test topshirishni tavsiya qilamiz — pastdagi "{testBtn}" tugmasini bosing.',
    ru: 'Здравствуйте, {name}! С момента последнего теста MammoAI прошло более {days} дней. Для регулярного контроля рекомендуем пройти тест повторно — нажмите кнопку "{testBtn}" ниже.',
    en: 'Hello, {name}! It\'s been more than {days} days since your last MammoAI test. For regular monitoring, we recommend retaking it — tap the "{testBtn}" button below.',
  },
};

function tr(key, lang, vars) {
  const entry = MSG[key];
  let s = (entry && (entry[lang] || entry.uz)) ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

const RISK_LABEL = {
  past: { uz: "Past xavf", ru: "Низкий риск", en: "Low risk" },
  orta: { uz: "O'rta xavf", ru: "Средний риск", en: "Medium risk" },
  yuqori: { uz: "Yuqori xavf", ru: "Высокий риск", en: "High risk" },
};
const RISK_DESCRIPTION = {
  past: {
    uz: "Hozircha aniqlangan xavf omillari kam. Baribir yiliga bir marta profilaktik ko'rikdan o'ting.",
    ru: "Пока выявлено мало факторов риска. Тем не менее проходите профилактический осмотр раз в год.",
    en: "Few risk factors have been identified so far. Still, get a preventive checkup once a year.",
  },
  orta: {
    uz: "Ba'zi xavf omillari aniqlandi. Yaqin orada mutaxassis shifokor ko'rigidan o'tishingiz tavsiya etiladi.",
    ru: "Выявлены некоторые факторы риска. Рекомендуется в ближайшее время пройти осмотр у специалиста.",
    en: "Some risk factors were identified. We recommend seeing a specialist soon.",
  },
  yuqori: {
    uz: "Bir nechta muhim xavf omili aniqlandi. Iloji boricha tezroq onkolog-mammolog shifokorga murojaat qiling.",
    ru: "Выявлено несколько значимых факторов риска. По возможности как можно скорее обратитесь к врачу-онкологу-маммологу.",
    en: "Several significant risk factors were identified. Please see an oncologist/mammologist as soon as possible.",
  },
};

// ---------------------------------------------------------------------------
// Buttons — every persistent-menu / reply-keyboard label, in all three
// languages, with a reverse lookup so a tap is recognized regardless of
// which language it was rendered in (a stale keyboard from before a
// language switch should still work).
// ---------------------------------------------------------------------------

const BTN_DEFS = {
  signup: { uz: "📝 Ro'yxatdan o'tish", ru: "📝 Регистрация", en: "📝 Sign up" },
  test: { uz: "🧪 Test topshirish", ru: "🧪 Пройти тест", en: "🧪 Take the test" },
  profile: { uz: "👤 Profilim", ru: "👤 Профиль", en: "👤 Profile" },
  result: { uz: "📊 Natijam", ru: "📊 Мой результат", en: "📊 My result" },
  language: { uz: "🌐 Til", ru: "🌐 Язык", en: "🌐 Language" },
  help: { uz: "ℹ️ Yordam", ru: "ℹ️ Помощь", en: "ℹ️ Help" },
  cancel: { uz: "❌ Bekor qilish", ru: "❌ Отмена", en: "❌ Cancel" },
  skipPhone: { uz: "Telefon kiritmayman", ru: "Не указывать телефон", en: "Skip phone number" },
};

function btn(action, lang) {
  return BTN_DEFS[action][lang] || BTN_DEFS[action].uz;
}

function matchButtonAction(text) {
  for (const [action, variants] of Object.entries(BTN_DEFS)) {
    if (Object.values(variants).includes(text)) return action;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Date formatting — hand-written month names (mirrors src/lib/format.ts;
// Node's bundled ICU data doesn't carry full Uzbek month names).
// ---------------------------------------------------------------------------

const MONTHS = {
  uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

function formatDate(iso, lang) {
  const [y, m, d] = iso.split("-").map(Number);
  const month = MONTHS[lang][m - 1];
  if (lang === "en") return `${month} ${d}, ${y}`;
  if (lang === "ru") return `${d} ${month} ${y}`;
  return `${d}-${month}, ${y}`;
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
// DB helpers (raw SQL — this script is standalone, doesn't share the TS
// server/ modules, so the handful of queries it needs are duplicated here)
// ---------------------------------------------------------------------------

function getSetting(key) {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row?.value ?? null;
}

function getChatLang(chatId) {
  const row = db.prepare("SELECT lang FROM telegram_prefs WHERE chat_id = ?").get(String(chatId));
  return row?.lang || "uz";
}

function setChatLang(chatId, lang) {
  db.prepare(
    "INSERT INTO telegram_prefs (chat_id, lang) VALUES (?, ?) ON CONFLICT(chat_id) DO UPDATE SET lang = excluded.lang"
  ).run(String(chatId), lang);
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

function unlinkTelegram(userId) {
  db.prepare("UPDATE users SET telegram_chat_id = NULL WHERE id = ?").run(userId);
}

function deleteAccount(userId) {
  // Belt-and-suspenders: FK cascade (foreign_keys=ON above) already removes
  // quiz_attempts, but this keeps the intent explicit and works even if a
  // future connection forgets the pragma.
  db.prepare("DELETE FROM quiz_attempts WHERE user_id = ?").run(userId);
  db.prepare("DELETE FROM users WHERE id = ?").run(userId);
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
  const base = [
    { command: "start", description: { uz: "Boshlash / bosh menyu", ru: "Начать / главное меню", en: "Start / main menu" } },
    { command: "test", description: { uz: "Xavf testini boshlash", ru: "Начать тест на риск", en: "Start the risk test" } },
    { command: "natija", description: { uz: "So'nggi natijangizni ko'rish", ru: "Посмотреть последний результат", en: "View your latest result" } },
    { command: "profil", description: { uz: "Profilingiz", ru: "Ваш профиль", en: "Your profile" } },
    { command: "til", description: { uz: "Tilni almashtirish", ru: "Сменить язык", en: "Switch language" } },
    { command: "yordam", description: { uz: "Yordam", ru: "Помощь", en: "Help" } },
  ];
  for (const lang of ["uz", "ru", "en"]) {
    await api(token, "setMyCommands", {
      language_code: lang === "uz" ? undefined : lang,
      commands: base.map((c) => ({ command: c.command, description: c.description[lang] })),
    }).catch(() => {});
  }
}

function mainMenu(lang, isLinked) {
  const rows = isLinked
    ? [[btn("test", lang), btn("result", lang)], [btn("profile", lang)], [btn("language", lang), btn("help", lang)]]
    : [[btn("signup", lang)], [btn("language", lang), btn("help", lang)]];
  return { keyboard: rows.map((r) => r.map((text) => ({ text }))), resize_keyboard: true, is_persistent: true };
}

function cancelKeyboard(lang) {
  return { keyboard: [[{ text: btn("cancel", lang) }]], resize_keyboard: true };
}

async function sendMainMenu(token, chatId, text, lang, isLinked) {
  await sendMessage(token, chatId, text, mainMenu(lang, isLinked));
}

function languageKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "🇺🇿 O'zbekcha", callback_data: "lang:uz" }],
      [{ text: "🇷🇺 Русский", callback_data: "lang:ru" }],
      [{ text: "🇬🇧 English", callback_data: "lang:en" }],
    ],
  };
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

async function sendQuestion(token, chatId, session, lang) {
  const q = session.questions[session.index];
  const keyboard = q.options.map((o, i) => [{ text: o.text, callback_data: `a:${session.index}:${i}` }]);
  const header = `📋 ${tr("questionLabel", lang)} ${session.index + 1}/${session.questions.length}${q.category ? ` · ${q.category}` : ""}`;
  session.lastMessageId = await sendMessage(token, chatId, `${header}\n\n${q.text}`, { inline_keyboard: keyboard });
}

async function startQuiz(token, chatId, user, lang) {
  const questions = getOrderedQuestions();
  if (questions.length === 0) {
    await sendMessage(token, chatId, tr("noQuestions", lang));
    return;
  }
  const session = { type: "quiz", userId: user.id, questions, index: 0, answers: [] };
  sessions.set(chatId, session);
  await sendMessage(token, chatId, tr("quizStart", lang));
  await sendQuestion(token, chatId, session, lang);
}

function formatResult(result, lang) {
  return [
    tr("resultLine", lang, { percent: result.percent, total: result.totalScore, max: result.maxScore }),
    tr("riskLine", lang, { risk: RISK_LABEL[result.riskLevel][lang] }),
    "",
    RISK_DESCRIPTION[result.riskLevel][lang],
    "",
    tr("resultDisclaimer", lang),
  ].join("\n");
}

async function finishQuiz(token, chatId, session, lang) {
  const result = saveAttempt(session.userId, session.questions, session.answers);
  resetSession(chatId);
  await sendMessage(token, chatId, `${tr("quizFinished", lang)}\n\n${formatResult(result, lang)}`);
  await sendMainMenu(token, chatId, tr("whatNext", lang), lang, true);
}

async function handleQuizCallback(token, chatId, session, data, callbackQueryId, lang) {
  const match = data.match(/^a:(\d+):(\d+)$/);
  if (!match) {
    await answerCallback(token, callbackQueryId, "");
    return;
  }
  const qIndex = Number(match[1]);
  const oIndex = Number(match[2]);
  if (session.index !== qIndex) {
    await answerCallback(token, callbackQueryId, tr("quizStale", lang));
    return;
  }
  const question = session.questions[qIndex];
  const option = question.options[oIndex];
  if (!option) {
    await answerCallback(token, callbackQueryId, tr("quizBadOption", lang));
    return;
  }
  session.answers.push({ questionId: question.id, optionId: option.id, score: option.score });
  await answerCallback(token, callbackQueryId, `✓ ${option.text}`);
  await clearButtons(token, chatId, session.lastMessageId);

  session.index += 1;
  if (session.index < session.questions.length) {
    await sendQuestion(token, chatId, session, lang);
  } else {
    await finishQuiz(token, chatId, session, lang);
  }
}

// --- Sign up ------------------------------------------------------------

const SIGNUP_STEPS = ["firstName", "lastName", "email", "password", "birthDate", "passportSeries", "phone"];
const SIGNUP_PROMPT_KEY = {
  firstName: "promptFirstName",
  lastName: "promptLastName",
  email: "promptEmail",
  password: "promptPassword",
  birthDate: "promptBirthDate",
  passportSeries: "promptPassportSeries",
  phone: "promptPhone",
};

async function startSignup(token, chatId, lang) {
  sessions.set(chatId, { type: "signup", step: 0, data: {} });
  await sendMessage(token, chatId, tr("signupIntro", lang, { cancelBtn: btn("cancel", lang) }), cancelKeyboard(lang));
  await sendMessage(token, chatId, tr(SIGNUP_PROMPT_KEY[SIGNUP_STEPS[0]], lang));
}

async function handleSignupStep(token, chatId, session, text, lang) {
  const field = SIGNUP_STEPS[session.step];
  const value = text.trim();

  if (field === "firstName" || field === "lastName") {
    if (!value) {
      await sendMessage(token, chatId, tr("errEmpty", lang));
      return;
    }
    session.data[field] = value;
  } else if (field === "email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      await sendMessage(token, chatId, tr("errEmailInvalid", lang));
      return;
    }
    if (getUserByEmail(value)) {
      await sendMessage(token, chatId, tr("errEmailTaken", lang));
      return;
    }
    session.data.email = value.toLowerCase();
  } else if (field === "password") {
    if (value.length < 6) {
      await sendMessage(token, chatId, tr("errPasswordShort", lang));
      return;
    }
    session.data.password = value;
  } else if (field === "birthDate") {
    const iso = parseBirthDate(value);
    if (!iso) {
      await sendMessage(token, chatId, tr("errBirthDateFormat", lang));
      return;
    }
    session.data.birthDate = iso;
  } else if (field === "passportSeries") {
    if (value.length < 5) {
      await sendMessage(token, chatId, tr("errPassportShort", lang));
      return;
    }
    session.data.passportSeries = value.toUpperCase();
  } else if (field === "phone") {
    session.data.phone = matchButtonAction(value) === "skipPhone" ? "" : value;
  }

  session.step += 1;

  if (session.step >= SIGNUP_STEPS.length) {
    const user = createUserFromBot(session.data, chatId);
    resetSession(chatId);
    await sendMessage(token, chatId, tr("signupSuccess", lang, { name: user.first_name }));
    await sendMainMenu(token, chatId, tr("nowWhat", lang), lang, true);
    return;
  }

  const nextField = SIGNUP_STEPS[session.step];
  const replyMarkup =
    nextField === "phone"
      ? { keyboard: [[{ text: btn("skipPhone", lang) }], [{ text: btn("cancel", lang) }]], resize_keyboard: true }
      : cancelKeyboard(lang);
  await sendMessage(token, chatId, tr(SIGNUP_PROMPT_KEY[nextField], lang), replyMarkup);
}

// --- Profile --------------------------------------------------------------

function profileEditKeyboard(lang) {
  return {
    inline_keyboard: [
      [
        { text: tr("fieldFirstName", lang), callback_data: "ef:firstName" },
        { text: tr("fieldLastName", lang), callback_data: "ef:lastName" },
      ],
      [
        { text: tr("fieldPhone", lang), callback_data: "ef:phone" },
        { text: tr("fieldBirthDate", lang), callback_data: "ef:birthDate" },
      ],
      [{ text: tr("fieldPassportSeries", lang), callback_data: "ef:passportSeries" }],
      [{ text: btn("language", lang), callback_data: "ac:lang" }],
      [{ text: "🔌", callback_data: "ac:unlink" }, { text: "🗑", callback_data: "ac:delete" }],
    ],
  };
}

async function sendProfile(token, chatId, user, lang) {
  const lines = [
    tr("profileHeader", lang),
    "",
    `${tr("fieldFirstName", lang)}: ${user.first_name}`,
    `${tr("fieldLastName", lang)}: ${user.last_name}`,
    `${tr("fieldEmail", lang)}: ${user.email}`,
    `${tr("fieldPhone", lang)}: ${user.phone || "—"}`,
    `${tr("fieldBirthDate", lang)}: ${formatDate(user.birth_date, lang)}`,
    `${tr("fieldPassportSeries", lang)}: ${user.passport_series}`,
    "",
    tr("profileEditPrompt", lang),
  ];
  await sendMessage(token, chatId, lines.join("\n"), profileEditKeyboard(lang));
}

const EDIT_FIELD_PROMPT_KEY = {
  firstName: "editFirstNamePrompt",
  lastName: "editLastNamePrompt",
  phone: "editPhonePrompt",
  birthDate: "editBirthDatePrompt",
  passportSeries: "editPassportSeriesPrompt",
};

async function handleEditFieldCallback(token, chatId, data, callbackQueryId, lang) {
  const field = data.slice(3); // "ef:firstName" -> "firstName"
  if (!EDIT_FIELD_PROMPT_KEY[field]) {
    await answerCallback(token, callbackQueryId, "");
    return;
  }
  await answerCallback(token, callbackQueryId, "");
  sessions.set(chatId, { type: "editField", field });
  await sendMessage(token, chatId, tr(EDIT_FIELD_PROMPT_KEY[field], lang), cancelKeyboard(lang));
}

async function handleEditFieldStep(token, chatId, session, user, text, lang) {
  const { field } = session;
  const value = text.trim();

  if (field === "firstName" || field === "lastName") {
    if (!value) {
      await sendMessage(token, chatId, tr("errEmpty", lang));
      return;
    }
    updateProfileField(user.id, field, value);
  } else if (field === "phone") {
    updateProfileField(user.id, field, value);
  } else if (field === "birthDate") {
    const iso = parseBirthDate(value);
    if (!iso) {
      await sendMessage(token, chatId, tr("errBirthDateFormat", lang));
      return;
    }
    updateProfileField(user.id, field, iso);
  } else if (field === "passportSeries") {
    if (value.length < 5) {
      await sendMessage(token, chatId, tr("errPassportShort", lang));
      return;
    }
    updateProfileField(user.id, field, value.toUpperCase());
  }

  resetSession(chatId);
  await sendMessage(token, chatId, tr("savedOk", lang));
  await sendProfile(token, chatId, getUserByChatId(chatId), lang);
}

// --- Account actions (language / unlink / delete), all confirmed via an
// inline Yes/No pair before anything destructive happens. -------------------

function confirmKeyboard(action, lang) {
  const yes = { uz: "✅ Ha, tasdiqlayman", ru: "✅ Да, подтверждаю", en: "✅ Yes, confirm" }[lang];
  const no = { uz: "↩️ Yo'q, bekor qilish", ru: "↩️ Нет, отмена", en: "↩️ No, cancel" }[lang];
  return { inline_keyboard: [[{ text: yes, callback_data: `cf:${action}:yes` }, { text: no, callback_data: `cf:${action}:no` }]] };
}

async function handleAccountActionCallback(token, chatId, data, callbackQueryId, lang) {
  await answerCallback(token, callbackQueryId, "");
  if (data === "ac:lang") {
    await sendMessage(token, chatId, tr("chooseLanguage", lang), languageKeyboard());
    return;
  }
  if (data === "ac:unlink") {
    await sendMessage(token, chatId, tr("unlinkConfirmPrompt", lang), confirmKeyboard("unlink", lang));
    return;
  }
  if (data === "ac:delete") {
    await sendMessage(token, chatId, tr("deleteConfirmPrompt", lang), confirmKeyboard("delete", lang));
    return;
  }
}

async function handleConfirmCallback(token, chatId, data, callbackQueryId, lang) {
  const match = data.match(/^cf:(unlink|delete):(yes|no)$/);
  if (!match) {
    await answerCallback(token, callbackQueryId, "");
    return;
  }
  const [, action, choice] = match;
  await answerCallback(token, callbackQueryId, "");
  await clearButtons(token, chatId, null);

  if (choice === "no") {
    await sendMessage(token, chatId, tr("cancelled", lang));
    const user = getUserByChatId(chatId);
    if (user) await sendProfile(token, chatId, user, lang);
    return;
  }

  const user = getUserByChatId(chatId);
  if (!user) return;

  if (action === "unlink") {
    unlinkTelegram(user.id);
    await sendMessage(token, chatId, tr("unlinkDone", lang));
    await sendMainMenu(token, chatId, tr("whatNext", lang), lang, false);
  } else if (action === "delete") {
    deleteAccount(user.id);
    await sendMessage(token, chatId, tr("deleteDone", lang));
    await sendMainMenu(token, chatId, tr("whatNext", lang), lang, false);
  }
}

async function handleLanguageCallback(token, chatId, data, callbackQueryId) {
  const match = data.match(/^lang:(uz|ru|en)$/);
  if (!match) {
    await answerCallback(token, callbackQueryId, "");
    return;
  }
  const lang = match[1];
  setChatLang(chatId, lang);
  await answerCallback(token, callbackQueryId, "✓");
  await sendMessage(token, chatId, tr("languageChanged", lang));
  const user = getUserByChatId(chatId);
  await sendMainMenu(token, chatId, user ? tr("welcomeBack", lang, { name: user.first_name }) : tr("welcomeNew", lang), lang, Boolean(user));
}

// ---------------------------------------------------------------------------
// Update routing
// ---------------------------------------------------------------------------

async function handleCallback(token, callbackQuery) {
  const chatId = callbackQuery.message?.chat?.id;
  const data = callbackQuery.data ?? "";
  if (!chatId) return;

  const lang = getChatLang(chatId);
  const session = sessions.get(chatId);

  if (data.startsWith("a:")) {
    if (session?.type === "quiz") {
      await handleQuizCallback(token, chatId, session, data, callbackQuery.id, lang);
    } else {
      await answerCallback(token, callbackQuery.id, tr("quizSessionExpired", lang));
    }
    return;
  }

  if (data.startsWith("ef:")) {
    await handleEditFieldCallback(token, chatId, data, callbackQuery.id, lang);
    return;
  }

  if (data.startsWith("ac:")) {
    await handleAccountActionCallback(token, chatId, data, callbackQuery.id, lang);
    return;
  }

  if (data.startsWith("cf:")) {
    await handleConfirmCallback(token, chatId, data, callbackQuery.id, lang);
    return;
  }

  if (data.startsWith("lang:")) {
    await handleLanguageCallback(token, chatId, data, callbackQuery.id);
    return;
  }

  await answerCallback(token, callbackQuery.id, "");
}

async function handleMessage(token, message) {
  const chatId = message.chat.id;
  const text = (message.text ?? "").trim();
  const lang = getChatLang(chatId);
  const session = sessions.get(chatId);
  const action = matchButtonAction(text);

  // Cancel always works, from anywhere.
  if (action === "cancel" || text === "/bekor" || text === "/cancel") {
    resetSession(chatId);
    const user = getUserByChatId(chatId);
    await sendMainMenu(token, chatId, tr("cancelled", lang), lang, Boolean(user));
    return;
  }

  // Mid-flow input takes priority over menu/commands.
  if (session?.type === "signup") {
    await handleSignupStep(token, chatId, session, text, lang);
    return;
  }
  if (session?.type === "editField") {
    const user = getUserByChatId(chatId);
    if (!user) {
      resetSession(chatId);
      return;
    }
    await handleEditFieldStep(token, chatId, session, user, text, lang);
    return;
  }

  const startMatch = text.match(/^\/start(?:\s+(\S+))?/);
  if (startMatch?.[1]) {
    // Linking flow from the website's profile page ("Connect Telegram" button).
    const linkToken = startMatch[1];
    const user = db.prepare("SELECT id, first_name FROM users WHERE telegram_link_token = ?").get(linkToken);
    if (!user) {
      await sendMessage(token, chatId, tr("linkTokenInvalid", lang));
      return;
    }
    db.prepare("UPDATE users SET telegram_chat_id = ?, telegram_link_token = NULL WHERE id = ?").run(String(chatId), user.id);
    await sendMainMenu(token, chatId, tr("linkedGreeting", lang, { name: user.first_name }), lang, true);
    return;
  }

  const user = getUserByChatId(chatId);

  if (startMatch || text === "/menu") {
    await sendMainMenu(
      token,
      chatId,
      user ? tr("welcomeBack", lang, { name: user.first_name }) : tr("welcomeNew", lang),
      lang,
      Boolean(user)
    );
    return;
  }

  if (action === "language" || text === "/til" || text === "/language") {
    await sendMessage(token, chatId, tr("chooseLanguage", lang), languageKeyboard());
    return;
  }

  if (action === "signup" || text === "/royxatdan_otish") {
    if (user) {
      await sendMainMenu(token, chatId, tr("alreadyRegistered", lang), lang, true);
      return;
    }
    await startSignup(token, chatId, lang);
    return;
  }

  if (action === "test" || text === "/test") {
    if (!user) {
      await sendMessage(token, chatId, tr("needAccountForTest", lang));
      await sendMainMenu(token, chatId, "", lang, false);
      return;
    }
    await startQuiz(token, chatId, user, lang);
    return;
  }

  if (action === "result" || text === "/natija" || text === "/natijam") {
    if (!user) {
      await sendMainMenu(token, chatId, tr("needAccountGeneric", lang), lang, false);
      return;
    }
    const latest = getLatestAttempt(user.id);
    if (!latest) {
      await sendMessage(token, chatId, tr("noAttemptsYet", lang));
      await sendMainMenu(token, chatId, "", lang, true);
      return;
    }
    await sendMessage(
      token,
      chatId,
      `${tr("latestResultHeader", lang)}\n\n${formatResult(
        { percent: latest.percent, riskLevel: latest.risk_level, totalScore: latest.total_score, maxScore: latest.max_score },
        lang
      )}`
    );
    return;
  }

  if (action === "profile" || text === "/profil") {
    if (!user) {
      await sendMainMenu(token, chatId, tr("needAccountGeneric", lang), lang, false);
      return;
    }
    await sendProfile(token, chatId, user, lang);
    return;
  }

  if (action === "help" || text === "/yordam" || text === "/help") {
    await sendMainMenu(token, chatId, tr("helpText", lang), lang, Boolean(user));
    return;
  }

  await sendMainMenu(token, chatId, tr("unknownCommand", lang), lang, Boolean(user));
}

// ---------------------------------------------------------------------------
// Reminders — two independent cadences: a 90-day retest nudge (only once the
// user has actually taken the test), and a monthly self-exam nudge (for
// every linked user, regardless of test history).
// ---------------------------------------------------------------------------

async function checkReminders(token) {
  const now = Date.now();
  const retestCutoff = new Date(now - RETEST_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const retestCooldownCutoff = new Date(now - RETEST_COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const selfExamCutoff = new Date(now - SELF_EXAM_INTERVAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const rows = db
    .prepare(
      `SELECT u.id, u.first_name, u.telegram_chat_id, u.created_at,
        u.last_reminder_sent_at, u.last_self_exam_reminder_sent_at,
        (SELECT created_at FROM quiz_attempts a WHERE a.user_id = u.id ORDER BY a.created_at DESC LIMIT 1) AS latest_at
       FROM users u
       WHERE u.telegram_chat_id IS NOT NULL`
    )
    .all();

  let retestSent = 0;
  let selfExamSent = 0;

  for (const u of rows) {
    const lang = getChatLang(u.telegram_chat_id);

    const retestDue =
      u.latest_at &&
      u.latest_at < retestCutoff &&
      (u.last_reminder_sent_at === null || u.last_reminder_sent_at < retestCooldownCutoff);
    if (retestDue) {
      await sendMessage(
        token,
        u.telegram_chat_id,
        tr("retestReminder", lang, { name: u.first_name, days: RETEST_DAYS, testBtn: btn("test", lang) }),
        mainMenu(lang, true)
      );
      db.prepare("UPDATE users SET last_reminder_sent_at = ? WHERE id = ?").run(new Date().toISOString(), u.id);
      retestSent += 1;
    }

    const selfExamBaseline = u.last_self_exam_reminder_sent_at ?? u.created_at;
    const selfExamDue = selfExamBaseline && selfExamBaseline < selfExamCutoff;
    if (selfExamDue) {
      await sendMessage(token, u.telegram_chat_id, tr("selfExamReminder", lang), mainMenu(lang, true));
      db.prepare("UPDATE users SET last_self_exam_reminder_sent_at = ? WHERE id = ?").run(new Date().toISOString(), u.id);
      selfExamSent += 1;
    }
  }

  if (retestSent || selfExamSent) {
    console.log(`[${new Date().toISOString()}] reminders sent — retest: ${retestSent}, self-exam: ${selfExamSent}`);
  }
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
