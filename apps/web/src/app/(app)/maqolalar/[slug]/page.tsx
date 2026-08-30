"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Article } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Card, LoadingSpinner } from "@/components/ui";

export default function ArticleDetailPage() {
  const { dict } = useI18n();
  const params = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    api.articles.get(params.slug).then(setArticle);
  }, [params.slug]);

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
