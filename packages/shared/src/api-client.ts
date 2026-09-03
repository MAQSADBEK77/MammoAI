// Tiplangan API mijozi — ham veb (nisbiy yo'l, httpOnly cookie sessiya), ham mobil
// (absolyut baseUrl, "Authorization: Bearer" tokeni) shu bir xil mantiqdan foydalanadi.
// Backend — apps/web/src/app/api ichida, ikkalasiga ham xizmat qiladi (spec §8).

import type {
  AppNotification,
  Article,
  BloodType,
  ChecklistItem,
  Clinic,
  CommunityComment,
  CommunityPost,
  CommunityStats,
  CommunityTag,
  CycleLog,
  CycleSettings,
  Goal,
  HealthCondition,
  HeardAboutUs,
  Language,
  OnboardingProfile,
  PeriodAttitude,
  PregnancyProfile,
  PregnancyVisitLog,
  PregnancyVitalLog,
  VitalType,
  ReferralAction,
  RiskQuizAnswers,
  RiskQuizResult,
  Symptom,
  User,
} from "./types";
import type { CyclePrediction } from "./logic/cycle";
import type { PregnancyStatus } from "./logic/pregnancy";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface ApiClientConfig {
  /** Web uchun "" (nisbiy yo'l), mobil uchun "http://<IP>:3000" kabi absolyut manzil. */
  baseUrl: string;
  /** Mobilda SecureStore'dan tokenni o'qiydi; webda kerak emas (cookie avtomatik ketadi). */
  getAuthToken?: () => Promise<string | null>;
  /** Server javobida yangi token kelsa (login/onboarding'dan keyin), mobil uni saqlaydi. */
  onAuthToken?: (token: string) => Promise<void> | void;
  /** Webda "same-origin" yetarli; ba'zi holatlarda "include" kerak bo'lishi mumkin. */
  credentials?: RequestCredentials;
}

export interface MeResponse {
  user: User;
  onboardingProfile: OnboardingProfile | null;
}

export interface AuthStartPayload {
  identifier: string; // telefon raqam
  language: Language;
}

export interface AuthStartResponse extends MeResponse {
  token?: string;
  /** false — bu identifikator bo'yicha mavjud akkaunt topildi va shunga kirildi. */
  isNewAccount: boolean;
}

export interface CycleResponse {
  settings: CycleSettings;
  logs: CycleLog[];
  prediction: CyclePrediction | null;
  isIrregular: boolean;
}

export interface PregnancyResponse {
  profile: PregnancyProfile | null;
  status: PregnancyStatus | null;
  visits: PregnancyVisitLog[];
  kicksToday: number;
  /** Har bir tur bo'yicha eng so'nggi o'z-o'zidan qayd etilgan ko'rsatkich. */
  latestVitals: Partial<Record<VitalType, PregnancyVitalLog>>;
  /** Vazn — oldingi qayddan (yoki onboarding vaznidan) farqi, kg. */
  weightDeltaKg: number | null;
}

// App.pdf §5-10 — onboarding so'rovnomasi endi akkaunt yaratilgandan KEYIN, sessiya
// ustida to'ldiriladi (auth.start allaqachon userni yaratgan/topgan bo'ladi).
export interface OnboardingPayload {
  name: string;
  age: number;
  isPregnant: boolean;
  cycleRegularity: OnboardingProfile["cycleRegularity"];
  familyHistory: boolean;
  lastCheckup: OnboardingProfile["lastCheckup"];
  primaryGoal: Goal;
  heardAboutUs: HeardAboutUs;
  typicalSymptoms: Symptom[];
  periodAttitude: PeriodAttitude | null;
  healthConditions: HealthCondition[];
  healthConditionsOther: string | null;
  heightCm: number | null;
  weightKg: number | null;
  bloodType: BloodType | null;
  notificationsEnabled: boolean;
}

function createRequest(config: ApiClientConfig) {
  return async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");

    if (config.getAuthToken) {
      const token = await config.getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers,
      credentials: config.credentials ?? "same-origin",
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({ error: res.statusText }))) as { error?: string };
      throw new ApiError(res.status, body.error ?? "So'rov xato bilan yakunlandi");
    }

    const data = (await res.json().catch(() => null)) as (T & { token?: string }) | null;
    if (data && typeof data === "object" && "token" in data && data.token && config.onAuthToken) {
      await config.onAuthToken(data.token);
    }
    return data as T;
  };
}

