"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Article, ArticleCategory } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Card, ScreenHeader } from "@/components/ui";

const CATEGORY_EMOJI: Record<ArticleCategory, string> = { cycle: "🩸", pregnancy: "🤰", checkups: "🩺" };
const CATEGORY_TINT: Record<ArticleCategory, string> = { cycle: "bg-primary/15", pregnancy: "bg-secondary/15", checkups: "bg-accent/15" };

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
          <Card className="flex items-start gap-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg ${CATEGORY_TINT[article.category]}`}>
              {CATEGORY_EMOJI[article.category]}
            </span>
            <div className="min-w-0 flex-1 space-y-1.5">
              <Badge>{dict.articles.categories[article.category]}</Badge>
              <p className="font-semibold text-text-primary">{article.title}</p>
              <p className="line-clamp-2 text-sm text-text-secondary">{article.excerpt}</p>
            </div>
            <ChevronRight size={18} className="mt-1 shrink-0 text-text-muted" />
          </Card>
        </Link>
      ))}
    </div>
  );
}
