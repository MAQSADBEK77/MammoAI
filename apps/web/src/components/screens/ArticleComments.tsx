"use client";

import { useCallback, useEffect, useState } from "react";
import { DeleteOutlined } from "@mui/icons-material";
import type { ArticleComment } from "@mammoai/shared";
import { ApiError, translateApiError } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { useConfirm } from "@/lib/confirm";
import { api } from "@/lib/api";
import { Button, Card, LoadingSpinner, Toast } from "@/components/ui";

/**
 * CONTENT-02 — maqola ostidagi izohlar.
 *
 * Nega jamiyat lentasidan alohida: bu yerdagi savol KONTENTGA tegishli
 * ("bu tekshiruvni qayerda qilsam bo'ladi?", "menda ham shunday bo'lgan").
 * Jamiyat lentasi esa umumiy tajriba almashish uchun. Ikkalasini
 * aralashtirsak, maqolaga berilgan savol lentada yo'qolib ketadi.
 *
 * Anonimlik: ism SERVER TOMONDA olib tashlanadi (repo.ts), mijozga
 * yuborilib keyin yashirilmaydi — aks holda u tarmoq javobida ko'rinib
 * qolardi.
 */
export function ArticleComments({ slug }: { slug: string }) {
  const { dict } = useI18n();
  const confirm = useConfirm();
  const [comments, setComments] = useState<ArticleComment[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [draft, setDraft] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState<{ message: string; tone: "error" | "success" } | null>(null);

  const load = useCallback(() => {
    setLoadError(false);
    api.articles
      .comments(slug)
      .then((res) => setComments(res.comments))
      .catch(() => setLoadError(true));
  }, [slug]);

  useEffect(() => {
    const timeout = setTimeout(load, 0);
    return () => clearTimeout(timeout);
  }, [load]);

  function showFlash(message: string, tone: "error" | "success") {
    setFlash({ message, tone });
    setTimeout(() => setFlash(null), tone === "error" ? 5000 : 2000);
  }

  async function submit() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await api.articles.addComment(slug, { body: text, isAnonymous: anonymous });
      setComments((prev) => [...(prev ?? []), res.comment]);
      setDraft("");
      setAnonymous(false);
    } catch (err) {
      showFlash(err instanceof ApiError ? translateApiError(err, dict) : dict.common.errorGeneric, "error");
    } finally {
      setSending(false);
    }
  }

  async function remove(comment: ArticleComment) {
    if (!(await confirm({ message: dict.community.deleteCommentConfirm, destructive: true }))) return;
    // Optimistik: darhol yo'qoladi, xato bo'lsa qaytariladi.
    const previous = comments;
    setComments((prev) => (prev ?? []).filter((c) => c.id !== comment.id));
    try {
      await api.articles.deleteComment(slug, comment.id);
    } catch {
      setComments(previous);
      showFlash(dict.common.errorGeneric, "error");
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-text-primary">{dict.articles.commentsTitle}</h2>

      <Card className="space-y-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={dict.articles.commentPlaceholder}
          rows={3}
          className="w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
        />
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="h-4 w-4 accent-primary" />
            {dict.community.postAnonymouslyLabel}
          </label>
          <Button onClick={submit} disabled={!draft.trim() || sending}>
            {dict.articles.commentSend}
          </Button>
        </div>
      </Card>

      {loadError ? (
        <Card className="text-center text-sm text-text-secondary">
          {dict.common.errorGeneric}{" "}
          <button type="button" onClick={load} className="font-semibold text-primary-dark underline">
            {dict.common.retryButton}
          </button>
        </Card>
      ) : comments === null ? (
        <LoadingSpinner label={dict.common.loading} inline />
      ) : comments.length === 0 ? (
        <p className="px-1 text-sm text-text-muted">{dict.articles.commentsEmpty}</p>
      ) : (
        comments.map((c) => (
          <Card key={c.id} className="space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-text-primary">{c.authorName ?? dict.community.anonymousAuthor}</p>
              {c.isMine && (
                <button
                  type="button"
                  onClick={() => remove(c)}
                  aria-label={dict.common.delete}
                  className="tap-target shrink-0 text-text-muted transition hover:text-danger"
                >
                  <DeleteOutlined sx={{ fontSize: 18 }} />
                </button>
              )}
            </div>
            <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">{c.body}</p>
          </Card>
        ))
      )}

      {flash && <Toast message={flash.message} tone={flash.tone} />}
    </div>
  );
}
