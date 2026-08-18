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
  referralCode?: string;
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

/** Password-free login via a 6-digit code the user gets from the Telegram bot. */
export async function apiTelegramCodeLogin(code: string): Promise<User> {
  const { user } = await apiFetch<{ user: User }>("/api/auth/telegram-login", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  return user;
}

/** Invalidates every other session for this account and re-issues a fresh one for this one. */
export async function apiLogoutEverywhere(): Promise<User> {
  const { user } = await apiFetch<{ user: User }>("/api/auth/logout-everywhere", { method: "POST" });
  return user;
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
  answers: { questionId: string; optionId: string }[],
  familyMemberId?: string | null
): Promise<QuizAttempt> {
  const { attempt } = await apiFetch<{ attempt: QuizAttempt }>("/api/quiz/attempts", {
    method: "POST",
    body: JSON.stringify({ answers, familyMemberId }),
  });
  return attempt;
}

// ---------------------------------------------------------------------------
// Family members
// ---------------------------------------------------------------------------

export interface FamilyMember {
  id: string;
  ownerUserId: string;
  firstName: string;
  lastName: string;
  relation: string;
  birthDate: string | null;
  createdAt: string;
}

export async function apiGetFamilyMembers(): Promise<FamilyMember[]> {
  const { members } = await apiFetch<{ members: FamilyMember[] }>("/api/family-members");
  return members;
}

export async function apiCreateFamilyMember(input: {
  firstName: string;
  lastName?: string;
  relation?: string;
  birthDate?: string;
}): Promise<FamilyMember> {
  const { member } = await apiFetch<{ member: FamilyMember }>("/api/family-members", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return member;
}

export async function apiDeleteFamilyMember(id: string): Promise<void> {
  await apiFetch(`/api/family-members/${id}`, { method: "DELETE" });
}

export async function apiGetFamilyMemberAttempts(id: string): Promise<QuizAttempt[]> {
  const { attempts } = await apiFetch<{ attempts: QuizAttempt[] }>(`/api/family-members/${id}/attempts`);
  return attempts;
}

// ---------------------------------------------------------------------------
// Self-exam calendar
// ---------------------------------------------------------------------------

export async function apiGetSelfExamMonths(): Promise<string[]> {
  const { months } = await apiFetch<{ months: string[] }>("/api/self-exam");
  return months;
}

export async function apiSetSelfExamDone(month: string, done: boolean): Promise<string[]> {
  const { months } = await apiFetch<{ months: string[] }>("/api/self-exam", {
    method: "POST",
    body: JSON.stringify({ month, done }),
  });
  return months;
}

// ---------------------------------------------------------------------------
// Referral
// ---------------------------------------------------------------------------

export async function apiGetReferral(): Promise<{ code: string; count: number }> {
  return apiFetch("/api/referral");
}

// ---------------------------------------------------------------------------
// FAQ, clinics, articles — public reads
// ---------------------------------------------------------------------------

export interface FaqItem {
  id: string;
  order: number;
  question: string;
  answer: string;
  translations?: Partial<Record<"ru" | "en", { question?: string; answer?: string }>>;
}

export async function apiGetFaq(): Promise<FaqItem[]> {
  const { items } = await apiFetch<{ items: FaqItem[] }>("/api/faq");
  return items;
}

export interface Clinic {
  id: string;
  order: number;
  name: string;
  address: string;
  phone: string;
  note: string;
}

export async function apiGetClinics(): Promise<Clinic[]> {
  const { clinics } = await apiFetch<{ clinics: Clinic[] }>("/api/clinics");
  return clinics;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  published: boolean;
  createdAt: string;
  videoUrl: string;
}

export async function apiGetArticles(): Promise<Article[]> {
  const { articles } = await apiFetch<{ articles: Article[] }>("/api/articles");
  return articles;
}

export async function apiGetArticle(slug: string): Promise<Article> {
  const { article } = await apiFetch<{ article: Article }>(`/api/articles/${slug}`);
  return article;
}

export async function apiGetMyAttempts(): Promise<QuizAttempt[]> {
  const { attempts } = await apiFetch<{ attempts: QuizAttempt[] }>("/api/quiz/attempts");
  return attempts;
}

// ---------------------------------------------------------------------------
// High-risk safety info (admin-authored clinic/specialist pointer, shown to
// a user whose result comes back "yuqori"/high)
// ---------------------------------------------------------------------------

export async function apiGetPublicStats(): Promise<{ totalUsers: number; totalAttempts: number }> {
  return apiFetch("/api/public-stats");
}

// ---------------------------------------------------------------------------
// Browser push notifications
// ---------------------------------------------------------------------------

export async function apiGetVapidPublicKey(): Promise<string> {
  const { publicKey } = await apiFetch<{ publicKey: string }>("/api/push/vapid-public-key");
  return publicKey;
}

export async function apiSubscribePush(subscription: PushSubscriptionJSON): Promise<void> {
  await apiFetch("/api/push/subscribe", { method: "POST", body: JSON.stringify(subscription) });
}

export async function apiUnsubscribePush(endpoint: string): Promise<void> {
  await apiFetch("/api/push/unsubscribe", { method: "POST", body: JSON.stringify({ endpoint }) });
}

export async function apiGetHighRiskInfo(): Promise<string> {
  const { text } = await apiFetch<{ text: string }>("/api/high-risk-info");
  return text;
}

// ---------------------------------------------------------------------------
// Guide media (admin-configurable images/video shown on the qo'llanma page)
// ---------------------------------------------------------------------------

export async function apiGetGuideMedia(): Promise<{ imageUrls: string[]; videoUrl: string }> {
  return apiFetch("/api/guide-media");
}

export async function apiGetAdminGuideMedia(): Promise<{ imageUrls: string; videoUrl: string }> {
  return apiFetch("/api/admin/settings/guide-media");
}

export async function apiSaveAdminGuideMedia(imageUrls: string, videoUrl: string): Promise<void> {
  await apiFetch("/api/admin/settings/guide-media", { method: "POST", body: JSON.stringify({ imageUrls, videoUrl }) });
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export async function apiSubmitFeedback(message: string): Promise<void> {
  await apiFetch("/api/feedback", { method: "POST", body: JSON.stringify({ message }) });
}

export interface AdminFeedbackItem {
  id: string;
  userId: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  userEmail: string | null;
  message: string;
  source: string;
  createdAt: string;
}

export async function apiGetAdminFeedback(): Promise<AdminFeedbackItem[]> {
  const { feedback } = await apiFetch<{ feedback: AdminFeedbackItem[] }>("/api/admin/feedback");
  return feedback;
}

export async function apiDeleteFeedback(id: string): Promise<void> {
  await apiFetch(`/api/admin/feedback/${id}`, { method: "DELETE" });
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

export async function apiSetUserRole(id: string, role: "user" | "moderator"): Promise<AdminUser> {
  const { user } = await apiFetch<{ user: AdminUser }>(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
  return user;
}

export interface AuditLogEntry {
  id: string;
  adminId: string | null;
  adminName: string;
  action: string;
  target: string;
  createdAt: string;
}

export async function apiGetAuditLog(): Promise<AuditLogEntry[]> {
  const { entries } = await apiFetch<{ entries: AuditLogEntry[] }>("/api/admin/audit-log");
  return entries;
}

// --- FAQ (admin) -----------------------------------------------------------

export async function apiGetAdminFaq(): Promise<FaqItem[]> {
  const { items } = await apiFetch<{ items: FaqItem[] }>("/api/admin/faq");
  return items;
}

export async function apiCreateFaqItem(input: Omit<FaqItem, "id">): Promise<FaqItem> {
  const { item } = await apiFetch<{ item: FaqItem }>("/api/admin/faq", { method: "POST", body: JSON.stringify(input) });
  return item;
}

export async function apiUpdateFaqItem(id: string, input: Omit<FaqItem, "id">): Promise<FaqItem> {
  const { item } = await apiFetch<{ item: FaqItem }>(`/api/admin/faq/${id}`, { method: "PUT", body: JSON.stringify(input) });
  return item;
}

export async function apiDeleteFaqItem(id: string): Promise<void> {
  await apiFetch(`/api/admin/faq/${id}`, { method: "DELETE" });
}

// --- Clinics (admin) ---------------------------------------------------------

export async function apiGetAdminClinics(): Promise<Clinic[]> {
  const { clinics } = await apiFetch<{ clinics: Clinic[] }>("/api/admin/clinics");
  return clinics;
}

export async function apiCreateClinic(input: Omit<Clinic, "id">): Promise<Clinic> {
  const { clinic } = await apiFetch<{ clinic: Clinic }>("/api/admin/clinics", { method: "POST", body: JSON.stringify(input) });
  return clinic;
}

export async function apiUpdateClinic(id: string, input: Omit<Clinic, "id">): Promise<Clinic> {
  const { clinic } = await apiFetch<{ clinic: Clinic }>(`/api/admin/clinics/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return clinic;
}

export async function apiDeleteClinic(id: string): Promise<void> {
  await apiFetch(`/api/admin/clinics/${id}`, { method: "DELETE" });
}

// --- Articles (admin) --------------------------------------------------------

export async function apiGetAdminArticles(): Promise<Article[]> {
  const { articles } = await apiFetch<{ articles: Article[] }>("/api/admin/articles");
  return articles;
}

export async function apiCreateArticle(input: {
  title: string;
  excerpt: string;
  content: string;
  published: boolean;
  videoUrl?: string;
}): Promise<Article> {
  const { article } = await apiFetch<{ article: Article }>("/api/admin/articles", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return article;
}

export async function apiUpdateArticle(
  id: string,
  input: { title: string; excerpt: string; content: string; published: boolean; videoUrl?: string }
): Promise<Article> {
  const { article } = await apiFetch<{ article: Article }>(`/api/admin/articles/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return article;
}

export async function apiDeleteArticle(id: string): Promise<void> {
  await apiFetch(`/api/admin/articles/${id}`, { method: "DELETE" });
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

export async function apiSendAdminTelegramBroadcast(message: string): Promise<{ sent: number; failed: number }> {
  return apiFetch("/api/admin/settings/telegram/broadcast", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export interface ReminderSettings {
  retestDays: number;
  selfExamDays: number;
}

export async function apiGetReminderSettings(): Promise<ReminderSettings> {
  return apiFetch<ReminderSettings>("/api/admin/settings/reminders");
}

export async function apiSaveReminderSettings(settings: ReminderSettings): Promise<void> {
  await apiFetch("/api/admin/settings/reminders", { method: "POST", body: JSON.stringify(settings) });
}

export async function apiGetAdminHighRiskInfo(): Promise<string> {
  const { text } = await apiFetch<{ text: string }>("/api/admin/settings/high-risk");
  return text;
}

export async function apiSaveAdminHighRiskInfo(text: string): Promise<void> {
  await apiFetch("/api/admin/settings/high-risk", { method: "POST", body: JSON.stringify({ text }) });
}

export interface DailyCounts {
  date: string;
  signups: number;
  attempts: number;
}

export async function apiGetAdminTrend(): Promise<DailyCounts[]> {
  const { trend } = await apiFetch<{ trend: DailyCounts[] }>("/api/admin/trend");
  return trend;
}

export interface SystemStatus {
  appUptimeSeconds: number;
  nodeVersion: string;
  dbSizeBytes: number;
  lastBackupAt: string | null;
  backupCount: number;
}

export async function apiGetSystemStatus(): Promise<SystemStatus> {
  return apiFetch("/api/admin/system-status");
}

export interface BackupFile {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

export async function apiGetBackups(): Promise<BackupFile[]> {
  const { backups } = await apiFetch<{ backups: BackupFile[] }>("/api/admin/backups");
  return backups;
}

export async function apiRestoreBackup(filename: string): Promise<void> {
  await apiFetch("/api/admin/backups/restore", {
    method: "POST",
    body: JSON.stringify({ filename, confirmFilename: filename }),
  });
}

