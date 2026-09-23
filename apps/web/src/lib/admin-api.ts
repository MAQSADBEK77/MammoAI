// Admin panel uchun alohida, sodda API mijozi — oddiy foydalanuvchi `api`
// mijozidan mustaqil (admin sessiyasi butunlay boshqa cookie/token orqali).

import type {
  AnalyticsSummary,
  AnalyticsUserSummary,
  Article,
  ArticleCategory,
  Clinic,
  ClinicSpecialty,
  CommunityComment,
  CommunityPost,
  CommunityReportAdmin,
  IllustrationSlotKey,
  Language,
  LibraryIllustration,
  OnboardingProfile,
  PregnancyWeekContent,
  Subscription,
  TractionSummary,
  User,
} from "@mammoai/shared";

export interface AdminUserSummary extends User {
  primaryGoal: OnboardingProfile["primaryGoal"] | null;
  cycleLogsCount: number;
  lastActiveAt: string | null;
}

// ADMIN-001 — alohida admin hisoblari va audit-jurnal.
export interface AdminAccountSummary {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AdminAuditEntry {
  id: string;
  adminLabel: string;
  action: string;
  detail: string | null;
  createdAt: string;
}

export interface AdminCommunityPost extends CommunityPost {
  authorId: string;
  authorPhone: string | null;
}

export interface AdminCommunityComment extends CommunityComment {
  authorId: string;
  authorPhone: string | null;
}

export interface TelegramBotSettings {
  hasToken: boolean;
  tokenValid: boolean;
  maskedToken: string | null;
  username: string | null;
  name: string | null;
  description: string | null;
  shortDescription: string | null;
}

export interface AdminFeedbackEntry {
  id: string;
  trigger: "manual" | "chat_prompt";
  rating: number | null;
  message: string | null;
  createdAt: string;
  userPhone: string | null;
}

export type AiProvider = "gemini" | "huawei_maas" | "anthropic";

export interface AiProbeResult {
  provider: AiProvider;
  ok: boolean;
  /** Muvaffaqiyatda — javob matnining boshi; xatoda — xato sababi. */
  detail: string;
  ms: number;
}

export interface AiUsageDay {
  day: string;
  totalTokens: number;
  requestCount: number;
}

export interface AiSettings {
  provider: AiProvider;
  hasKey: boolean;
  maskedKey: string | null;
  hasGeminiKey: boolean;
  maskedGeminiKey: string | null;
  hasHuaweiKey: boolean;
  maskedHuaweiKey: string | null;
  huaweiModel: string;
  hasAnthropicKey: boolean;
  maskedAnthropicKey: string | null;
  anthropicModel: string;
  usageToday: number;
  usageHistory: AiUsageDay[];
}

export interface YandexMetrikaSettings {
  hasToken: boolean;
  maskedToken: string | null;
  counterId: string | null;
}

export interface YandexMetrikaDashboardData {
  totals: { visits: number; users: number; pageviews: number; bounceRatePct: number; avgVisitDurationSec: number };
  daily: { date: string; visits: number; users: number }[];
  trafficSources: { label: string; visits: number }[];
  devices: { label: string; visits: number }[];
  topPages: { path: string; pageviews: number }[];
  geography: { country: string; city: string; visits: number }[];
  cachedAt: string;
}

export type YandexMetrikaDashboardResponse = { configured: false } | ({ configured: true } & YandexMetrikaDashboardData);

export interface AdminStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  activeUsersLast7Days: number;
  languageBreakdown: { language: Language; count: number }[];
  goalBreakdown: { goal: string; count: number }[];
  contentCounts: {
    cycleLogs: number;
    pregnancyVisits: number;
    pregnancyVitals: number;
    checklistCompleted: number;
    riskQuizResults: number;
    referralEvents: number;
    clinics: number;
    articles: number;
  };
  signupsByDay: { day: string; count: number }[];
}

class AdminApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/admin${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    credentials: "same-origin",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: res.statusText }))) as { error?: string };
    throw new AdminApiError(res.status, body.error ?? "So'rov xato bilan yakunlandi");
  }
  return (await res.json().catch(() => null)) as T;
}

