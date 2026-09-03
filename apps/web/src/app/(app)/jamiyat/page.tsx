"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppNotification, CommunityComment, CommunityPost, CommunityStats, CommunityTag, Dictionary } from "@mammoai/shared";
import { NotificationsNoneOutlined as Bell, Favorite, FavoriteBorderOutlined, ChatBubbleOutlineOutlined as MessageCircle, ShareOutlined as Share2, DeleteOutlined as Trash2, PersonOutlined as UserRound, VisibilityOffOutlined as VenetianMask } from "@mui/icons-material";
import clsx from "clsx";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Badge, Button, Card, IconButton, LoadingSpinner, ScreenHeader } from "@/components/ui";

const TAGS: CommunityTag[] = ["cycle", "pregnancy", "checkups", "general"];
const PAGE_SIZE = 15;

function formatRelativeTime(iso: string, dict: Dictionary): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return dict.community.justNow;
  if (diffMin < 60) return dict.community.minutesAgo(diffMin);
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return dict.community.hoursAgo(diffHour);
  const diffDay = Math.floor(diffHour / 24);
  return dict.community.daysAgo(diffDay);
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95",
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-surface text-text-secondary hover:border-primary-light hover:bg-primary-light/20 hover:text-primary-dark"
      )}
    >
      {label}
    </button>
  );
}

