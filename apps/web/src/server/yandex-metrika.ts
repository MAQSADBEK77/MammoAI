// Yandex Metrika Reporting API bilan ishlash — mavjud Telegram bot/Gemini
// kalit saqlash naqshini AYNAN takrorlaydi: OAuth token va counter ID
// `.env`da EMAS, `app_settings` jadvalida saqlanadi (admin panel orqali
// qayta deploy qilmasdan o'zgartirish mumkin bo'lishi uchun). Token HECH
// QACHON, HECH QANDAY API javobida to'liq mijozga qaytarilmaydi — faqat
// shu faylning ICHIDA, server-side ishlatiladi.
//
// YANDEX-METRIKA-01: sozlama saqlash + ulanishni tekshirish.

import { getSetting, setSetting } from "./repo";
import { ApiError } from "./api-utils";
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

function isoDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
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
