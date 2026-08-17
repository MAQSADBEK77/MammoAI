import type { QuizAttempt, QuizQuestion, RiskLevel, User } from "./types";

/**
 * Prototype data layer.
 *
 * Everything lives in the browser's localStorage so the product can be
 * demoed end-to-end (sign up → test → admin panel) without a backend yet.
 * The API surface (getUsers/createUser/... ) is deliberately shaped like a
 * thin table wrapper so it can be swapped for real Supabase calls later
 * without touching the UI code.
 */

const KEYS = {
  users: "mammoai:users",
  questions: "mammoai:questions",
  attempts: "mammoai:attempts",
  session: "mammoai:session",
  seeded: "mammoai:seeded",
} as const;

function isBrowser() {
  return typeof window !== "undefined";
}

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const DEFAULT_QUESTIONS: QuizQuestion[] = [
  {
    id: uid("q"),
    order: 1,
    category: "Umumiy ma'lumot",
    text: "Yoshingiz nechida?",
    options: [
      { id: uid("o"), text: "30 yoshgacha", score: 0 },
      { id: uid("o"), text: "30–39 yosh", score: 1 },
      { id: uid("o"), text: "40–49 yosh", score: 2 },
      { id: uid("o"), text: "50 yosh va undan katta", score: 3 },
    ],
  },
  {
    id: uid("q"),
    order: 2,
    category: "Oilaviy tarix",
    text: "Oilangizda (ona, opa-singil, buvi) ko'krak saratoni tarixi bo'lganmi?",
    options: [
      { id: uid("o"), text: "Yo'q", score: 0 },
      { id: uid("o"), text: "Uzoq qarindoshda bo'lgan", score: 1 },
      { id: uid("o"), text: "Yaqin qarindoshda bo'lgan", score: 3 },
    ],
  },
  {
    id: uid("q"),
    order: 3,
    category: "Alomatlar",
    text: "Ko'kragingizda shish yoki tugun sezganmisiz?",
    options: [
      { id: uid("o"), text: "Yo'q", score: 0 },
      { id: uid("o"), text: "Ha", score: 3 },
    ],
  },
  {
    id: uid("q"),
    order: 4,
    category: "Alomatlar",
    text: "Ko'krak shakli, o'lchami yoki teri rangida so'nggi paytda o'zgarish kuzatdingizmi?",
    options: [
      { id: uid("o"), text: "Yo'q", score: 0 },
      { id: uid("o"), text: "Ha", score: 2 },
    ],
  },
  {
    id: uid("q"),
    order: 5,
    category: "Alomatlar",
    text: "Ko'krak uchidan sut bilan bog'liq bo'lmagan suyuqlik ajralishi bormi?",
    options: [
      { id: uid("o"), text: "Yo'q", score: 0 },
      { id: uid("o"), text: "Ha", score: 2 },
    ],
  },
  {
    id: uid("q"),
    order: 6,
    category: "Alomatlar",
    text: "Qo'ltiq ostida shish yoki og'riq sezyapsizmi?",
    options: [
      { id: uid("o"), text: "Yo'q", score: 0 },
      { id: uid("o"), text: "Ha", score: 2 },
    ],
  },
  {
    id: uid("q"),
    order: 7,
    category: "Gormonal omillar",
    text: "Uzoq muddat gormonal terapiya yoki kontratseptiv vositalar qabul qilganmisiz?",
    options: [
      { id: uid("o"), text: "Yo'q", score: 0 },
      { id: uid("o"), text: "Ha", score: 1 },
    ],
  },
  {
    id: uid("q"),
    order: 8,
    category: "Gormonal omillar",
    text: "Birinchi hayz 12 yoshgacha boshlangan yoki menopauza 55 yoshdan keyin kelganmi?",
    options: [
      { id: uid("o"), text: "Yo'q", score: 0 },
      { id: uid("o"), text: "Ha", score: 1 },
    ],
  },
  {
    id: uid("q"),
    order: 9,
    category: "Turmush tarzi",
    text: "Chekasizmi yoki muntazam alkogol iste'mol qilasizmi?",
    options: [
      { id: uid("o"), text: "Yo'q", score: 0 },
      { id: uid("o"), text: "Ha", score: 1 },
    ],
  },
  {
    id: uid("q"),
    order: 10,
    category: "Turmush tarzi",
    text: "Haftasiga kamida 3 marta jismoniy faollik bilan shug'ullanasizmi?",
    options: [
      { id: uid("o"), text: "Ha", score: 0 },
      { id: uid("o"), text: "Yo'q", score: 1 },
    ],
  },
];

