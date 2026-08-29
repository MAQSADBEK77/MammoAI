"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Article } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Card, ScreenHeader } from "@/components/ui";

export default function ArticlesPage() {
  const { dict } = useI18n();
  const [articles, setArticles] = useState<Article[] | null>(null);

  useEffect(() => {
    api.articles.list().then(setArticles);
  }, []);

  if (!articles) return <p className="text-text-secondary">{dict.common.loading}</p>;

  return (
    <div className="space-y-4 pb-6">
      <ScreenHeader title={dict.articles.title} />
      <p className="-mt-3 text-xs text-text-muted">{dict.articles.seedDataNotice}</p>

      {articles.map((article) => (
        <Link key={article.id} href={`/maqolalar/${article.slug}`}>
          <Card className="space-y-2">
            <Badge>{dict.articles.categories[article.category]}</Badge>
            <p className="font-semibold text-text-primary">{article.title}</p>
            <p className="text-sm text-text-secondary">{article.excerpt}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
