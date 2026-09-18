// Yandex Metrika Reporting API bilan ishlash — mavjud Telegram bot/Gemini
// kalit saqlash naqshini AYNAN takrorlaydi: OAuth token va counter ID
// `.env`da EMAS, `app_settings` jadvalida saqlanadi (admin panel orqali
// qayta deploy qilmasdan o'zgartirish mumkin bo'lishi uchun). Token HECH
// QACHON, HECH QANDAY API javobida to'liq mijozga qaytarilmaydi — faqat
// shu faylning ICHIDA, server-side ishlatiladi.
//
// YANDEX-METRIKA-01: sozlama saqlash + ulanishni tekshirish.

import { getSetting, getSettingWithUpdatedAt, setSetting } from "./repo";
import { ApiError } from "./api-utils";
import { addDays, tashkentDateStr } from "@mammoai/shared";
import {
  formatYandexBreakdown,
  formatYandexDailySeries,
  formatYandexGeography,
  formatYandexTopPages,
  formatYandexVisitsTotals,
  type YandexBreakdownItem,
  type YandexDailyPoint,
  type YandexGeoItem,
  type YandexTopPage,
  type YandexVisitsTotals,
} from "@mammoai/shared";

const SETTING_TOKEN = "yandex_metrika_oauth_token";
const SETTING_COUNTER_ID = "yandex_metrika_counter_id";

export async function getYandexMetrikaToken(): Promise<string | null> {
  return getSetting(SETTING_TOKEN);
}

export async function setYandexMetrikaToken(token: string): Promise<void> {
  await setSetting(SETTING_TOKEN, token);
}

export async function getYandexMetrikaCounterId(): Promise<string | null> {
  return getSetting(SETTING_COUNTER_ID);
}

export async function setYandexMetrikaCounterId(counterId: string): Promise<void> {
  await setSetting(SETTING_COUNTER_ID, counterId);
}

const REPORTING_API_BASE = "https://api-metrika.yandex.net/stat/v1/data";

/** Reporting API'ning xom javobi — bu yerda faqat kerakli qismlar tiplangan
 * (to'liq shakl ancha boy, lekin bizga faqat `data`/`totals` kerak). */
interface YandexStatResponse {
  data: { dimensions: { name?: string; id?: string }[]; metrics: number[] }[];
  totals: number[];
}

/** Yandex Metrika Reporting API'ga bitta so'rov. `overrides` — admin panelda
 * "Ulanishni tekshirish" tugmasi HALI SAQLANMAGAN qiymatlarni sinash uchun
 * beradi; berilmasa saqlangan token/counterId ishlatiladi. */
export async function callYandexMetrikaApi(
  params: Record<string, string>,
  overrides?: { token?: string; counterId?: string }
): Promise<YandexStatResponse> {
  const token = overrides?.token ?? (await getYandexMetrikaToken());
  const counterId = overrides?.counterId ?? (await getYandexMetrikaCounterId());
  if (!token || !counterId) {
    throw new ApiError(500, "Yandex Metrika hali sozlanmagan — avval admin paneldan counter ID va tokenni kiriting");
  }

  const query = new URLSearchParams({ ids: counterId, accuracy: "low", ...params });
  const res = await fetch(`${REPORTING_API_BASE}?${query.toString()}`, {
    headers: { Authorization: `OAuth ${token}` },
  });
  const json = (await res.json().catch(() => null)) as
    | (YandexStatResponse & { message?: string; errors?: { message: string }[] })
    | null;

  if (!res.ok) {
    const detail = json?.message ?? json?.errors?.[0]?.message;
    // Yandex'ning o'zi 401/403/429'ni aniq belgilaydi — bu uchtasi uchun
    // o'zbekcha, aniq tushuntirish; qolgani uchun Yandex'ning xabari (bo'lsa).
    if (res.status === 401) throw new ApiError(401, "Yandex Metrika tokeni yaroqsiz — yangi token oling va qaytadan saqlang");
    if (res.status === 403) throw new ApiError(403, "Ushbu token bu counter ID uchun ruxsatga ega emas");
    if (res.status === 429) throw new ApiError(429, "Yandex Metrika so'rovlar limiti tugadi — birozdan keyin qayta urinib ko'ring");
    throw new ApiError(res.status || 500, detail ?? "Yandex Metrika so'rovi muvaffaqiyatsiz tugadi");
  }
  if (!json) throw new ApiError(500, "Yandex Metrika javobini o'qib bo'lmadi");
  return json;
}

// OVERNIGHT-01: avval server UTC vaqtidan hisoblanardi (FIX2-23/
// DATA-ACCURACY sinfidagi xato) — Toshkent mahalliy 00:00-04:59 oralig'ida
// Yandex'dan so'ralayotgan sana oralig'i bir kunga siljib ketardi.
function isoDateNDaysAgo(n: number): string {
  return addDays(tashkentDateStr(), -n);
}