function seedIfNeeded() {
  if (!isBrowser()) return;
  if (read<boolean>(KEYS.seeded, false)) return;

  const adminUser: User = {
    id: uid("u"),
    email: "admin@mammoai.uz",
    password: "admin123",
    role: "admin",
    firstName: "Admin",
    lastName: "MammoAI",
    birthDate: "1990-01-01",
    passportSeries: "AA0000000",
    phone: "",
    createdAt: new Date().toISOString(),
  };

  write(KEYS.users, [adminUser]);
  write(KEYS.questions, DEFAULT_QUESTIONS);
  write(KEYS.attempts, []);
  write(KEYS.seeded, true);
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export function getUsers(): User[] {
  seedIfNeeded();
  return read<User[]>(KEYS.users, []);
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id);
}

export function getUserByEmail(email: string): User | undefined {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser(input: Omit<User, "id" | "role" | "createdAt">): User {
  const users = getUsers();
  if (users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error("Bu email allaqachon ro'yxatdan o'tgan.");
  }
  const user: User = {
    ...input,
    id: uid("u"),
    role: "user",
    createdAt: new Date().toISOString(),
  };
  write(KEYS.users, [...users, user]);
  return user;
}

export function updateUser(id: string, patch: Partial<User>): User | undefined {
  const users = getUsers();
  let updated: User | undefined;
  const next = users.map((u) => {
    if (u.id !== id) return u;
    updated = { ...u, ...patch, id: u.id };
    return updated;
  });
  write(KEYS.users, next);
  return updated;
}

export function deleteUser(id: string) {
  write(
    KEYS.users,
    getUsers().filter((u) => u.id !== id)
  );
  write(
    KEYS.attempts,
    getAttempts().filter((a) => a.userId !== id)
  );
}

// ---------------------------------------------------------------------------
// Quiz questions
// ---------------------------------------------------------------------------

export function getQuestions(): QuizQuestion[] {
  seedIfNeeded();
  return read<QuizQuestion[]>(KEYS.questions, []).sort((a, b) => a.order - b.order);
}

export function saveQuestion(question: QuizQuestion) {
  const questions = getQuestions();
  const exists = questions.some((q) => q.id === question.id);
  const next = exists
    ? questions.map((q) => (q.id === question.id ? question : q))
    : [...questions, question];
  write(KEYS.questions, next);
}

export function deleteQuestion(id: string) {
  write(
    KEYS.questions,
    getQuestions().filter((q) => q.id !== id)
  );
}

export function reorderQuestions(questions: QuizQuestion[]) {
  write(
    KEYS.questions,
    questions.map((q, i) => ({ ...q, order: i + 1 }))
  );
}

// ---------------------------------------------------------------------------
// Quiz attempts / risk scoring
// ---------------------------------------------------------------------------

export function getAttempts(): QuizAttempt[] {
  seedIfNeeded();
  return read<QuizAttempt[]>(KEYS.attempts, []);
}

export function getAttemptsForUser(userId: string): QuizAttempt[] {
  return getAttempts()
    .filter((a) => a.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getLatestAttemptForUser(userId: string): QuizAttempt | undefined {
  return getAttemptsForUser(userId)[0];
}

export function riskLevelFromPercent(percent: number): RiskLevel {
  if (percent < 34) return "past";
  if (percent < 67) return "orta";
  return "yuqori";
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  past: "Past xavf",
  orta: "O'rta xavf",
  yuqori: "Yuqori xavf",
};

export const RISK_DESCRIPTIONS: Record<RiskLevel, string> = {
  past:
    "Hozircha aniqlangan xavf omillari kam. Baribir yiliga bir marta profilaktik ko'rikdan o'ting.",
  orta:
    "Ba'zi xavf omillari aniqlandi. Yaqin orada mutaxassis shifokor ko'rigidan o'tishingiz tavsiya etiladi.",
  yuqori:
    "Bir nechta muhim xavf omili aniqlandi. Iloji boricha tezroq onkolog-mammolog shifokorga murojaat qiling.",
};

export function submitAttempt(
  userId: string,
  answers: { questionId: string; optionId: string; score: number }[]
): QuizAttempt {
  const questions = getQuestions();
  const maxScore = questions.reduce(
    (sum, q) => sum + Math.max(...q.options.map((o) => o.score), 0),
    0
  );
  const totalScore = answers.reduce((sum, a) => sum + a.score, 0);
  const percent = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const attempt: QuizAttempt = {
    id: uid("a"),
    userId,
    answers,
    totalScore,
    maxScore,
    percent,
    riskLevel: riskLevelFromPercent(percent),
    createdAt: new Date().toISOString(),
  };

  write(KEYS.attempts, [...getAttempts(), attempt]);
  return attempt;
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export function getSessionUserId(): string | null {
  return read<string | null>(KEYS.session, null);
}

export function setSessionUserId(id: string | null) {
  write(KEYS.session, id);
}
