export type Role = "user" | "admin";

export type RiskLevel = "past" | "orta" | "yuqori";

export interface User {
  id: string;
  email: string;
  password: string; // NOTE: plain text — prototype only, replace with real auth before launch
  role: Role;
  firstName: string;
  lastName: string;
  birthDate: string; // ISO date, e.g. 1990-05-12
  passportSeries: string; // e.g. AA1234567
  phone?: string;
  createdAt: string;
}

export type PublicUser = Omit<User, "password">;

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
  answers: QuizAnswer[];
  totalScore: number;
  maxScore: number;
  percent: number;
  riskLevel: RiskLevel;
  createdAt: string;
}
