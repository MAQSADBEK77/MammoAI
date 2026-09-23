"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@mui/material";
import { ArrowBack, ArrowUpward, FavoriteBorder, Favorite, ChatBubbleOutlined } from "@mui/icons-material";
import type { CommunityComment, CommunityPost } from "@mammoai/shared";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Portal } from "@/components/Portal";

/**
 * COMM-01 — post va uning izohlari uchun alohida ekran.
 *
 * Ilgari izohlar LENTANING ICHIDA, akkordeon bo'lib ochilardi: post kartasi
 * cho'zilib, tagida ro'yxat va matn maydoni paydo bo'lardi. Muammosi —
 * yozish paytida maydon ekranning o'rtasida yoki pastida qolib ketardi,
 * klaviatura ochilganda esa ko'pincha ko'rinmay qolardi.
 *
 * Referensdagi ikkala ilovada ham post BOSILGANDA alohida ekran ochiladi va
 * izoh maydoni ekranning PASTIGA MAHKAMLANADI. Foydalanuvchi so'rovi ham shu
 * edi: "make sure it is very easy to comment there".
 *
 * Ranglar va shakllar ilovaning o'z tokenlaridan — referensdagi yashil/pushti
 * emas.
 */
export function CommunityPostSheet({
  post,
  onClose,
  onLike,
  onCommented,
}: {
  post: CommunityPost;
  onClose: () => void;
  onLike: () => void;
  /** Lentadagi izohlar sonini yangilash uchun. */
  onCommented: () => void;
}) {
  const { dict } = useI18n();
  const [comments, setComments] = useState<CommunityComment[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    api.community
      .listComments(post.id)
      .then((c) => {
        if (!cancelled) setComments(c);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [post.id]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const comment = await api.community.addComment(post.id, { body: text, isAnonymous: false });
      setComments((prev) => [...(prev ?? []), comment]);
      setDraft("");
      onCommented();
      // Yangi izoh ko'rinadigan joyga suriladi — aks holda u klaviatura
      // ortida qolib, "yuborildimi?" degan savol tug'dirardi.
      requestAnimationFrame(() => listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }));
    } finally {
      setSending(false);
    }
  }

  const authorLabel = post.authorName ?? dict.community.anonymousAuthor;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <header className="flex items-center gap-2 border-b border-border bg-surface px-3 py-3">
          <button
            type="button"
            onClick={onClose}
            aria-label={dict.common.back}
            className="tap-target flex h-10 w-10 items-center justify-center rounded-full text-text-primary active:scale-95"
          >
            <ArrowBack sx={{ fontSize: 22 }} />
          </button>
          <p className="text-base font-bold text-text-primary">{dict.community.title}</p>
        </header>

        {/* Suriladigan qism — pastdagi maydon uning ustida turadi. */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <article className="rounded-3xl bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Avatar src={post.authorAvatarUrl ?? undefined} sx={{ width: 40, height: 40 }}>
                {authorLabel.slice(0, 1)}
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-text-primary">{authorLabel}</p>
                <p className="text-xs text-text-muted">{dict.community.tags[post.tag]}</p>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-text-primary">{post.body}</p>
            <div className="mt-3 flex items-center gap-5 text-sm text-text-secondary">
              <button type="button" onClick={onLike} className="tap-target flex items-center gap-1.5 active:scale-95">
                {post.viewerLiked ? (
                  <Favorite sx={{ fontSize: 18 }} className="text-primary" />
                ) : (
                  <FavoriteBorder sx={{ fontSize: 18 }} />
                )}
                {post.likesCount}
              </button>
              <span className="flex items-center gap-1.5">
                <ChatBubbleOutlined sx={{ fontSize: 18 }} />
                {post.commentsCount}
              </span>
            </div>
          </article>

          <p className="mt-5 text-sm font-bold text-text-primary">{dict.community.commentsTitle}</p>
          <div className="mt-2 space-y-2.5">
            {comments === null ? (
              <p className="text-sm text-text-muted">{dict.common.loading}</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-text-muted">{dict.community.noCommentsYet}</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="rounded-2xl bg-surface p-3.5">
                  <p className="text-xs font-bold text-text-secondary">{c.authorName ?? dict.community.anonymousAuthor}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-text-primary">{c.body}</p>
                </div>
              ))
            )}
            <div ref={listEndRef} />
          </div>
        </div>

        {/* PASTGA MAHKAMLANGAN izoh maydoni — bu ekranning butun maqsadi.
            `env(safe-area-inset-bottom)` telefonning pastki chizig'i ostida
            qolib ketmasligi uchun. */}
        <div
          className="flex items-end gap-2 border-t border-border bg-surface px-3 py-2.5"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)" }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={dict.community.commentPlaceholder}
            rows={1}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-3xl border border-border bg-background px-4 py-3 text-base text-text-primary outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={!draft.trim() || sending}
            aria-label={dict.community.commentButton}
            className="tap-target flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition active:scale-95 disabled:opacity-40"
          >
            <ArrowUpward sx={{ fontSize: 22 }} />
          </button>
        </div>
      </div>
    </Portal>
  );
}