/** Admin panel "Ulanishni tekshirish" tugmasi uchun — kichik, arzon so'rov
 * (7 kunlik tashriflar soni) haqiqatan ham token+counterId ishlayotganini
 * tasdiqlaydi. */
export async function testYandexMetrikaConnection(overrides?: { token?: string; counterId?: string }): Promise<{
  visits: number;
  days: number;
}> {
  const days = 7;
  const res = await callYandexMetrikaApi(
    { date1: isoDateNDaysAgo(days), date2: isoDateNDaysAgo(0), metrics: "ym:s:visits" },
    overrides
  );
  return { visits: Math.round(res.totals?.[0] ?? 0), days };
}

// -----------------------------------------------------------------------
// YANDEX-METRIKA-02: Reporting API'ni o'rab oluvchi funksiyalar. Xom
// javobni tiplangan shaklga o'tkazish (parsing) `@mammoai/shared`dagi SOF
// `formatYandex*` funksiyalariga berilgan — shu tufayli o'sha qism DB/
// tarmoqsiz test qilingan (`yandex-metrika-format.test.ts`), bu yerda faqat
// "qaysi metrika/dimension so'ralsin" qoladi.
// -----------------------------------------------------------------------

export interface YandexVisitsSummary {
  totals: YandexVisitsTotals;
  daily: YandexDailyPoint[];
}

/** Umumiy KPI'lar (tashriflar/foydalanuvchilar/sahifa ko'rishlar/bounce
 * rate/o'rtacha davomiylik) + kunlik tashriflar-foydalanuvchilar trendi. */
export async function getVisitsSummary(dateFrom: string, dateTo: string): Promise<YandexVisitsSummary> {
  const metrics = "ym:s:visits,ym:s:users,ym:s:pageviews,ym:s:bounceRate,ym:s:avgVisitDurationSeconds";
  const [totalsRes, dailyRes] = await Promise.all([
    callYandexMetrikaApi({ date1: dateFrom, date2: dateTo, metrics }),
    callYandexMetrikaApi({ date1: dateFrom, date2: dateTo, metrics: "ym:s:visits,ym:s:users", dimensions: "ym:s:date" }),
  ]);
  return {
    totals: formatYandexVisitsTotals(totalsRes.totals ?? []),
    daily: formatYandexDailySeries(dailyRes.data ?? []),
  };
}

/** To'g'ridan-to'g'ri / qidiruv tizimlari / ijtimoiy tarmoqlar / referral taqsimoti. */
export async function getTrafficSources(dateFrom: string, dateTo: string): Promise<YandexBreakdownItem[]> {
  const res = await callYandexMetrikaApi({
    date1: dateFrom,
    date2: dateTo,
    metrics: "ym:s:visits",
    dimensions: "ym:s:lastTrafficSource",
    sort: "-ym:s:visits",
  });
  return formatYandexBreakdown(res.data ?? []);
}

/** Desktop/mobil/planshet taqsimoti. */
export async function getDeviceBreakdown(dateFrom: string, dateTo: string): Promise<YandexBreakdownItem[]> {
  const res = await callYandexMetrikaApi({
    date1: dateFrom,
    date2: dateTo,
    metrics: "ym:s:visits",
    dimensions: "ym:s:deviceCategory",
    sort: "-ym:s:visits",
  });
  return formatYandexBreakdown(res.data ?? []);
}

/** Eng ko'p ko'rilgan sahifalar (sahifa yo'li + ko'rishlar soni). */
export async function getTopPages(dateFrom: string, dateTo: string, limit = 10): Promise<YandexTopPage[]> {
  const res = await callYandexMetrikaApi({
    date1: dateFrom,
    date2: dateTo,
    metrics: "ym:pv:pageviews",
    dimensions: "ym:pv:URLPathFull",
    sort: "-ym:pv:pageviews",
    limit: String(limit),
  });
  return formatYandexTopPages(res.data ?? []);
}

/** Geografiya — mamlakat+shahar bo'yicha (asosan O'zbekiston shaharlari kutiladi). */
export async function getGeography(dateFrom: string, dateTo: string, limit = 15): Promise<YandexGeoItem[]> {
  const res = await callYandexMetrikaApi({
    date1: dateFrom,
    date2: dateTo,
    metrics: "ym:s:visits",
    dimensions: "ym:s:regionCountry,ym:s:regionCity",
    sort: "-ym:s:visits",
    limit: String(limit),
  });
  return formatYandexGeography(res.data ?? []);
}

/** Ixtiyoriy — Yandex Metrika'da Maqsad (Goal) sozlangan va uning ID'lari
 * berilgan bo'lsagina chaqiriladi (kodga qattiq yozilmagan, hozircha admin
 * UI'da ishlatilmaydi — Goal ID'lar sozlanmagan). */
export async function getGoalConversions(dateFrom: string, dateTo: string, goalIds: string[]): Promise<YandexBreakdownItem[]> {
  if (!goalIds.length) return [];
  const metrics = goalIds.map((id) => `ym:s:goal${id}visits`).join(",");
  const res = await callYandexMetrikaApi({ date1: dateFrom, date2: dateTo, metrics });
  const totals = res.totals ?? [];
  return goalIds.map((id, i) => ({ label: id, visits: Math.round(totals[i] ?? 0) }));
}

