"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Article } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Card, LoadingSpinner, ErrorState } from "@/components/ui";

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
      <Card>
        <p className="whitespace-pre-line leading-relaxed text-text-secondary">{article.body}</p>
      </Card>
    </div>
  );
}
