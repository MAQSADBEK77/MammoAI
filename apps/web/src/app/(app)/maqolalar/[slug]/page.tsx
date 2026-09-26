"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Bookmark, BookmarkBorder } from "@mui/icons-material";
import type { Article } from "@mammoai/shared";
import { ArticleBody } from "@/components/articles/ArticleBody";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Card, LoadingSpinner, ErrorState, Toast } from "@/components/ui";
import { ArticleComments } from "@/components/screens/ArticleComments";

export default function ArticleDetailPage() {
  const { dict } = useI18n();
  const params = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  // WEB3-11: ClinicsScreen'dagi FIX-UX-08 bilan bir xil naqsh — .catch()
  // yo'q edi, so'rov muvaffaqiyatsiz bo'lsa ekran ABADIY yuklanish
  // holatida qolib ketardi.
  const [loadError, setLoadError] = useState(false);
  /** ARTICLE-STRUCT-01: "Yana o'qing" — maqola oxiridagi bog'liq
   * maqolalar. Foydalanuvchi so'rovi: ayol o'qib tugatgach, KEYINGI
   * qadamsiz qolmasligi kerak ("beneficial for people to read and
   * explore"). Ilgari maqola tugagach faqat izohlar bo'lardi va
   * o'qishning davomi yo'q edi. */
  const [related, setRelated] = useState<Article[]>([]);
  const [saveError, setSaveError] = useState(false);

  const load = useCallback(() => {
    setLoadError(false);
    setArticle(null);
    api.articles.get(params.slug).then(setArticle).catch(() => setLoadError(true));
    // Bog'liq maqolalar ikkinchi darajali: yuklanmasa ham sahifa ishlaydi,
    // shuning uchun xatosi `loadError`ga ta'sir qilmaydi.
    api.articles.list().then(setRelated).catch(() => setRelated([]));
  }, [params.slug]);

  /**
   * BOOKMARK-01: belgi DARHOL almashadi, so'rov keyin ketadi — sekin
   * tarmoqda tugma "o'lik" bo'lib tuyulmasligi uchun. So'rov yiqilsa
   * holat ORQAGA qaytariladi va bu AYTILADI, jim qoldirilmaydi.
   */
  const toggleBookmark = useCallback(() => {
    setSaveError(false);
    setArticle((prev) => {
      if (!prev) return prev;
      const next = !prev.isBookmarked;
      api.articles.setBookmark(prev.slug, next).catch(() => {
        setSaveError(true);
        setArticle((cur) => (cur ? { ...cur, isBookmarked: !next } : cur));
      });
      return { ...prev, isBookmarked: next };
    });
  }, []);

  useEffect(() => {
    // setTimeout(0): `load()` sinxron `setState` chaqiradi (loadError/article
    // reset) — effekt ichida to'g'ridan-to'g'ri chaqirilsa ESLint qoidasi
    // ("Calling setState synchronously within an effect") xato beradi
    // (ClinicsScreen'da ham bir xil naqsh).
    const timeout = setTimeout(load, 0);
    return () => clearTimeout(timeout);
  }, [load]);

  if (loadError) {
    return <ErrorState message={dict.common.errorGeneric} retry={{ label: dict.common.retryButton, onClick: load }} />;
  }
  if (!article) return <LoadingSpinner label={dict.common.loading} />;

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-start justify-between gap-3">
        <Badge>{dict.articles.categories[article.category]}</Badge>
        <button
          type="button"
          aria-label={article.isBookmarked ? dict.articles.unsaveAction : dict.articles.saveAction}
          aria-pressed={article.isBookmarked}
          className="-m-2 shrink-0 p-2 text-text-muted transition-colors hover:text-primary"
          onClick={toggleBookmark}
        >
          {article.isBookmarked ? (
            <Bookmark sx={{ fontSize: 22 }} className="text-primary" />
          ) : (
            <BookmarkBorder sx={{ fontSize: 22 }} />
          )}
        </button>
      </div>
      <h1 className="text-2xl font-bold text-text-primary">{article.title}</h1>

      {/* CONTENT-01: kim tekshirgani va qancha vaqt olishi — sarlavha
          ostida, matndan OLDIN. Sog'liq kontentida "kimning so'zi" degan
          savol birinchi keladi; uni maqolaning oxiriga yashirish
          ishonchni kamaytiradi. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
        {article.authorName && (
          <span className="font-semibold text-text-secondary">
            {article.authorName}
            {article.authorCredential && <span className="font-normal text-text-muted">, {article.authorCredential}</span>}
          </span>
        )}
        <span>{dict.articles.readingTime(article.readingMinutes)}</span>
      </div>

      {/* Muallif ko'rsatilmagan bo'lsa buni JIM qoldirmaymiz — ayol
          o'qiyotgan narsasi tibbiy ko'rikdan o'tgan-o'tmaganini bilishi
          kerak. */}
      {article.isSeedData && (
        <div className="rounded-2xl border border-warning/20 bg-warning/5 px-4 py-3">
          <p className="text-xs leading-relaxed text-text-secondary">{dict.articles.unreviewedNotice}</p>
        </div>
      )}

      <Card>
        <ArticleBody body={article.body} />
      </Card>

      {article.sources.length > 0 && (
        <Card className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-text-muted">{dict.articles.sourcesTitle}</p>
          <ul className="space-y-1">
            {article.sources.map((src) => (
              <li key={src.label} className="text-sm text-text-secondary">
                {src.url ? (
                  <a href={src.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                    {src.label}
                  </a>
                ) : (
                  src.label
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Avval SHU bo'limdagi maqolalar (mavzu yaqinroq), yetmasa
          boshqalari bilan to'ldiriladi — ro'yxat doim to'la bo'lsin. */}
      {(() => {
        const others = related.filter((a) => a.slug !== article.slug);
        const picks = [
          ...others.filter((a) => a.category === article.category),
          ...others.filter((a) => a.category !== article.category),
        ].slice(0, 3);
        if (picks.length === 0) return null;
        return (
          <Card className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted">{dict.articles.relatedTitle}</p>
            <div className="space-y-2">
              {picks.map((a) => (
                <Link key={a.slug} href={`/maqolalar/${a.slug}`} className="block">
                  <div className="rounded-2xl bg-surface-muted px-4 py-3 transition active:scale-[0.99]">
                    <p className="text-sm font-bold leading-snug text-text-primary">{a.title}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {dict.articles.categories[a.category]} · {dict.articles.readingTime(a.readingMinutes)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        );
      })()}

      <ArticleComments slug={article.slug} />

      {saveError && <Toast message={dict.articles.saveFailed} tone="error" />}
    </div>
  );
}
