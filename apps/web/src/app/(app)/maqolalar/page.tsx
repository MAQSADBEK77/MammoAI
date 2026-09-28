"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkBorder, ChevronRight } from "@mui/icons-material";
import { articleArtPath, type Article } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Card, EmptyState, ErrorState, LoadingSpinner, ScreenHeader, SegmentedControl, Toast } from "@/components/ui";

type Tab = "all" | "saved";

export default function ArticlesPage() {
  const { dict } = useI18n();
  const [articles, setArticles] = useState<Article[] | null>(null);
  // UX-01: `.catch()` YO'Q edi — so'rov yiqilsa `articles` hech qachon
  // to'lmasdi va sahifa ABADIY "yuklanmoqda" holatida qotib qolardi.
  // Ilovaning boshqa ekranlarida bu sinf allaqachon tuzatilgan, bu sahifa
  // esa e'tibordan chetda qolgan edi.
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab] = useState<Tab>("all");
  const [saveError, setSaveError] = useState(false);

  const load = useCallback(() => {
    setLoadError(false);
    api.articles.list().then(setArticles).catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(load, 0);
    return () => clearTimeout(timeout);
  }, [load]);

  /**
   * BOOKMARK-01: belgini DARHOL almashtiramiz, so'rovni keyin yuboramiz —
   * aks holda sekin tarmoqda tugma "o'lik" bo'lib tuyulardi.
   *
   * MUHIM: so'rov yiqilsa holatni ORQAGA qaytaramiz va buni AYTAMIZ. Jim
   * qaytarish bu ilovadagi eski xatolar sinfini takrorlardi: ayol saqladim
   * deb o'ylab qoladi, keyin ro'yxat bo'sh chiqadi.
   */
  const toggleBookmark = useCallback((article: Article) => {
    const next = !article.isBookmarked;
    setSaveError(false);
    setArticles((prev) => prev?.map((a) => (a.id === article.id ? { ...a, isBookmarked: next } : a)) ?? prev);
    api.articles.setBookmark(article.slug, next).catch(() => {
      setSaveError(true);
      setArticles((prev) => prev?.map((a) => (a.id === article.id ? { ...a, isBookmarked: !next } : a)) ?? prev);
    });
  }, []);

  if (loadError) {
    return <ErrorState message={dict.common.errorGeneric} retry={{ label: dict.common.retryButton, onClick: load }} />;
  }
  if (!articles) return <LoadingSpinner label={dict.common.loading} />;

  const savedCount = articles.filter((a) => a.isBookmarked).length;
  const visible = tab === "saved" ? articles.filter((a) => a.isBookmarked) : articles;

  return (
    <div className="space-y-4 pb-6">
      <ScreenHeader title={dict.articles.title} />
      <p className="-mt-3 text-xs text-text-muted">{dict.articles.seedDataNotice}</p>

      {/* Hech narsa saqlanmagan bo'lsa filtr ham ko'rsatilmaydi — bo'sh
          "Saqlanganlar" bo'limi faqat joy egallardi. */}
      {savedCount > 0 && (
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "all", label: dict.articles.allTab },
            { value: "saved", label: `${dict.articles.savedTab} (${savedCount})` },
          ]}
        />
      )}

      {visible.length === 0 ? (
        <EmptyState message={dict.articles.savedEmpty} />
      ) : (
        visible.map((article) => (
          <Link key={article.id} href={`/maqolalar/${article.slug}`}>
            <Card interactive className="overflow-hidden !p-0">
              {/* ART-01: referensdagidek rasm kartaning TEPASINI egallaydi.
                  Fon kategoriyaga qarab ozgina farq qiladi — ro'yxat bir
                  xil rangdagi devorga aylanib qolmasin. */}
              <div className="relative flex h-28 items-center justify-center bg-surface-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- kichik statik SVG, next/image shart emas */}
                <img src={articleArtPath(article.slug, article.category)} alt="" className="h-20 w-20" />
                {/* Karta butunlay `Link` ichida — tugma bosilganda maqola
                    OCHILIB ketmasligi uchun hodisa to'xtatiladi. */}
                <button
                  type="button"
                  aria-label={article.isBookmarked ? dict.articles.unsaveAction : dict.articles.saveAction}
                  aria-pressed={article.isBookmarked}
                  className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-surface/90 text-text-muted shadow-sm transition-colors hover:text-primary"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    toggleBookmark(article);
                  }}
                >
                  {article.isBookmarked ? (
                    <Bookmark sx={{ fontSize: 20 }} className="text-primary" />
                  ) : (
                    <BookmarkBorder sx={{ fontSize: 20 }} />
                  )}
                </button>
              </div>
              <div className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Badge>{dict.articles.categories[article.category]}</Badge>
                  <p className="font-semibold text-text-primary">{article.title}</p>
                  <p className="line-clamp-2 text-sm text-text-secondary">{article.excerpt}</p>
                </div>
                <ChevronRight sx={{ fontSize: 18 }} className="mt-1 shrink-0 text-text-muted" />
              </div>
            </Card>
          </Link>
        ))
      )}

      {saveError && <Toast message={dict.articles.saveFailed} tone="error" />}
    </div>
  );
}