export default function CommunityPage() {
  const { dict } = useI18n();

  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [posts, setPosts] = useState<CommunityPost[] | null>(null);
  const [total, setTotal] = useState(0);
  const [tag, setTag] = useState<CommunityTag | "all">("all");
  const [loadingMore, setLoadingMore] = useState(false);

  const [notifications, setNotifications] = useState<AppNotification[] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [composerOpen, setComposerOpen] = useState(false);
  const [composerTag, setComposerTag] = useState<CommunityTag>("general");
  const [composerBody, setComposerBody] = useState("");
  const [composerAnonymous, setComposerAnonymous] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const [openComments, setOpenComments] = useState<Record<string, CommunityComment[] | undefined>>({});
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});

  const loadPosts = useCallback((currentTag: CommunityTag | "all") => {
    setPosts(null);
    api.community.listPosts({ tag: currentTag === "all" ? undefined : currentTag, limit: PAGE_SIZE, offset: 0 }).then((res) => {
      setPosts(res.posts);
      setTotal(res.total);
    });
  }, []);

  useEffect(() => {
    api.community.stats().then(setStats);
  }, []);

  useEffect(() => {
    api.notifications.list().then((res) => {
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    });
  }, []);

  async function toggleNotifications() {
    const opening = !notificationsOpen;
    setNotificationsOpen(opening);
    if (opening && unreadCount > 0) {
      setUnreadCount(0);
      api.notifications.markAllRead().catch(() => {});
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => loadPosts(tag), 0);
    return () => clearTimeout(timeout);
  }, [tag, loadPosts]);

  async function loadMore() {
    if (!posts) return;
    setLoadingMore(true);
    try {
      const res = await api.community.listPosts({ tag: tag === "all" ? undefined : tag, limit: PAGE_SIZE, offset: posts.length });
      setPosts([...posts, ...res.posts]);
      setTotal(res.total);
    } finally {
      setLoadingMore(false);
    }
  }

  async function publish() {
    setComposerError(null);
    const text = composerBody.trim();
    if (text.length < 2) {
      setComposerError(dict.community.postTooShort);
      return;
    }
    setPublishing(true);
    try {
      const post = await api.community.createPost({ tag: composerTag, body: text, isAnonymous: composerAnonymous });
      if (tag === "all" || tag === post.tag) setPosts((prev) => (prev ? [post, ...prev] : [post]));
      setTotal((t) => t + 1);
      setStats((s) => (s ? { ...s, totalPosts: s.totalPosts + 1, postsToday: s.postsToday + 1 } : s));
      setComposerBody("");
      setComposerAnonymous(false);
      setComposerOpen(false);
    } catch (err) {
      setComposerError(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setPublishing(false);
    }
  }

  async function toggleLike(post: CommunityPost) {
    setPosts((prev) =>
      prev
        ? prev.map((p) => (p.id === post.id ? { ...p, viewerLiked: !p.viewerLiked, likesCount: p.likesCount + (p.viewerLiked ? -1 : 1) } : p))
        : prev
    );
    try {
      const res = await api.community.toggleLike(post.id);
      setPosts((prev) => (prev ? prev.map((p) => (p.id === post.id ? { ...p, viewerLiked: res.liked, likesCount: res.likesCount } : p)) : prev));
    } catch {
      // Xatolik bo'lsa optimistik o'zgarishni qaytarib qo'yamiz.
      setPosts((prev) =>
        prev
          ? prev.map((p) => (p.id === post.id ? { ...p, viewerLiked: post.viewerLiked, likesCount: post.likesCount } : p))
          : prev
      );
    }
  }

  async function toggleComments(post: CommunityPost) {
    if (openComments[post.id] !== undefined) {
      setOpenComments((prev) => ({ ...prev, [post.id]: undefined }));
      return;
    }
    const comments = await api.community.listComments(post.id);
    setOpenComments((prev) => ({ ...prev, [post.id]: comments }));
  }

  async function sendComment(post: CommunityPost) {
    const text = (commentDraft[post.id] ?? "").trim();
    if (!text) return;
    const comment = await api.community.addComment(post.id, { body: text, isAnonymous: false });
    setOpenComments((prev) => ({ ...prev, [post.id]: [...(prev[post.id] ?? []), comment] }));
    setCommentDraft((prev) => ({ ...prev, [post.id]: "" }));
    setPosts((prev) => (prev ? prev.map((p) => (p.id === post.id ? { ...p, commentsCount: p.commentsCount + 1 } : p)) : prev));
  }

  async function removePost(post: CommunityPost) {
    if (!window.confirm(dict.community.deletePostConfirm)) return;
    await api.community.deletePost(post.id);
    setPosts((prev) => (prev ? prev.filter((p) => p.id !== post.id) : prev));
    setTotal((t) => Math.max(0, t - 1));
  }

  async function sharePost(post: CommunityPost) {
    const text = `${dict.community.shareAppNameLabel}: ${post.body}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: dict.community.shareAppNameLabel, text });
      } catch {
        // Foydalanuvchi bekor qildi.
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  }

  return (
    <div className="space-y-4 pb-6">
      <ScreenHeader
        title={dict.community.title}
        subtitle={dict.community.subtitle}
        right={
          <div className="relative">
            <IconButton icon={<Bell sx={{ fontSize: 18 }} />} onClick={toggleNotifications} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
        }
      />

      {notificationsOpen && (
        <Card className="animate-fade-in-up space-y-2">
          <p className="font-semibold text-text-primary">{dict.community.notificationsTitle}</p>
          {!notifications || notifications.length === 0 ? (
            <p className="text-sm text-text-muted">{dict.community.notificationsEmpty}</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div key={n.id} className={clsx("rounded-2xl p-3 text-sm", n.isRead ? "bg-surface-muted" : "bg-primary-light/40")}>
                  <p className="font-medium text-text-primary">
                    {dict.community.notificationCommentText(n.actorName ?? dict.community.anonymousAuthor)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-text-secondary">&ldquo;{n.postExcerpt}&rdquo;</p>
                  <p className="mt-1 text-[11px] text-text-muted">{formatRelativeTime(n.createdAt, dict)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {stats && (
        <div className="animate-fade-in-up grid grid-cols-3 gap-3">
          <Card variant="flat" className="p-3! text-center">
            <p className="text-lg font-extrabold text-text-primary">{stats.totalMembers}</p>
            <p className="text-[11px] text-text-secondary">{dict.community.statsMembers(stats.totalMembers)}</p>
          </Card>
          <Card variant="flat" className="p-3! text-center">
            <p className="text-lg font-extrabold text-text-primary">{stats.totalPosts}</p>
            <p className="text-[11px] text-text-secondary">{dict.community.statsPosts(stats.totalPosts)}</p>
          </Card>
          <Card variant="flat" className="p-3! text-center">
            <p className="text-lg font-extrabold text-text-primary">{stats.postsToday}</p>
            <p className="text-[11px] text-text-secondary">{dict.community.statsToday(stats.postsToday)}</p>
          </Card>
        </div>
      )}

      <Button className="w-full" onClick={() => setComposerOpen((v) => !v)}>
        {dict.community.writePostButton}
      </Button>

      {composerOpen && (
        <Card className="space-y-3">
          <p className="font-semibold text-text-primary">{dict.community.writePostTitle}</p>
          <textarea
            value={composerBody}
            onChange={(e) => setComposerBody(e.target.value)}
            placeholder={dict.community.writePostPlaceholder}
            rows={4}
            className="w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-primary"
          />
          <div>
            <p className="mb-1.5 text-xs font-semibold text-text-secondary">{dict.community.writePostTagLabel}</p>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((t) => (
                <FilterChip key={t} active={composerTag === t} label={dict.community.tags[t]} onClick={() => setComposerTag(t)} />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-text-secondary">
            <input
              type="checkbox"
              checked={composerAnonymous}
              onChange={(e) => setComposerAnonymous(e.target.checked)}
              className="h-4 w-4 rounded accent-primary"
            />
            {dict.community.postAnonymouslyLabel}
          </label>
          {composerError && <p className="text-sm text-danger">{composerError}</p>}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setComposerOpen(false)} disabled={publishing}>
              {dict.common.cancel}
            </Button>
            <Button className="flex-1" onClick={publish} disabled={publishing || composerBody.trim().length < 2}>
              {publishing ? dict.community.publishing : dict.community.publishButton}
            </Button>
          </div>
        </Card>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterChip active={tag === "all"} label={dict.community.filterAll} onClick={() => setTag("all")} />
        {TAGS.map((t) => (
          <FilterChip key={t} active={tag === t} label={dict.community.tags[t]} onClick={() => setTag(t)} />
        ))}
      </div>

      {!posts ? (
        <LoadingSpinner label={dict.common.loading} />
      ) : posts.length === 0 ? (
        <Card className="text-center text-sm text-text-secondary">{dict.community.emptyFeed}</Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const comments = openComments[post.id];
            return (
              <Card key={post.id} className="animate-fade-in-up space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={clsx(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white",
                        post.isAnonymous ? "bg-nav" : "bg-gradient-to-br from-primary to-secondary"
                      )}
                    >
                      {post.isAnonymous ? <VenetianMask sx={{ fontSize: 16 }} /> : <UserRound sx={{ fontSize: 16 }} />}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {post.isAnonymous ? dict.community.anonymousAuthor : (post.authorName ?? dict.profile.noNameFallback)}
                      </p>
                      <p className="text-[11px] text-text-muted">{formatRelativeTime(post.createdAt, dict)}</p>
                    </div>
                  </div>
                  <Badge tone="primary">{dict.community.tags[post.tag]}</Badge>
                </div>

                <p className="whitespace-pre-wrap text-sm text-text-primary">{post.body}</p>

                <div className="flex items-center gap-1 border-t border-border pt-2">
                  <button
                    onClick={() => toggleLike(post)}
                    className={clsx(
                      "tap-target flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition active:scale-95",
                      post.viewerLiked ? "text-danger" : "text-text-secondary hover:bg-surface-muted"
                    )}
                  >
                    {post.viewerLiked ? <Favorite sx={{ fontSize: 16 }} /> : <FavoriteBorderOutlined sx={{ fontSize: 16 }} />} {post.likesCount}
                  </button>
                  <button
                    onClick={() => toggleComments(post)}
                    className="tap-target flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-text-secondary transition hover:bg-surface-muted active:scale-95"
                  >
                    <MessageCircle sx={{ fontSize: 16 }} /> {post.commentsCount}
                  </button>
                  <button
                    onClick={() => sharePost(post)}
                    className="tap-target flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-text-secondary transition hover:bg-surface-muted active:scale-95"
                  >
                    <Share2 sx={{ fontSize: 16 }} /> {dict.community.shareButton}
                  </button>
                  {post.isOwn && (
                    <button
                      onClick={() => removePost(post)}
                      className="tap-target flex items-center justify-center rounded-xl px-3 py-2 text-danger transition hover:bg-danger/10 active:scale-95"
                      aria-label={dict.community.deletePostButton}
                    >
                      <Trash2 sx={{ fontSize: 16 }} />
                    </button>
                  )}
                </div>

                {comments !== undefined && (
                  <div className="space-y-2.5 border-t border-border pt-3">
                    <p className="text-xs font-semibold text-text-secondary">{dict.community.commentsTitle}</p>
                    {comments.length === 0 && <p className="text-xs text-text-muted">{dict.community.emptyComments}</p>}
                    {comments.map((c) => (
                      <div key={c.id} className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
                          {c.isAnonymous ? <VenetianMask sx={{ fontSize: 12 }} /> : <UserRound sx={{ fontSize: 12 }} />}
                        </span>
                        <div className="min-w-0 flex-1 rounded-2xl bg-surface-muted px-3 py-2">
                          <p className="text-[11px] font-semibold text-text-secondary">
                            {c.isAnonymous ? dict.community.anonymousAuthor : (c.authorName ?? dict.profile.noNameFallback)}
                          </p>
                          <p className="text-sm text-text-primary">{c.body}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        value={commentDraft[post.id] ?? ""}
                        onChange={(e) => setCommentDraft((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && sendComment(post)}
                        placeholder={dict.community.commentPlaceholder}
                        className="tap-target flex-1 rounded-full border border-border bg-surface px-4 text-sm text-text-primary outline-none focus:border-primary"
                      />
                      <Button variant="secondary" className="px-4!" onClick={() => sendComment(post)} disabled={!commentDraft[post.id]?.trim()}>
                        {dict.community.sendCommentButton}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          {posts.length < total && (
            <Button variant="secondary" className="w-full" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? dict.common.loading : dict.community.loadMoreButton}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
