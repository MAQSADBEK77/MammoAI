// Admin panel uchun alohida, sodda API mijozi — oddiy foydalanuvchi `api`
// mijozidan mustaqil (admin sessiyasi butunlay boshqa cookie/token orqali).

import type {
  Article,
  ArticleCategory,
  Clinic,
  ClinicSpecialty,
  CommunityComment,
  CommunityPost,
  IllustrationSlotKey,
  Language,
  LibraryIllustration,
  OnboardingProfile,
  User,
} from "@mammoai/shared";

export interface AdminUserSummary extends User {
  primaryGoal: OnboardingProfile["primaryGoal"] | null;
  cycleLogsCount: number;
  lastActiveAt: string | null;
}

export interface AdminCommunityPost extends CommunityPost {
  authorId: string;
  authorPhone: string | null;
}

export interface AdminCommunityComment extends CommunityComment {
  authorId: string;
  authorPhone: string | null;
}

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
  login: (password: string) => request<{ ok: true }>("/login", { method: "POST", body: JSON.stringify({ password }) }),
  logout: () => request<{ ok: true }>("/logout", { method: "POST" }),
  me: () => request<{ ok: true }>("/me"),
  stats: () => request<AdminStats>("/stats"),
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
      patch: Partial<Pick<User, "name" | "phone" | "language" | "fontScale" | "highContrast" | "notificationsEnabled" | "isBlocked">>
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
    create: (data: { slug: string; category: ArticleCategory; title: string; excerpt: string; body: string }) =>
      request<Article>("/articles", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, patch: Partial<Omit<Article, "id" | "isSeedData">>) =>
      request<{ ok: true }>(`/articles/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    delete: (id: string) => request<{ ok: true }>(`/articles/${id}`, { method: "DELETE" }),
  },
  illustrations: {
    list: () => request<{ slots: Record<IllustrationSlotKey, string>; library: LibraryIllustration[] }>("/illustrations"),
    update: (slotKey: IllustrationSlotKey, slug: string) =>
      request<{ slots: Record<IllustrationSlotKey, string> }>("/illustrations", { method: "PATCH", body: JSON.stringify({ slotKey, slug }) }),
  },
};