export function createApiClient(config: ApiClientConfig) {
  const request = createRequest(config);

  return {
    auth: {
      /** Telefon raqam bilan akkaunt yaratish yoki mavjudiga kirish. */
      start: (payload: AuthStartPayload) =>
        request<AuthStartResponse>("/api/auth/start", { method: "POST", body: JSON.stringify(payload) }),
    },
    onboarding: {
      submit: (payload: OnboardingPayload) =>
        request<MeResponse>("/api/onboarding", {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      /** Rejim almashtirish va shaxsiy ma'lumotlarni (yosh/bo'y/vazn/qon guruhi) qisman yangilash. */
      update: (
        patch: Partial<Pick<OnboardingProfile, "primaryGoal" | "isPregnant" | "age" | "heightCm" | "weightKg" | "bloodType">>
      ) => request<{ onboardingProfile: OnboardingProfile }>("/api/onboarding", { method: "PATCH", body: JSON.stringify(patch) }),
    },
    me: {
      get: () => request<MeResponse>("/api/me"),
      update: (
        patch: Partial<Pick<User, "name" | "phone" | "language" | "fontScale" | "highContrast" | "notificationsEnabled" | "avatarUrl">>
      ) => request<MeResponse>("/api/me", { method: "PATCH", body: JSON.stringify(patch) }),
      exportData: () => request<Record<string, unknown>>("/api/me/export"),
    },
    cycle: {
      get: () => request<CycleResponse>("/api/cycle"),
      logDay: (log: Pick<CycleLog, "date" | "flow" | "mood" | "symptoms">) =>
        request<CycleResponse>("/api/cycle/logs", { method: "POST", body: JSON.stringify(log) }),
      updateSettings: (settings: Partial<Pick<CycleSettings, "lastPeriodStart" | "averageCycleLength" | "averagePeriodLength">>) =>
        request<CycleResponse>("/api/cycle/settings", { method: "PATCH", body: JSON.stringify(settings) }),
    },
    pregnancy: {
      get: () => request<PregnancyResponse>("/api/pregnancy"),
      updateProfile: (patch: Partial<Pick<PregnancyProfile, "lastMenstrualPeriod" | "dueDate">>) =>
        request<PregnancyResponse>("/api/pregnancy", { method: "PATCH", body: JSON.stringify(patch) }),
      addVisit: (visit: Pick<PregnancyVisitLog, "label" | "date" | "clinicName" | "note">) =>
        request<PregnancyResponse>("/api/pregnancy/visits", { method: "POST", body: JSON.stringify(visit) }),
      logKick: () => request<PregnancyResponse>("/api/pregnancy/kicks", { method: "POST" }),
      logVital: (payload: { type: VitalType; value: string; recordedAt?: string }) =>
        request<PregnancyResponse>("/api/pregnancy/vitals", { method: "POST", body: JSON.stringify(payload) }),
    },
    checklist: {
      list: () => request<ChecklistItem[]>("/api/checklist"),
      complete: (id: string) => request<ChecklistItem[]>(`/api/checklist/${id}/complete`, { method: "POST" }),
    },
    clinics: {
      list: () => request<Clinic[]>("/api/clinics"),
    },
    referrals: {
      log: (payload: { clinicId: string; checklistItemId?: string | null; action: ReferralAction }) =>
        request<{ ok: true }>("/api/referrals", { method: "POST", body: JSON.stringify(payload) }),
    },
    riskQuiz: {
      get: () => request<RiskQuizResult | null>("/api/risk-quiz"),
      submit: (answers: RiskQuizAnswers) =>
        request<RiskQuizResult>("/api/risk-quiz", { method: "POST", body: JSON.stringify({ answers }) }),
    },
    articles: {
      list: () => request<Article[]>("/api/articles"),
      get: (slug: string) => request<Article>(`/api/articles/${slug}`),
    },
    community: {
      stats: () => request<CommunityStats>("/api/community/stats"),
      listPosts: (params?: { tag?: CommunityTag; limit?: number; offset?: number }) => {
        const q = new URLSearchParams();
        if (params?.tag) q.set("tag", params.tag);
        if (params?.limit) q.set("limit", String(params.limit));
        if (params?.offset) q.set("offset", String(params.offset));
        const qs = q.toString();
        return request<{ posts: CommunityPost[]; total: number }>(`/api/community/posts${qs ? `?${qs}` : ""}`);
      },
      createPost: (payload: { tag: CommunityTag; body: string; isAnonymous: boolean }) =>
        request<CommunityPost>("/api/community/posts", { method: "POST", body: JSON.stringify(payload) }),
      deletePost: (id: string) => request<{ ok: true }>(`/api/community/posts/${id}`, { method: "DELETE" }),
      toggleLike: (id: string) => request<{ liked: boolean; likesCount: number }>(`/api/community/posts/${id}/like`, { method: "POST" }),
      listComments: (postId: string) => request<CommunityComment[]>(`/api/community/posts/${postId}/comments`),
      addComment: (postId: string, payload: { body: string; isAnonymous: boolean }) =>
        request<CommunityComment>(`/api/community/posts/${postId}/comments`, { method: "POST", body: JSON.stringify(payload) }),
    },
    notifications: {
      list: () => request<{ notifications: AppNotification[]; unreadCount: number }>("/api/notifications"),
      markAllRead: () => request<{ ok: true }>("/api/notifications/read-all", { method: "POST" }),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
