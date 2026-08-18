"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Pencil,
  Plus,
  Save,
  Trash2,
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
import type { QuizQuestion } from "@/lib/types";

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
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<QuizQuestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reload() {
    apiGetQuestions().then(setQuestions);
  }

  useEffect(reload, []);

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
      setError("Savol matnini kiriting.");
      return;
    }
    const validOptions = draft.options.filter((o) => o.text.trim());
    if (validOptions.length < 2) {
      setError("Kamida 2 ta javob varianti bo'lishi kerak.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = { category: draft.category, text: draft.text, order: draft.order, options: validOptions };
      if (editingId === "new") {
        await apiCreateQuestion(payload);
      } else {
        await apiUpdateQuestion(draft.id, payload);
      }
      reload();
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saqlab bo'lmadi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Ushbu savolni o'chirmoqchimisiz?")) return;
    try {
      await apiDeleteQuestion(id);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "O'chirib bo'lmadi.");
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
      setError(err instanceof Error ? err.message : "Tartibni o'zgartirib bo'lmadi.");
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Test savollari</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Foydalanuvchilarga ko&apos;rsatiladigan test savollari va ularning
            xavf ballarini boshqaring.
          </p>
        </div>
        {editingId === null && (
          <Button onClick={startNew}>
            <Plus size={15} />
            Yangi savol qo&apos;shish
          </Button>
        )}
      </div>

      {editingId === "new" && draft && (
        <QuestionEditor
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
                  <Badge tone="blue">{q.category || "Kategoriyasiz"}</Badge>
                  <h3 className="mt-2 font-semibold text-slate-900 dark:text-white">
                    {index + 1}. {q.text}
                  </h3>
                  <ul className="mt-2 flex flex-col gap-1">
                    {q.options.map((o) => (
                      <li key={o.id} className="text-sm text-slate-500 dark:text-slate-400">
                        · {o.text}{" "}
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                          (ball: {o.score})
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
                    title="Yuqoriga"
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === questions.length - 1}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30 cursor-pointer dark:text-slate-500 dark:hover:bg-slate-800"
                    title="Pastga"
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    onClick={() => startEdit(q)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 cursor-pointer dark:text-slate-500 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                    title="Tahrirlash"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    title="O'chirish"
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
            Hali savollar qo&apos;shilmagan.
          </Card>
        )}
      </div>
    </div>
  );
}

function QuestionEditor({
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
  return (
    <Card className="animate-pop-in border-blue-200 p-5 ring-2 ring-blue-100 dark:border-blue-500/30 dark:ring-blue-500/10">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kategoriya" hint="Masalan: Alomatlar, Oilaviy tarix">
          <Input
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            placeholder="Kategoriya nomi"
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Savol matni">
          <Input
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            placeholder="Savolni kiriting"
          />
        </Field>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Javob variantlari</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Har bir variant uchun xavf ballini belgilang (0 — xavfsiz, katta son — yuqori xavf).
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {draft.options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2">
              <Input
                value={option.text}
                onChange={(e) => onUpdateOption(index, { text: e.target.value })}
                placeholder={`Variant ${index + 1}`}
                className="flex-1"
              />
              <Input
                type="number"
                value={option.score}
                onChange={(e) => onUpdateOption(index, { score: Number(e.target.value) })}
                className="w-20"
                aria-label="Ball"
              />
              <button
                onClick={() => onRemoveOption(index)}
                disabled={draft.options.length <= 2}
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 cursor-pointer dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={onAddOption}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer dark:text-blue-400 dark:hover:text-blue-300"
        >
          <Plus size={14} />
          Variant qo&apos;shish
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Bekor qilish
        </Button>
        <Button onClick={onSave} disabled={saving}>
          <Save size={15} />
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </div>
    </Card>
  );
}
