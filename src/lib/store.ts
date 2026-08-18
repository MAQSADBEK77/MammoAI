import type { QuizAttempt, QuizQuestion, User } from "./types";

/**
 * Thin client for the app's own API routes (src/app/api/**), which persist
 * everything in a server-side SQLite database (see src/server/db.ts). All
 * data lives on the server now — the browser holds nothing but a session
 * cookie.
 */

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "Xatolik yuz berdi.");
  }
  return data as T;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface SignUpInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  birthDate: string;
  passportSeries: string;
  phone?: string;
}

export async function apiSignUp(input: SignUpInput): Promise<User> {
  const { user } = await apiFetch<{ user: User }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return user;
}

export async function apiLogin(email: string, password: string): Promise<User> {
  const { user } = await apiFetch<{ user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return user;
}

export async function apiLogout(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" });
}

export async function apiMe(): Promise<User | null> {
  const { user } = await apiFetch<{ user: User | null }>("/api/auth/me");
  return user;
}

export async function apiUpdateProfile(
  patch: Partial<Pick<User, "firstName" | "lastName" | "birthDate" | "passportSeries" | "phone">>
): Promise<User> {
  const { user } = await apiFetch<{ user: User }>("/api/profile", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return user;
}

export async function apiChangePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiFetch("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function apiResetPassword(input: {
  email: string;
  passportSeries: string;
  birthDate: string;
  newPassword: string;
}): Promise<void> {
  await apiFetch("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ---------------------------------------------------------------------------
// Telegram reminders
// ---------------------------------------------------------------------------

export interface TelegramStatus {
  configured: boolean;
  connected: boolean;
  botUsername: string | null;
}

export async function apiGetTelegramStatus(): Promise<TelegramStatus> {
  return apiFetch<TelegramStatus>("/api/telegram/status");
}

export async function apiLinkTelegram(): Promise<{ token: string; botUsername: string | null }> {
  return apiFetch("/api/telegram/link", { method: "POST" });
}

export async function apiUnlinkTelegram(): Promise<void> {
  await apiFetch("/api/telegram/unlink", { method: "POST" });
}

// ---------------------------------------------------------------------------
// Quiz questions
// ---------------------------------------------------------------------------

export async function apiGetQuestions(): Promise<QuizQuestion[]> {
  const { questions } = await apiFetch<{ questions: QuizQuestion[] }>("/api/quiz/questions");
  return questions;
}

export type QuestionInput = Omit<QuizQuestion, "id">;

export async function apiCreateQuestion(data: QuestionInput): Promise<QuizQuestion> {
  const { question } = await apiFetch<{ question: QuizQuestion }>("/api/quiz/questions", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return question;
}

export async function apiUpdateQuestion(id: string, data: QuestionInput): Promise<QuizQuestion> {
  const { question } = await apiFetch<{ question: QuizQuestion }>(`/api/quiz/questions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return question;
}

export async function apiDeleteQuestion(id: string): Promise<void> {
  await apiFetch(`/api/quiz/questions/${id}`, { method: "DELETE" });
}

export async function apiReorderQuestions(ids: string[]): Promise<void> {
  await apiFetch("/api/quiz/questions/reorder", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
}

// ---------------------------------------------------------------------------
// Quiz attempts
// ---------------------------------------------------------------------------

export async function apiSubmitAttempt(
  answers: { questionId: string; optionId: string }[]
): Promise<QuizAttempt> {
  const { attempt } = await apiFetch<{ attempt: QuizAttempt }>("/api/quiz/attempts", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
  return attempt;
}

export async function apiGetMyAttempts(): Promise<QuizAttempt[]> {
  const { attempts } = await apiFetch<{ attempts: QuizAttempt[] }>("/api/quiz/attempts");
  return attempts;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export interface AdminUser extends User {
  latestAttempt: { percent: number; riskLevel: QuizAttempt["riskLevel"]; createdAt: string } | null;
}

export async function apiGetAdminUsers(): Promise<AdminUser[]> {
  const { users } = await apiFetch<{ users: AdminUser[] }>("/api/admin/users");
  return users;
}

export async function apiDeleteUser(id: string): Promise<void> {
  await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
}

export async function apiGetAdminAttempts(): Promise<QuizAttempt[]> {
  const { attempts } = await apiFetch<{ attempts: QuizAttempt[] }>("/api/admin/attempts");
  return attempts;
}

export interface AdminTelegramSettings {
  configured: boolean;
  botUsername: string | null;
}

export async function apiGetAdminTelegramSettings(): Promise<AdminTelegramSettings> {
  return apiFetch<AdminTelegramSettings>("/api/admin/settings/telegram");
}

export async function apiSaveAdminTelegramBot(token: string): Promise<{ botUsername: string }> {
  return apiFetch("/api/admin/settings/telegram", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function apiDisconnectAdminTelegramBot(): Promise<void> {
  await apiFetch("/api/admin/settings/telegram", { method: "DELETE" });
}

