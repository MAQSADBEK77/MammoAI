"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Card, LinkButton } from "@/components/ui";
import { apiGetArticle, type Article } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/context";

export default function ArticleDetailPage() {
  const { t, language } = useLanguage();
  const params = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    apiGetArticle(params.slug).then(setArticle).catch(() => setNotFound(true));
  }, [params.slug]);

  return (
    <div className="flex min-h-full flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-14 sm:px-6 lg:px-8">
        <LinkButton href="/maqolalar" variant="ghost">
          {t.articlesPage.backToList}
        </LinkButton>

        {article && (
          <Card className="mt-6 p-6 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {formatDate(article.createdAt, language)}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{article.title}</h1>
            <div className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {article.content}
            </div>
          </Card>
        )}
        {notFound && (
          <Card className="mt-6 p-10 text-center text-sm text-slate-400 dark:text-slate-500">{t.articlesPage.empty}</Card>
        )}
      </main>
    </div>
  );
}
