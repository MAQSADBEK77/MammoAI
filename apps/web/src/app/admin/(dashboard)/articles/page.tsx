"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Article, ArticleCategory } from "@mammoai/shared";
import { adminApi } from "@/lib/admin-api";
import { Card, Button, Badge } from "@/components/ui";

const CATEGORIES: { value: ArticleCategory; label: string }[] = [
  { value: "cycle", label: "Hayz sikli" },
  { value: "pregnancy", label: "Homiladorlik" },
  { value: "checkups", label: "Tekshiruvlar" },
];

const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label])) as Record<ArticleCategory, string>;

// CONTENT-01: muallif va tibbiy ko'rik holati. Ular shunchaki qo'shimcha
// maydon emas: ilovada maqola "shifokor ko'rigidan o'tmagan" deb
// belgilanishi yoki muallif ismi bilan chiqishi shularga bog'liq.
type FormState = {
  slug: string;
  category: ArticleCategory;
  title: string;
  excerpt: string;
  body: string;
  authorName: string;
  authorCredential: string;
  isSeedData: boolean;
};

const EMPTY_FORM: FormState = { slug: "", category: "cycle", title: "", excerpt: "", body: "" , authorName: "", authorCredential: "", isSeedData: true};

function inputClass() {
  return "tap-target w-full rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  // WEB3-08: forma "dirty" (saqlanmagan o'zgarish bor) ekanligini bilish uchun
  // — forma ochilgan/muvaffaqiyatli saqlangan paytdagi qiymat bilan
  // solishtiriladi.
  const [initialForm, setInitialForm] = useState<FormState>(EMPTY_FORM);

  function isFormDirty(): boolean {
    return formOpen && JSON.stringify(form) !== JSON.stringify(initialForm);
  }

  /** Boshqa maqolani tahrirlashga/yangi maqola yaratishga o'tishdan oldin —
   * forma "dirty" bo'lsa, tasdiqlash so'raydi. Foydalanuvchi rad etsa
   * `false` qaytadi (chaqiruvchi hech narsa qilmasligi kerak). */
  function confirmDiscardIfDirty(): boolean {
    if (!isFormDirty()) return true;
    return window.confirm("Saqlanmagan o'zgarishlar bor. Ularni bekor qilib davom etasizmi?");
  }

  function load() {
    setLoading(true);
    adminApi.articles
      .list()
      .then(setArticles)
      .catch((err) => setError(err instanceof Error ? err.message : "Yuklashda xatolik"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const timeout = setTimeout(load, 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    if (!confirmDiscardIfDirty()) return;
    setEditingId(null);
    setForm(EMPTY_FORM);
    setInitialForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(article: Article) {
    if (!confirmDiscardIfDirty()) return;
    const next = {
      slug: article.slug,
      category: article.category,
      title: article.title,
      excerpt: article.excerpt,
      body: article.body,
      authorName: article.authorName ?? "",
      authorCredential: article.authorCredential ?? "",
      isSeedData: article.isSeedData,
    };
    setEditingId(article.id);
    setForm(next);
    setInitialForm(next);
    setFormOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    // WEB3-09: slugify() faqat lotin harflarini qabul qiladi (kirill/rus
    // sarlavha butunlay bo'sh slug'ga aylanadi) — bunday holatda avvalgidek
    // bo'sh slug bilan yuborish o'rniga (server keyin buni chalkash
    // "sarlavha kerak" xatosiga aylantirardi, aslida sarlavha bor edi),
    // aniq va tushunarli xato ko'rsatib, yuborishni to'xtatamiz.
    const slug = form.slug.trim() || slugify(form.title);
    if (!slug) {
      setError("Slug avtomatik yaratilmadi — sarlavha lotin harflarisiz bo'lishi mumkin. \"Slug\" maydoniga qo'lda (lotin harflarida) kiriting.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      slug,
      category: form.category,
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      body: form.body.trim(),
      authorName: form.authorName.trim() || null,
      authorCredential: form.authorCredential.trim() || null,
      isSeedData: form.isSeedData,
    };
    try {
      if (editingId) {
        await adminApi.articles.update(editingId, payload);
      } else {
        await adminApi.articles.create(payload);
      }
      setFormOpen(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(article: Article) {
    if (!window.confirm(`"${article.title}" maqolasini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await adminApi.articles.delete(article.id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "O'chirishda xatolik");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Maqolalar</h1>
          <p className="mt-1 text-sm text-text-secondary">Jami {articles.length} ta maqola bazada</p>
        </div>
        <Button onClick={openCreate}>+ Yangi maqola</Button>
      </div>

      {error && <Card className="border border-danger/20 bg-danger/5 text-sm font-medium text-danger">{error}</Card>}

      {formOpen && (
        <Card className="border border-primary/20">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h2 className="text-base font-bold text-text-primary">{editingId ? "Maqolani tahrirlash" : "Yangi maqola"}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input required placeholder="Sarlavha" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass()} />
              <input placeholder="Slug (bo'sh qoldirsa avtomatik)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass()} />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm({ ...form, category: c.value })}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    form.category === c.value ? "bg-primary text-white" : "bg-surface-muted text-text-secondary hover:bg-primary-light/40"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <textarea
              required
              placeholder="Qisqacha tavsif (excerpt)"
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              rows={2}
              className={`${inputClass()} h-auto! resize-none py-3`}
            />
            <textarea
              required
              placeholder="To'liq matn"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={8}
              className={`${inputClass()} h-auto! resize-y py-3`}
            />
            <div className="flex justify-end gap-2">
              <input

                placeholder="Muallif ismi (masalan: Dilnoza Karimova)"

                value={form.authorName}

                onChange={(e) => setForm({ ...form, authorName: e.target.value })}

                className={inputClass()}

              />

              <input

                placeholder="Malakasi (masalan: akusher-ginekolog, 12 yil tajriba)"

                value={form.authorCredential}

                onChange={(e) => setForm({ ...form, authorCredential: e.target.value })}

                className={inputClass()}

              />

              {/* CONTENT-01: bu belgi olib tashlanmaguncha ilovada ochiq

                  ogohlantirish chiqadi. Ataylab shunday: tibbiy matnni

                  tekshiruvsiz "ishonchli" deb ko'rsatib bo'lmaydi. */}

              <label className="flex items-start gap-2 text-sm text-text-secondary">

                <input

                  type="checkbox"

                  checked={!form.isSeedData}

                  onChange={(e) => setForm({ ...form, isSeedData: !e.target.checked })}

                  className="mt-0.5 h-4 w-4 accent-primary"

                />

                <span>

                  Shifokor ko&apos;rigidan o&apos;tgan

                  <span className="block text-xs text-text-muted">

                    Belgilanmasa, ilovada &quot;hali shifokor ko&apos;rigidan o&apos;tmagan&quot; ogohlantirishi ko&apos;rinadi.

                  </span>

                </span>

              </label>

              <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
                Bekor qilish
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saqlanmoqda…" : editingId ? "Saqlash" : "Qo'shish"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-text-muted">
                <th className="px-5 py-3">Sarlavha</th>
                <th className="px-5 py-3">Kategoriya</th>
                <th className="px-5 py-3">Slug</th>
                <th className="px-5 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-text-muted">
                    Yuklanmoqda…
                  </td>
                </tr>
              )}
              {!loading && articles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-text-muted">
                    Hozircha maqola yo&apos;q
                  </td>
                </tr>
              )}
              {!loading &&
                articles.map((a) => (
                  <tr key={a.id} className="border-b border-border/60 last:border-0 hover:bg-surface-muted/60">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-text-primary">{a.title}</div>
                      <div className="line-clamp-1 text-xs text-text-muted">{a.excerpt}</div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone="primary">{CATEGORY_LABELS[a.category] ?? a.category}</Badge>
                    </td>
                    <td className="px-5 py-3 text-text-secondary">{a.slug}</td>
                    <td className="px-5 py-3 text-right">
                      <button type="button" onClick={() => openEdit(a)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10">
                        Tahrirlash
                      </button>
                      <button type="button" onClick={() => handleDelete(a)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/10">
                        O&apos;chirish
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
