"use client";

import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui";
import { apiGetFaq, type FaqItem } from "@/lib/store";
import { useLanguage } from "@/lib/i18n/context";

export default function FaqPage() {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<FaqItem[]>([]);

  useEffect(() => {
    apiGetFaq().then(setItems);
  }, []);

  function localized(item: FaqItem) {
    if (language === "uz") return { question: item.question, answer: item.answer };
    const tr = item.translations?.[language];
    return { question: tr?.question?.trim() || item.question, answer: tr?.answer?.trim() || item.answer };
  }

  return (
    <div className="flex min-h-full flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400">
            <HelpCircle size={22} />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-pink-900 dark:text-white sm:text-3xl">{t.faqPage.title}</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">{t.faqPage.subtitle}</p>
        </div>

        <div className="mt-10 flex flex-col gap-4">
          {items.map((item) => {
            const l = localized(item);
            return (
              <Card key={item.id} className="p-5">
                <h2 className="font-semibold text-pink-900 dark:text-white">{l.question}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{l.answer}</p>
              </Card>
            );
          })}
          {items.length === 0 && (
            <Card className="p-10 text-center text-sm text-slate-400 dark:text-slate-500">{t.faqPage.empty}</Card>
          )}
        </div>
      </main>
    </div>
  );
}
