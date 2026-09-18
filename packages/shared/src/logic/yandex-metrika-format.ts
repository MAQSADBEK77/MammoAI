// YANDEX-METRIKA-02: Yandex Metrika Reporting API'ning xom
// `{dimensions, metrics}` qator shaklini frontend uchun qulay, aniq
// tiplangan obyektlarga aylantiruvchi SOF funksiyalar (tarmoq/autentifikatsiya
// mantig'idan ajratilgan — shuning uchun DB/tarmoqsiz test qilinadi, xuddi
// packages/shared/src/logic/'dagi boshqa mantiq kabi).

export interface YandexStatRow {
  dimensions: { name?: string; id?: string }[];
  metrics: number[];
}

export interface YandexDailyPoint {
  date: string;
  visits: number;
  users: number;
}

/** `dimensions=ym:s:date` bilan qaytgan qatorlarni kunlik trend nuqtalariga aylantiradi. */
export function formatYandexDailySeries(rows: YandexStatRow[]): YandexDailyPoint[] {
  return rows.map((row) => ({
    date: row.dimensions[0]?.name ?? "",
    visits: Math.round(row.metrics[0] ?? 0),
    users: Math.round(row.metrics[1] ?? 0),
  }));
}

export interface YandexBreakdownItem {
  label: string;
  visits: number;
}

/** Bitta o'lchov (masalan trafik manbai yoki qurilma turi) bo'yicha taqsimot. */
export function formatYandexBreakdown(rows: YandexStatRow[]): YandexBreakdownItem[] {
  return rows.map((row) => ({ label: row.dimensions[0]?.name ?? "Noma'lum", visits: Math.round(row.metrics[0] ?? 0) }));
}

export interface YandexTopPage {
  path: string;
  pageviews: number;
}

export function formatYandexTopPages(rows: YandexStatRow[]): YandexTopPage[] {
  return rows.map((row) => ({ path: row.dimensions[0]?.name ?? "/", pageviews: Math.round(row.metrics[0] ?? 0) }));
}

export interface YandexGeoItem {
  country: string;
  city: string;
  visits: number;
}

export function formatYandexGeography(rows: YandexStatRow[]): YandexGeoItem[] {
  return rows.map((row) => ({
    country: row.dimensions[0]?.name ?? "Noma'lum",
    city: row.dimensions[1]?.name ?? "Noma'lum",
    visits: Math.round(row.metrics[0] ?? 0),
  }));
}

export interface YandexVisitsTotals {
  visits: number;
  users: number;
  pageviews: number;
  bounceRatePct: number;
  avgVisitDurationSec: number;
}

/** `metrics=ym:s:visits,ym:s:users,ym:s:pageviews,ym:s:bounceRate,ym:s:avgVisitDurationSeconds`
 * tartibidagi `totals` massivini nomlangan maydonlarga aylantiradi. */
export function formatYandexVisitsTotals(totals: number[]): YandexVisitsTotals {
  const [visits = 0, users = 0, pageviews = 0, bounceRate = 0, avgDuration = 0] = totals;
  return {
    visits: Math.round(visits),
    users: Math.round(users),
    pageviews: Math.round(pageviews),
    bounceRatePct: Math.round(bounceRate * 10) / 10,
    avgVisitDurationSec: Math.round(avgDuration),
  };
}
