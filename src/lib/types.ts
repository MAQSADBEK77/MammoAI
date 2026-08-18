export type Role = "user" | "admin";

export type RiskLevel = "past" | "orta" | "yuqori";

// The shape returned by the API — never includes a password/hash. The server
// keeps password hashes in its own row type (see src/server/db.ts).
export interface User {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  birthDate: string; // ISO date, e.g. 1990-05-12
  passportSeries: string; // e.g. AA1234567
  phone?: string;
  createdAt: string;
}

export interface QuizOption {
  id: string;
  text: string;
  score: number;
}

export interface QuizQuestion {
  id: string;
  order: number;
  text: string;
  category: string;
  options: QuizOption[];
}

export interface QuizAnswer {
  questionId: string;
  optionId: string;
  score: number;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  userFirstName?: string;
  userLastName?: string;
  answers: QuizAnswer[];
  totalScore: number;
  maxScore: number;
  percent: number;
  riskLevel: RiskLevel;
  createdAt: string;
}
