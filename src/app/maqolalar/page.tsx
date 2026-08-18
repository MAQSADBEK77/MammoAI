"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui";
import { apiGetArticles, type Article } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/context";

export default function ArticlesPage() {
  const { t, language } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    apiGetArticles().then(setArticles);
  }, []);

  return (
    <div className="flex min-h-full flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <Newspaper size={22} />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">{t.articlesPage.title}</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">{t.articlesPage.subtitle}</p>
        </div>

        <div className="mt-10 flex flex-col gap-4">
          {articles.map((a) => (
            <Link key={a.id} href={`/maqolalar/${a.slug}`}>
              <Card className="p-5 transition-shadow hover:shadow-md">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {formatDate(a.createdAt, language)}
                </p>
                <h2 className="mt-1 font-semibold text-slate-900 dark:text-white">{a.title}</h2>
                {a.excerpt && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{a.excerpt}</p>}
              </Card>
            </Link>
          ))}
          {articles.length === 0 && (
            <Card className="p-10 text-center text-sm text-slate-400 dark:text-slate-500">{t.articlesPage.empty}</Card>
          )}
        </div>
      </main>
    </div>
  );
}
