"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Save, Trash2 } from "lucide-react";
import { Badge, Button, Card, Field, Input, Textarea } from "@/components/ui";
import {
  apiCreateArticle,
  apiCreateClinic,
  apiCreateFaqItem,
  apiDeleteArticle,
  apiDeleteClinic,
  apiDeleteFaqItem,
  apiGetAdminArticles,
  apiGetAdminClinics,
  apiGetAdminFaq,
  apiUpdateArticle,
  apiUpdateClinic,
  apiUpdateFaqItem,
  type Article,
  type Clinic,
  type FaqItem,
} from "@/lib/store";
import { useT } from "@/lib/i18n/context";

type Tab = "faq" | "clinics" | "articles";

export default function AdminContentPage() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("faq");

  const TABS: { id: Tab; label: string }[] = [
    { id: "faq", label: t.adminContent.faqTab },
    { id: "clinics", label: t.adminContent.clinicsTab },
    { id: "articles", label: t.adminContent.articlesTab },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.adminContent.title}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.adminContent.subtitle}</p>
      </div>

      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
              tab === tb.id
                ? "border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "faq" && <FaqTab t={t} />}
      {tab === "clinics" && <ClinicsTab t={t} />}
      {tab === "articles" && <ArticlesTab t={t} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

function FaqTab({ t }: { t: ReturnType<typeof useT> }) {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ question: string; answer: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reload() {
    apiGetAdminFaq().then(setItems);
  }
  useEffect(reload, []);

  function startNew() {
    setDraft({ question: "", answer: "" });
    setEditingId("new");
    setError(null);
  }
  function startEdit(item: FaqItem) {
    setDraft({ question: item.question, answer: item.answer });
    setEditingId(item.id);
    setError(null);
  }
  function cancel() {
    setDraft(null);
    setEditingId(null);
    setError(null);
  }

  async function save() {
    if (!draft) return;
    if (!draft.question.trim() || !draft.answer.trim()) {
      setError(t.adminContent.errorSave);
      return;
    }
    setSaving(true);
    try {
      const payload = { order: items.length, question: draft.question.trim(), answer: draft.answer.trim() };
      if (editingId === "new") await apiCreateFaqItem(payload);
      else await apiUpdateFaqItem(editingId!, payload);
      reload();
      cancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.adminContent.errorSave);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(t.adminContent.faqDeleteConfirm)) return;
    await apiDeleteFaqItem(id);
    reload();
  }

  return (
    <div className="flex flex-col gap-4">
      {editingId === null && (
        <Button onClick={startNew} className="self-start">
          <Plus size={15} />
          {t.adminContent.addButton}
        </Button>
      )}

      {draft && (
        <Card className="p-5">
          <div className="flex flex-col gap-3">
            <Field label={t.adminContent.faqQuestionLabel}>
              <Input
                value={draft.question}
                onChange={(e) => setDraft({ ...draft, question: e.target.value })}
                placeholder={t.adminContent.faqQuestionPlaceholder}
              />
            </Field>
            <Field label={t.adminContent.faqAnswerLabel}>
              <Textarea
                rows={3}
                value={draft.answer}
                onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
                placeholder={t.adminContent.faqAnswerPlaceholder}
              />
            </Field>
          </div>
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={cancel} disabled={saving}>
              {t.adminContent.cancelButton}
            </Button>
            <Button onClick={save} disabled={saving}>
              <Save size={15} />
              {t.adminContent.saveButton}
            </Button>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{item.question}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.answer}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => startEdit(item)} className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 cursor-pointer dark:text-slate-500 dark:hover:bg-blue-500/10 dark:hover:text-blue-400">
                  <Pencil size={15} />
                </button>
                <button onClick={() => remove(item.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {items.length === 0 && (
          <Card className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">{t.adminContent.faqEmpty}</Card>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Clinics
// ---------------------------------------------------------------------------

function ClinicsTab({ t }: { t: ReturnType<typeof useT> }) {
  const [items, setItems] = useState<Clinic[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; address: string; phone: string; note: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reload() {
    apiGetAdminClinics().then(setItems);
  }
  useEffect(reload, []);

  function startNew() {
    setDraft({ name: "", address: "", phone: "", note: "" });
    setEditingId("new");
    setError(null);
  }
  function startEdit(item: Clinic) {
    setDraft({ name: item.name, address: item.address, phone: item.phone, note: item.note });
    setEditingId(item.id);
    setError(null);
  }
  function cancel() {
    setDraft(null);
    setEditingId(null);
    setError(null);
  }

  async function save() {
    if (!draft) return;
    if (!draft.name.trim()) {
      setError(t.adminContent.errorSave);
      return;
    }
    setSaving(true);
    try {
      const payload = { order: items.length, ...draft };
      if (editingId === "new") await apiCreateClinic(payload);
      else await apiUpdateClinic(editingId!, payload);
      reload();
      cancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.adminContent.errorSave);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(t.adminContent.clinicDeleteConfirm)) return;
    await apiDeleteClinic(id);
    reload();
  }

  return (
    <div className="flex flex-col gap-4">
      {editingId === null && (
        <Button onClick={startNew} className="self-start">
          <Plus size={15} />
          {t.adminContent.addButton}
        </Button>
      )}

      {draft && (
        <Card className="p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t.adminContent.clinicNameLabel}>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder={t.adminContent.clinicNamePlaceholder} />
            </Field>
            <Field label={t.adminContent.clinicPhoneLabel}>
              <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder={t.adminContent.clinicPhonePlaceholder} />
            </Field>
            <Field label={t.adminContent.clinicAddressLabel}>
              <Input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} placeholder={t.adminContent.clinicAddressPlaceholder} />
            </Field>
            <Field label={t.adminContent.clinicNoteLabel}>
              <Input value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder={t.adminContent.clinicNotePlaceholder} />
            </Field>
          </div>
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={cancel} disabled={saving}>
              {t.adminContent.cancelButton}
            </Button>
            <Button onClick={save} disabled={saving}>
              <Save size={15} />
              {t.adminContent.saveButton}
            </Button>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                {item.address && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{item.address}</p>}
                {item.phone && <p className="text-sm text-slate-500 dark:text-slate-400">{item.phone}</p>}
                {item.note && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{item.note}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => startEdit(item)} className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 cursor-pointer dark:text-slate-500 dark:hover:bg-blue-500/10 dark:hover:text-blue-400">
                  <Pencil size={15} />
                </button>
                <button onClick={() => remove(item.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {items.length === 0 && (
          <Card className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">{t.adminContent.clinicEmpty}</Card>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

function ArticlesTab({ t }: { t: ReturnType<typeof useT> }) {
  const [items, setItems] = useState<Article[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ title: string; excerpt: string; content: string; published: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reload() {
    apiGetAdminArticles().then(setItems);
  }
  useEffect(reload, []);

  function startNew() {
    setDraft({ title: "", excerpt: "", content: "", published: true });
    setEditingId("new");
    setError(null);
  }
  function startEdit(item: Article) {
    setDraft({ title: item.title, excerpt: item.excerpt, content: item.content, published: item.published });
    setEditingId(item.id);
    setError(null);
  }
  function cancel() {
    setDraft(null);
    setEditingId(null);
    setError(null);
  }

  async function save() {
    if (!draft) return;
    if (!draft.title.trim() || !draft.content.trim()) {
      setError(t.adminContent.errorSave);
      return;
    }
    setSaving(true);
    try {
      if (editingId === "new") await apiCreateArticle(draft);
      else await apiUpdateArticle(editingId!, draft);
      reload();
      cancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.adminContent.errorSave);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(t.adminContent.articleDeleteConfirm)) return;
    await apiDeleteArticle(id);
    reload();
  }

  return (
    <div className="flex flex-col gap-4">
      {editingId === null && (
        <Button onClick={startNew} className="self-start">
          <Plus size={15} />
          {t.adminContent.addButton}
        </Button>
      )}

      {draft && (
        <Card className="p-5">
          <div className="flex flex-col gap-3">
            <Field label={t.adminContent.articleTitleLabel}>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder={t.adminContent.articleTitlePlaceholder} />
            </Field>
            <Field label={t.adminContent.articleExcerptLabel}>
              <Input value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} placeholder={t.adminContent.articleExcerptPlaceholder} />
            </Field>
            <Field label={t.adminContent.articleContentLabel}>
              <Textarea rows={8} value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} placeholder={t.adminContent.articleContentPlaceholder} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} />
              {t.adminContent.articlePublishedLabel}
            </label>
          </div>
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={cancel} disabled={saving}>
              {t.adminContent.cancelButton}
            </Button>
            <Button onClick={save} disabled={saving}>
              <Save size={15} />
              {t.adminContent.saveButton}
            </Button>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                  {!item.published && <Badge tone="yellow">{t.adminContent.draftBadge}</Badge>}
                </div>
                {item.excerpt && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.excerpt}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => startEdit(item)} className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 cursor-pointer dark:text-slate-500 dark:hover:bg-blue-500/10 dark:hover:text-blue-400">
                  <Pencil size={15} />
                </button>
                <button onClick={() => remove(item.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {items.length === 0 && (
          <Card className="p-8 text-center text-sm text-slate-400 dark:text-slate-500">{t.adminContent.articleEmpty}</Card>
        )}
      </div>
    </div>
  );
}