export { AdminApiError };

export const adminApi = {
  // ADMIN-001: email berilsa — shaxsiy hisob, bo'lmasa — eski umumiy "root" parol.
  login: (password: string, email?: string) => request<{ ok: true }>("/login", { method: "POST", body: JSON.stringify({ password, email }) }),
  logout: () => request<{ ok: true }>("/logout", { method: "POST" }),
  me: () => request<{ ok: true; adminLabel: string }>("/me"),
  stats: () => request<AdminStats>("/stats"),
  admins: {
    list: () => request<{ admins: AdminAccountSummary[] }>("/admins"),
    create: (data: { email: string; password: string; name: string }) =>
      request<{ admin: AdminAccountSummary }>("/admins", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request<{ ok: true }>(`/admins/${id}`, { method: "DELETE" }),
  },
  auditLog: {
    list: () => request<{ entries: AdminAuditEntry[] }>("/audit-log"),
  },
  // CONTENT-001 — homiladorlik haftalik kontenti.
  pregnancyContent: {
    list: () => request<{ weeks: PregnancyWeekContent[] }>("/pregnancy-content"),
    update: (week: number, patch: { sizeLabel: string; babyDevelopment: string; motherChanges: string }) =>
      request<{ content: PregnancyWeekContent }>(`/pregnancy-content/${week}`, { method: "PATCH", body: JSON.stringify(patch) }),
  },
  users: {
    list: (params: { search?: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams();
      if (params.search) q.set("search", params.search);
      if (params.limit) q.set("limit", String(params.limit));
      if (params.offset) q.set("offset", String(params.offset));
      return request<{ users: AdminUserSummary[]; total: number }>(`/users?${q.toString()}`);
    },
    update: (
      id: string,
      patch: Partial<Pick<User, "name" | "phone" | "language" | "fontScale" | "theme" | "notificationsEnabled" | "isBlocked">>
    ) => request<User>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    delete: (id: string) => request<{ ok: true }>(`/users/${id}`, { method: "DELETE" }),
  },
  community: {
    posts: {
      list: (params: { search?: string; limit?: number; offset?: number }) => {
        const q = new URLSearchParams();
        if (params.search) q.set("search", params.search);
        if (params.limit) q.set("limit", String(params.limit));
        if (params.offset) q.set("offset", String(params.offset));
        return request<{ posts: AdminCommunityPost[]; total: number }>(`/community/posts?${q.toString()}`);
      },
      update: (id: string, body: string) => request<{ ok: true }>(`/community/posts/${id}`, { method: "PATCH", body: JSON.stringify({ body }) }),
      delete: (id: string) => request<{ ok: true }>(`/community/posts/${id}`, { method: "DELETE" }),
      comments: {
        list: (postId: string) => request<AdminCommunityComment[]>(`/community/posts/${postId}/comments`),
        delete: (postId: string, commentId: string) =>
          request<{ ok: true }>(`/community/posts/${postId}/comments/${commentId}`, { method: "DELETE" }),
      },
    },
    // COMM-001 — moderatsiya navbati.
    reports: {
      list: () => request<{ reports: CommunityReportAdmin[] }>("/community/reports"),
      resolve: (id: string, status: "resolved" | "dismissed") =>
        request<{ reports: CommunityReportAdmin[] }>(`/community/reports/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    },
  },
  clinics: {
    list: () => request<Clinic[]>("/clinics"),
    create: (data: {
      name: string;
      address: string;
      region: string;
      lat: number;
      lng: number;
      phone: string;
      specialties: ClinicSpecialty[];
      freeScreening: boolean;
    }) => request<Clinic>("/clinics", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, patch: Partial<Omit<Clinic, "id" | "isSeedData">>) =>
      request<{ ok: true }>(`/clinics/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    delete: (id: string) => request<{ ok: true }>(`/clinics/${id}`, { method: "DELETE" }),
  },
  articles: {
    list: () => request<Article[]>("/articles"),
    create: (data: {
      slug: string;
      category: ArticleCategory;
      title: string;
      excerpt: string;
      body: string;
      authorName?: string | null;
      authorCredential?: string | null;
      isSeedData?: boolean;
    }) =>
      request<Article>("/articles", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, patch: Partial<Omit<Article, "id" | "readingMinutes">>) =>
      request<{ ok: true }>(`/articles/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    delete: (id: string) => request<{ ok: true }>(`/articles/${id}`, { method: "DELETE" }),
  },
  illustrations: {
    list: () => request<{ slots: Record<IllustrationSlotKey, string>; library: LibraryIllustration[] }>("/illustrations"),
    update: (slotKey: IllustrationSlotKey, slug: string) =>
      request<{ slots: Record<IllustrationSlotKey, string> }>("/illustrations", { method: "PATCH", body: JSON.stringify({ slotKey, slug }) }),
  },
  analytics: {
    summary: (days: number) => request<AnalyticsSummary>(`/analytics/summary?days=${days}`),
    users: (params: { search?: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams();
      if (params.search) q.set("search", params.search);
      if (params.limit) q.set("limit", String(params.limit));
      if (params.offset) q.set("offset", String(params.offset));
      return request<{ users: AnalyticsUserSummary[]; total: number }>(`/analytics/users?${q.toString()}`);
    },
  },
  traction: {
    get: (days: number) => request<TractionSummary>(`/traction?days=${days}`),
  },
  subscriptions: {
    list: (params: { search?: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams();
      if (params.search) q.set("search", params.search);
      if (params.limit) q.set("limit", String(params.limit));
      if (params.offset) q.set("offset", String(params.offset));
      return request<{ subscriptions: (Subscription & { name: string | null; phone: string | null; active: boolean })[]; total: number }>(
        `/subscriptions?${q.toString()}`
      );
    },
    grant: (userId: string, payload: { durationDays: number | null; note?: string | null }) =>
      request<{ subscription: Subscription }>(`/subscriptions/${userId}`, { method: "POST", body: JSON.stringify(payload) }),
    revoke: (userId: string) => request<{ ok: true }>(`/subscriptions/${userId}`, { method: "DELETE" }),
  },
  telegramBot: {
    get: () => request<TelegramBotSettings>("/telegram-bot"),
    update: (patch: { token?: string; name?: string; description?: string; shortDescription?: string }) =>
      request<{ ok: true }>("/telegram-bot", { method: "PATCH", body: JSON.stringify(patch) }),
    broadcastRecipients: () => request<{ recipients: number }>("/telegram-bot/broadcast"),
    broadcast: (text: string) => request<{ total: number; sent: number; failed: number }>("/telegram-bot/broadcast", { method: "POST", body: JSON.stringify({ text }) }),
  },
  aiSettings: {
    get: () => request<AiSettings>("/ai-settings"),
    update: (patch: {
      provider?: AiProvider;
      geminiApiKey?: string;
      huaweiApiKey?: string;
      huaweiModel?: string;
      anthropicApiKey?: string;
      anthropicModel?: string;
    }) => request<{ ok: true }>("/ai-settings", { method: "PATCH", body: JSON.stringify(patch) }),
    /** Har bir provayderni jonli sinaydi — haqiqiy API so'rovi yuboriladi. */
    probe: () => request<{ results: AiProbeResult[] }>("/ai-settings/probe", { method: "POST" }),
  },
  yandexMetrika: {
    get: () => request<YandexMetrikaSettings>("/yandex-metrika"),
    update: (patch: { token?: string; counterId?: string }) =>
      request<{ ok: true }>("/yandex-metrika", { method: "PATCH", body: JSON.stringify(patch) }),
    test: () => request<{ ok: true; message: string }>("/yandex-metrika/test", { method: "POST" }),
    dashboard: (days: number, force = false) =>
      request<YandexMetrikaDashboardResponse>(`/yandex-metrika/dashboard?days=${days}${force ? "&force=1" : ""}`),
  },
  feedback: {
    list: (params: { limit?: number; offset?: number }) => {
      const q = new URLSearchParams();
      if (params.limit) q.set("limit", String(params.limit));
      if (params.offset) q.set("offset", String(params.offset));
      return request<{ responses: AdminFeedbackEntry[]; total: number; averageRating: number | null }>(`/feedback?${q.toString()}`);
    },
  },
};
