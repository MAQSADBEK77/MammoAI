"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SearchOutlined } from "@mui/icons-material";
import clsx from "clsx";
import {
  PREGNANCY_FOODS,
  searchPregnancyFoods,
  type FoodGroup,
  type FoodItem,
  type FoodVerdict,
} from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { ScreenHeader } from "@/components/ui";

/**
 * PREG-FOOD-01 — "Mumkinmi?" ekrani.
 *
 * Bitta qoida: javob QIDIRUVDAN keyin darhol ko'rinadi, bosish shart
 * emas. Homilador ayol bu ekranni dasturxon ustida ochadi; qo'shimcha
 * bosish har safar uni sekinlashtiradi.
 *
 * Ro'yxat bo'sh so'rovda ham TO'LIQ ko'rsatiladi — chunki ko'pchilik
 * nimani so'rashni bilmaydi, ular "nima mumkin emas ekan?" deb VARAQLAB
 * chiqadi. Bo'sh qidiruv oynasi bu ehtiyojni yopardi.
 */
const GROUP_ORDER: FoodGroup[] = ["dairy", "meat", "drinks", "produce", "other"];

const VERDICT_STYLE: Record<FoodVerdict, string> = {
  safe: "bg-success/12 text-success",
  limit: "bg-warning/15 text-warning",
  avoid: "bg-danger/12 text-danger",
};

export function FoodSafetyScreen() {
  const { dict } = useI18n();
  const t = dict.pregnancy;
  const [query, setQuery] = useState("");
  const [verdictFilter, setVerdictFilter] = useState<FoodVerdict | null>(null);

  const results = useMemo(() => {
    const found = searchPregnancyFoods(query, (id) => t.foodList[id as keyof typeof t.foodList]?.name ?? id);
    return verdictFilter ? found.filter((f) => f.verdict === verdictFilter) : found;
  }, [query, verdictFilter, t]);

  // Qidirilayotganda guruhlash faqat xalaqit beradi — natija oz, lekin
  // sarlavhalar orasiga sochilib ketadi. Shuning uchun so'rov bo'lsa
  // ro'yxat tekis (moslik tartibida) ko'rsatiladi.
  const grouped = query.trim().length === 0;

  return (
    <div className="space-y-4 pb-8">
      <ScreenHeader title={t.foodTitle} subtitle={t.foodSubtitle} />

      <div className="relative">
        <SearchOutlined
          sx={{ fontSize: 20 }}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.foodSearchPlaceholder}
          className="tap-target w-full rounded-full border border-border bg-surface pl-11 pr-4 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["safe", "limit", "avoid"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVerdictFilter((cur) => (cur === v ? null : v))}
            className={clsx(
              "shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors",
              verdictFilter === v ? VERDICT_STYLE[v] : "bg-surface text-text-secondary"
            )}
          >
            {t.foodVerdicts[v]}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <p className="rounded-3xl bg-surface p-6 text-center text-sm leading-relaxed text-text-muted">{t.foodEmpty}</p>
      ) : grouped ? (
        <div className="space-y-5">
          {GROUP_ORDER.map((g) => {
            const items = results.filter((f) => f.group === g);
            if (items.length === 0) return null;
            return (
              <section key={g} className="space-y-2">
                <h2 className="px-1 text-xs font-bold uppercase tracking-wide text-text-muted">{t.foodGroups[g]}</h2>
                <div className="space-y-2">
                  {items.map((item) => (
                    <FoodRow key={item.id} item={item} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((item) => (
            <FoodRow key={item.id} item={item} />
          ))}
        </div>
      )}

      <Link
        href="/maqolalar/homiladorlikda-ovqatlanish"
        className="block rounded-3xl bg-surface p-4 text-sm font-semibold text-primary shadow-sm"
      >
        {t.foodArticleLink}
      </Link>

      <p className="px-1 text-[11px] leading-relaxed text-text-muted">{t.foodDisclaimer}</p>
    </div>
  );
}

function FoodRow({ item }: { item: FoodItem }) {
  const { dict } = useI18n();
  const t = dict.pregnancy;
  const entry = t.foodList[item.id as keyof typeof t.foodList];
  return (
    <div className="flex items-start gap-3 rounded-3xl bg-surface p-4 shadow-sm">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-snug text-text-primary">{entry?.name ?? item.id}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{entry?.note}</p>
      </div>
      <span className={clsx("shrink-0 rounded-full px-3 py-1 text-[11px] font-bold", VERDICT_STYLE[item.verdict])}>
        {t.foodVerdicts[item.verdict]}
      </span>
    </div>
  );
}

/** Bosh ekrandagi plitka nechta mahsulot borligini aytishi uchun. */
export const FOOD_ITEM_COUNT = PREGNANCY_FOODS.length;