// -----------------------------------------------------------------------
// YANDEX-METRIKA-03: keshlash — Yandex Reporting API'ning so'rov chastotasi
// cheklovini hurmat qilish uchun. Alohida kesh jadvali QURILMAYDI: mavjud
// `app_settings`ning o'zi (key-value + `updated_at`) TTL hisoblash uchun
// yetarli — har bir so'rov turi (summary/traffic/devices/pages/geo) `days`
// bo'yicha ALOHIDA kalit ostida keshlanadi (aniq sana emas — jadvalning
// cheksiz o'sishini oldini olish uchun; 30 daqiqalik oynada sana chegarasi
// deyarli hech qachon muhim farq qilmaydi).
// -----------------------------------------------------------------------

const CACHE_TTL_MS = 30 * 60 * 1000;
const FORCE_REFRESH_COOLDOWN_MS = 60 * 1000;
const FORCE_REFRESH_KEY = "yandex_metrika_last_force_refresh";

async function getCachedOrFetch<T>(
  cacheKey: string,
  forceRefresh: boolean,
  fetcher: () => Promise<T>
): Promise<{ value: T; cachedAt: string }> {
  if (!forceRefresh) {
    const cached = await getSettingWithUpdatedAt(cacheKey);
    if (cached && Date.now() - new Date(cached.updatedAt).getTime() < CACHE_TTL_MS) {
      return { value: JSON.parse(cached.value) as T, cachedAt: cached.updatedAt };
    }
  }
  const value = await fetcher();
  await setSetting(cacheKey, JSON.stringify(value));
  return { value, cachedAt: new Date().toISOString() };
}

export interface YandexMetrikaDashboard {
  totals: YandexVisitsTotals;
  daily: YandexDailyPoint[];
  trafficSources: YandexBreakdownItem[];
  devices: YandexBreakdownItem[];
  topPages: YandexTopPage[];
  geography: YandexGeoItem[];
  /** Ko'rsatilgan ma'lumotlar ichida ENG ESKI qismi qachon olib kelingani —
   * admin UI "so'nggi yangilangan: N daqiqa oldin" ko'rsatishi uchun. */
  cachedAt: string;
}

/** Admin `/admin/analitika` sahifasi shu FUNKSIYANI chaqiradi — barcha 5 ta
 * so'rov turini (kerak bo'lsa) keshdan, aks holda Yandex'dan olib, bittalikda
 * qaytaradi. `forceRefresh` — "Yangilash" tugmasi bosilganda keshni chetlab
 * o'tadi, lekin o'zi daqiqada 1 marta bilan cheklangan (barcha so'rov
 * turlari uchun UMUMIY cooldown — bittasi ham bo'lsa, "Yangilash"ning o'zi
 * kamdan-kam bosiladigan amal). */
export async function getYandexMetrikaDashboard(days: number, forceRefresh: boolean): Promise<YandexMetrikaDashboard> {
  if (forceRefresh) {
    const last = await getSettingWithUpdatedAt(FORCE_REFRESH_KEY);
    if (last) {
      const ageMs = Date.now() - new Date(last.updatedAt).getTime();
      if (ageMs < FORCE_REFRESH_COOLDOWN_MS) {
        const waitSec = Math.ceil((FORCE_REFRESH_COOLDOWN_MS - ageMs) / 1000);
        throw new ApiError(429, `Juda tez-tez yangilanmoqda — yana ${waitSec} soniyadan keyin urinib ko'ring`);
      }
    }
    await setSetting(FORCE_REFRESH_KEY, "1");
  }

  const dateFrom = isoDateNDaysAgo(days);
  const dateTo = isoDateNDaysAgo(0);

  const [summary, trafficSources, devices, topPages, geography] = await Promise.all([
    getCachedOrFetch(`yandex_cache_summary_${days}`, forceRefresh, () => getVisitsSummary(dateFrom, dateTo)),
    getCachedOrFetch(`yandex_cache_traffic_${days}`, forceRefresh, () => getTrafficSources(dateFrom, dateTo)),
    getCachedOrFetch(`yandex_cache_devices_${days}`, forceRefresh, () => getDeviceBreakdown(dateFrom, dateTo)),
    getCachedOrFetch(`yandex_cache_pages_${days}`, forceRefresh, () => getTopPages(dateFrom, dateTo)),
    getCachedOrFetch(`yandex_cache_geo_${days}`, forceRefresh, () => getGeography(dateFrom, dateTo)),
  ]);

  const cachedAt = [summary, trafficSources, devices, topPages, geography].map((r) => r.cachedAt).sort()[0];

  return {
    totals: summary.value.totals,
    daily: summary.value.daily,
    trafficSources: trafficSources.value,
    devices: devices.value,
    topPages: topPages.value,
    geography: geography.value,
    cachedAt,
  };
}
