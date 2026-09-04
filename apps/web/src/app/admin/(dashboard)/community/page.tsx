"use client";

import { useCallback, useEffect, useState } from "react";
import type { CommunityTag } from "@mammoai/shared";
import { adminApi, type AdminCommunityComment, type AdminCommunityPost } from "@/lib/admin-api";
import { Card, Badge, Button } from "@/components/ui";

const PAGE_SIZE = 20;

const TAG_LABELS: Record<CommunityTag, string> = {
  cycle: "Tsikl",
  pregnancy: "Homiladorlik",
  checkups: "Tekshiruvlar",
  general: "Umumiy",
};

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminCommunityPage() {
  const [posts, setPosts] = useState<AdminCommunityPost[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [comments, setComments] = useState<AdminCommunityComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const load = useCallback((currentSearch: string, currentOffset: number) => {
    setLoading(true);
    setError(null);
    adminApi.community.posts
      .list({ search: currentSearch || undefined, limit: PAGE_SIZE, offset: currentOffset })
      .then((res) => {
        setPosts(res.posts);
        setTotal(res.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Yuklashda xatolik"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setOffset(0);
      load(search, 0);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openEdit(post: AdminCommunityPost) {
    setEditingId(post.id);
    setEditBody(post.body);
  }

  async function saveEdit(postId: string) {
    setSavingEdit(true);
    try {
      await adminApi.community.posts.update(postId, editBody.trim());
      setEditingId(null);
      load(search, offset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saqlashda xatolik");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeletePost(post: AdminCommunityPost) {
    if (!window.confirm("Bu postni butunlay o'chirishni tasdiqlaysizmi? (barcha izohlari bilan)")) return;
    setDeletingId(post.id);
    try {
      await adminApi.community.posts.delete(post.id);
      if (expandedId === post.id) setExpandedId(null);
      load(search, offset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "O'chirishda xatolik");
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleComments(post: AdminCommunityPost) {
    if (expandedId === post.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(post.id);
    setCommentsLoading(true);
    try {
      const res = await adminApi.community.posts.comments.list(post.id);
      setComments(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Izohlarni yuklashda xatolik");
    } finally {
      setCommentsLoading(false);
    }
  }

  async function handleDeleteComment(postId: string, commentId: string) {
    if (!window.confirm("Bu izohni o'chirishni tasdiqlaysizmi?")) return;
    setDeletingCommentId(commentId);
    try {
      await adminApi.community.posts.comments.delete(postId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, commentsCount: Math.max(p.commentsCount - 1, 0) } : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "O'chirishda xatolik");
    } finally {
      setDeletingCommentId(null);
    }
  }

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Hamjamiyat</h1>
          <p className="mt-1 text-sm text-text-secondary">Jami {total} ta post — moderatsiya: tahrirlash, o&apos;chirish, izohlarni boshqarish</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Matn yoki muallif bo'yicha qidirish…"
          className="tap-target w-72 rounded-2xl border border-border bg-surface px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {error && <Card className="border border-danger/20 bg-danger/5 text-sm font-medium text-danger">{error}</Card>}

      <div className="flex flex-col gap-3">
        {loading && <Card className="py-10 text-center text-sm text-text-muted">Yuklanmoqda…</Card>}
        {!loading && posts.length === 0 && <Card className="py-10 text-center text-sm text-text-muted">Hech narsa topilmadi</Card>}

        {!loading &&
          posts.map((post) => (
            <Card key={post.id} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge tone="primary">{TAG_LABELS[post.tag] ?? post.tag}</Badge>
                  {post.isAnonymous && <Badge tone="muted">Anonim</Badge>}
                  <span className="text-xs text-text-muted">{formatDate(post.createdAt)}</span>
                </div>
                <div className="text-right text-xs text-text-muted">
                  <div className="font-semibold text-text-secondary">{post.authorName ?? "Ism kiritilmagan"}</div>
                  <div>{post.authorPhone ?? "—"}</div>
                </div>
              </div>

              {editingId === post.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={4}
                    className="tap-target h-auto! w-full resize-y rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" className="px-4! py-2! text-xs" onClick={() => setEditingId(null)}>
                      Bekor qilish
                    </Button>
                    <Button type="button" className="px-4! py-2! text-xs" disabled={savingEdit || !editBody.trim()} onClick={() => saveEdit(post.id)}>
                      {savingEdit ? "Saqlanmoqda…" : "Saqlash"}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm text-text-primary">{post.body}</p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                <div className="flex gap-4 text-xs text-text-muted">
                  <span>❤️ {post.likesCount}</span>
                  <button type="button" onClick={() => toggleComments(post)} className="font-semibold text-text-secondary underline-offset-2 hover:underline">
                    💬 {post.commentsCount} izoh {expandedId === post.id ? "▲" : "▼"}
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(post)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
                  >
                    Tahrirlash
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePost(post)}
                    disabled={deletingId === post.id}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/10 disabled:opacity-50"
                  >
                    {deletingId === post.id ? "O'chirilmoqda…" : "O'chirish"}
                  </button>
                </div>
              </div>

              {expandedId === post.id && (
                <div className="flex flex-col gap-2 rounded-2xl bg-surface-muted/60 p-3">
                  {commentsLoading && <p className="text-xs text-text-muted">Yuklanmoqda…</p>}
                  {!commentsLoading && comments.length === 0 && <p className="text-xs text-text-muted">Izohlar yo&apos;q</p>}
                  {!commentsLoading &&
                    comments.map((c) => (
                      <div key={c.id} className="flex items-start justify-between gap-3 rounded-xl bg-surface px-3 py-2">
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-text-secondary">
                            {c.authorName ?? "Ism kiritilmagan"} {c.isAnonymous && <span className="font-normal text-text-muted">(anonim)</span>}
                            <span className="ml-2 font-normal text-text-muted">{c.authorPhone ?? ""}</span>
                          </div>
                          <p className="mt-0.5 whitespace-pre-wrap text-sm text-text-primary">{c.body}</p>
                          <div className="mt-0.5 text-[11px] text-text-muted">{formatDate(c.createdAt)}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(post.id, c.id)}
                          disabled={deletingCommentId === c.id}
                          className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-danger transition hover:bg-danger/10 disabled:opacity-50"
                        >
                          {deletingCommentId === c.id ? "…" : "O'chirish"}
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">
          {page}-sahifa / {pageCount}
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="px-4! py-2! text-xs"
            disabled={offset === 0}
            onClick={() => {
              const next = Math.max(0, offset - PAGE_SIZE);
              setOffset(next);
              load(search, next);
            }}
          >
            Oldingi
          </Button>
          <Button
            variant="secondary"
            className="px-4! py-2! text-xs"
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => {
              const next = offset + PAGE_SIZE;
              setOffset(next);
              load(search, next);
            }}
          >
            Keyingi
          </Button>
        </div>
      </div>
    </div>
  );
}
