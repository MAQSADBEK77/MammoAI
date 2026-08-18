"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Badge, Button, Card, Field, Input } from "@/components/ui";
import {
  apiCreateQuestion,
  apiDeleteQuestion,
  apiGetQuestions,
  apiReorderQuestions,
  apiUpdateQuestion,
} from "@/lib/store";
import { uid } from "@/lib/id";
import { downloadCsv, parseCsv } from "@/lib/csv";
import { useT } from "@/lib/i18n/context";
import type { Dictionary, Language } from "@/lib/i18n/types";
import type { QuizQuestion } from "@/lib/types";

// CSV import/export format: order,category,text,options — options packs
// "text:score" pairs separated by "|" so an arbitrary number of answer
// options fits in one cell (e.g. "Yo'q:0|Ha:2").
function parseOptionsCell(cell: string) {
  return cell
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const idx = part.lastIndexOf(":");
      const text = (idx === -1 ? part : part.slice(0, idx)).trim();
      const score = idx === -1 ? 0 : Number(part.slice(idx + 1).trim()) || 0;
      return { id: uid("o"), text, score };
    });
}

function optionsToCell(options: { text: string; score: number }[]) {
  return options.map((o) => `${o.text}:${o.score}`).join("|");
}

const TRANSLATABLE_LANGS: Language[] = ["ru", "en"];
const LANG_LABEL: Record<Language, string> = { uz: "O'zbekcha", ru: "Русский", en: "English" };

function emptyDraft(order: number): QuizQuestion {
  return {
    id: "new",
    order,
    category: "",
    text: "",
    options: [
      { id: uid("o"), text: "", score: 0 },
      { id: uid("o"), text: "", score: 1 },
    ],
  };
}

