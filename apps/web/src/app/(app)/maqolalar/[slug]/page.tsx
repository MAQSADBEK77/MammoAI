"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Article } from "@mammoai/shared";
import { ArticleBody } from "@/components/articles/ArticleBody";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Card, LoadingSpinner, ErrorState } from "@/components/ui";
import { ArticleComments } from "@/components/screens/ArticleComments";

export default function ArticleDetailPage() {
  const { dict } = useI18n();
  const params = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  // WEB3-11: ClinicsScreen'dagi FIX-UX-08 bilan bir xil naqsh — .catch()
  // yo'q edi, so'rov muvaffaqiyatsiz bo'lsa ekran ABADIY yuklanish
  // holatida qolib ketardi.
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(() => {
    setLoadError(false);
    setArticle(null);
    api.articles.get(params.slug).then(setArticle).catch(() => setLoadError(true));
  }, [params.slug]);

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
      <Badge>{dict.articles.categories[article.category]}</Badge>
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

      <ArticleComments slug={article.slug} />
    </div>
  );
}
