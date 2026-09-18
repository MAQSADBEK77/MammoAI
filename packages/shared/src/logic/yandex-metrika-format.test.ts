import { describe, expect, it } from "vitest";
import {
  formatYandexBreakdown,
  formatYandexDailySeries,
  formatYandexGeography,
  formatYandexTopPages,
  formatYandexVisitsTotals,
} from "./yandex-metrika-format";

describe("formatYandexDailySeries", () => {
  it("maps date/visits/users from dimensions+metrics", () => {
    const rows = [
      { dimensions: [{ name: "2026-09-10" }], metrics: [12, 9] },
      { dimensions: [{ name: "2026-09-11" }], metrics: [20, 15] },
    ];
    expect(formatYandexDailySeries(rows)).toEqual([
      { date: "2026-09-10", visits: 12, users: 9 },
      { date: "2026-09-11", visits: 20, users: 15 },
    ]);
  });

  it("defaults missing dimension/metric values", () => {
    expect(formatYandexDailySeries([{ dimensions: [], metrics: [] }])).toEqual([{ date: "", visits: 0, users: 0 }]);
  });
});

describe("formatYandexBreakdown", () => {
  it("maps a single dimension + single metric", () => {
    const rows = [
      { dimensions: [{ name: "direct" }], metrics: [50] },
      { dimensions: [{ name: "organic" }], metrics: [30] },
    ];
    expect(formatYandexBreakdown(rows)).toEqual([
      { label: "direct", visits: 50 },
      { label: "organic", visits: 30 },
    ]);
  });

  it("falls back to 'Noma'lum' when the dimension name is missing", () => {
    expect(formatYandexBreakdown([{ dimensions: [{}], metrics: [5] }])).toEqual([{ label: "Noma'lum", visits: 5 }]);
  });
});

describe("formatYandexTopPages", () => {
  it("maps path + pageviews", () => {
    expect(formatYandexTopPages([{ dimensions: [{ name: "/asosiy" }], metrics: [120] }])).toEqual([{ path: "/asosiy", pageviews: 120 }]);
  });
});

describe("formatYandexGeography", () => {
  it("maps country/city/visits from two dimensions", () => {
    const rows = [{ dimensions: [{ name: "O'zbekiston" }, { name: "Toshkent" }], metrics: [200] }];
    expect(formatYandexGeography(rows)).toEqual([{ country: "O'zbekiston", city: "Toshkent", visits: 200 }]);
  });
});

describe("formatYandexVisitsTotals", () => {
  it("maps the totals array in the requested metric order", () => {
    expect(formatYandexVisitsTotals([100, 80, 250, 45.67, 132.4])).toEqual({
      visits: 100,
      users: 80,
      pageviews: 250,
      bounceRatePct: 45.7,
      avgVisitDurationSec: 132,
    });
  });

  it("defaults to zeros when totals is empty", () => {
    expect(formatYandexVisitsTotals([])).toEqual({
      visits: 0,
      users: 0,
      pageviews: 0,
      bounceRatePct: 0,
      avgVisitDurationSec: 0,
    });
  });
});