export default function AdminQuizPage() {
  const t = useT();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<QuizQuestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reload() {
    apiGetQuestions().then(setQuestions);
  }

  useEffect(reload, []);

  function exportQuestionsCsv() {
    downloadCsv(
      "savollar.csv",
      ["order", "category", "text", "options"],
      questions.map((q) => [q.order, q.category, q.text, optionsToCell(q.options)])
    );
  }

  function downloadTemplate() {
    downloadCsv(
      "savollar-namunasi.csv",
      ["order", "category", "text", "options"],
      [
        [1, "Umumiy ma'lumot", "Yoshingiz nechida?", "30 yoshgacha:0|30-39 yosh:1|40 yosh va undan katta:2"],
        [2, "Oilaviy tarix", "Oilangizda ko'krak saratoni tarixi bormi?", "Yo'q:0|Bor:3"],
      ]
    );
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    setImportMessage(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      // Skip a header row if present (first cell isn't a number).
      const dataRows = rows.length && Number.isNaN(Number(rows[0][0])) ? rows.slice(1) : rows;

      let created = 0;
      let base = questions.length;
      for (const row of dataRows) {
        const [orderCell, category, text, optionsCell] = row;
        const options = parseOptionsCell(optionsCell ?? "");
        if (!text?.trim() || options.length < 2) continue;
        base += 1;
        await apiCreateQuestion({
          order: Number(orderCell) || base,
          category: category?.trim() ?? "",
          text: text.trim(),
          options,
        });
        created += 1;
      }
      setImportMessage(t.adminQuiz.importSuccess.replace("{count}", String(created)));
      reload();
    } catch {
      setImportMessage(t.adminQuiz.importError);
    } finally {
      setImporting(false);
    }
  }

  function startNew() {
    setDraft(emptyDraft(questions.length + 1));
    setEditingId("new");
    setError(null);
  }

  function startEdit(q: QuizQuestion) {
    setDraft(JSON.parse(JSON.stringify(q)));
    setEditingId(q.id);
    setError(null);
  }

  function cancelEdit() {
    setDraft(null);
    setEditingId(null);
    setError(null);
  }

  async function handleSave() {
    if (!draft) return;
    if (!draft.text.trim()) {
      setError(t.adminQuiz.errorQuestionText);
      return;
    }
    const validOptions = draft.options.filter((o) => o.text.trim());
    if (validOptions.length < 2) {
      setError(t.adminQuiz.errorMinOptions);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        category: draft.category,
        text: draft.text,
        order: draft.order,
        options: validOptions,
        translations: draft.translations,
      };
      if (editingId === "new") {
        await apiCreateQuestion(payload);
      } else {
        await apiUpdateQuestion(draft.id, payload);
      }
      reload();
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.adminQuiz.errorSave);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t.adminQuiz.deleteConfirm)) return;
    try {
      await apiDeleteQuestion(id);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.adminQuiz.deleteError);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const next = [...questions];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setQuestions(next); // optimistic
    try {
      await apiReorderQuestions(next.map((q) => q.id));
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.adminQuiz.reorderError);
      reload();
    }
  }

  function updateOption(index: number, patch: Partial<{ text: string; score: number }>) {
    if (!draft) return;
    const options = draft.options.map((o, i) => (i === index ? { ...o, ...patch } : o));
    setDraft({ ...draft, options });
  }

  function addOption() {
    if (!draft) return;
    setDraft({ ...draft, options: [...draft.options, { id: uid("o"), text: "", score: 0 }] });
  }

  function removeOption(index: number) {
    if (!draft) return;
    setDraft({ ...draft, options: draft.options.filter((_, i) => i !== index) });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-pink-900 dark:text-white">{t.adminQuiz.title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.adminQuiz.subtitle}</p>
        </div>
        {editingId === null && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={exportQuestionsCsv}>
              <Download size={15} />
              {t.adminUsers.exportCsv}
            </Button>
            <Button variant="ghost" onClick={downloadTemplate}>
              <Download size={15} />
              {t.adminQuiz.downloadTemplateButton}
            </Button>
            <input ref={fileInputRef} type="file" accept=".csv" hidden onChange={handleImportFile} />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              <Upload size={15} />
              {importing ? t.common.saving : t.adminQuiz.importCsvButton}
            </Button>
            <Button onClick={startNew}>
              <Plus size={15} />
              {t.adminQuiz.addButton}
            </Button>
          </div>
        )}
      </div>

      {importMessage && (
        <p className="rounded-lg bg-pink-50 px-3.5 py-2.5 text-sm text-pink-700 dark:bg-pink-500/10 dark:text-pink-300">
          {importMessage}
        </p>
      )}

      {editingId === "new" && draft && (
        <QuestionEditor
          t={t}
          draft={draft}
          setDraft={setDraft}
          error={error}
          saving={saving}
          onCancel={cancelEdit}
          onSave={handleSave}
          onUpdateOption={updateOption}
          onAddOption={addOption}
          onRemoveOption={removeOption}
        />
      )}

      <div className="flex flex-col gap-4">
        {questions.map((q, index) =>
          editingId === q.id && draft ? (
            <QuestionEditor
              key={q.id}
              t={t}
              draft={draft}
              setDraft={setDraft}
              error={error}
              saving={saving}
              onCancel={cancelEdit}
              onSave={handleSave}
              onUpdateOption={updateOption}
              onAddOption={addOption}
              onRemoveOption={removeOption}
            />
          ) : (
            <Card key={q.id} className="animate-fade-in p-5 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge tone="pink">{q.category || t.adminQuiz.noCategory}</Badge>
                  <h3 className="mt-2 font-semibold text-pink-900 dark:text-white">
                    {index + 1}. {q.text}
                  </h3>
                  <ul className="mt-2 flex flex-col gap-1">
                    {q.options.map((o) => (
                      <li key={o.id} className="text-sm text-slate-500 dark:text-slate-400">
                        · {o.text}{" "}
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                          ({t.adminQuiz.ballLabel}: {o.score})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30 cursor-pointer dark:text-slate-500 dark:hover:bg-slate-800"
                    title={t.adminQuiz.moveUp}
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === questions.length - 1}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30 cursor-pointer dark:text-slate-500 dark:hover:bg-slate-800"
                    title={t.adminQuiz.moveDown}
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    onClick={() => startEdit(q)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-pink-50 hover:text-pink-600 cursor-pointer dark:text-slate-500 dark:hover:bg-pink-500/10 dark:hover:text-pink-400"
                    title={t.adminQuiz.editTitle}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    title={t.adminQuiz.deleteTitle}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </Card>
          )
        )}

        {questions.length === 0 && editingId === null && (
          <Card className="p-10 text-center text-sm text-slate-400 dark:text-slate-500">
            {t.adminQuiz.empty}
          </Card>
        )}
      </div>
    </div>
  );
}

function QuestionEditor({
  t,
  draft,
  setDraft,
  error,
  saving,
  onCancel,
  onSave,
  onUpdateOption,
  onAddOption,
  onRemoveOption,
}: {
  t: Dictionary;
  draft: QuizQuestion;
  setDraft: (q: QuizQuestion) => void;
  error: string | null;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
  onUpdateOption: (index: number, patch: Partial<{ text: string; score: number }>) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
}) {
  const [activeLang, setActiveLang] = useState<Language>("uz");

  function setTranslatedText(value: string) {
    if (activeLang === "uz") {
      setDraft({ ...draft, text: value });
      return;
    }
    setDraft({
      ...draft,
      translations: {
        ...draft.translations,
        [activeLang]: { ...draft.translations?.[activeLang], text: value },
      },
    });
  }

  function setTranslatedOptionText(optionId: string, value: string) {
    if (activeLang === "uz") return; // base text is edited via onUpdateOption
    setDraft({
      ...draft,
      translations: {
        ...draft.translations,
        [activeLang]: {
          ...draft.translations?.[activeLang],
          options: { ...draft.translations?.[activeLang]?.options, [optionId]: value },
        },
      },
    });
  }

  const questionFieldValue = activeLang === "uz" ? draft.text : draft.translations?.[activeLang]?.text ?? "";

  return (
    <Card className="animate-pop-in border-pink-200 p-5 ring-2 ring-pink-100 dark:border-pink-500/30 dark:ring-pink-500/10">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.adminQuiz.categoryLabel} hint={t.adminQuiz.categoryHint}>
          <Input
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            placeholder={t.adminQuiz.categoryPlaceholder}
          />
        </Field>
      </div>

      <div className="mt-5 flex items-center gap-1 border-b border-slate-200 dark:border-slate-700">
        {(["uz", ...TRANSLATABLE_LANGS] as Language[]).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setActiveLang(lang)}
            className={`border-b-2 px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
              activeLang === lang
                ? "border-pink-600 text-pink-700 dark:border-pink-400 dark:text-pink-300"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            }`}
          >
            {lang === "uz" ? t.adminQuiz.baseLanguageLabel : LANG_LABEL[lang]}
          </button>
        ))}
      </div>
      {activeLang !== "uz" && <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{t.adminQuiz.translationsHint}</p>}

      <div className="mt-4">
        <Field label={t.adminQuiz.questionLabel}>
          <Input
            value={questionFieldValue}
            onChange={(e) => setTranslatedText(e.target.value)}
            placeholder={t.adminQuiz.questionPlaceholder}
          />
        </Field>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t.adminQuiz.optionsLabel}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{t.adminQuiz.optionsHint}</p>
        <div className="mt-3 flex flex-col gap-2">
          {draft.options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2">
              <Input
                value={activeLang === "uz" ? option.text : draft.translations?.[activeLang]?.options?.[option.id] ?? ""}
                onChange={(e) =>
                  activeLang === "uz" ? onUpdateOption(index, { text: e.target.value }) : setTranslatedOptionText(option.id, e.target.value)
                }
                placeholder={`${t.adminQuiz.optionPlaceholder} ${index + 1}`}
                className="flex-1"
              />
              {activeLang === "uz" && (
                <Input
                  type="number"
                  value={option.score}
                  onChange={(e) => onUpdateOption(index, { score: Number(e.target.value) })}
                  className="w-20"
                  aria-label={t.adminQuiz.scoreAriaLabel}
                />
              )}
              {activeLang === "uz" && (
                <button
                  onClick={() => onRemoveOption(index)}
                  disabled={draft.options.length <= 2}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 cursor-pointer dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
        {activeLang === "uz" && (
          <button
            onClick={onAddOption}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-pink-600 hover:text-pink-700 cursor-pointer dark:text-pink-400 dark:hover:text-pink-300"
          >
            <Plus size={14} />
            {t.adminQuiz.addOption}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          {t.common.cancel}
        </Button>
        <Button onClick={onSave} disabled={saving}>
          <Save size={15} />
          {saving ? t.common.saving : t.common.save}
        </Button>
      </div>
    </Card>
  );
}
