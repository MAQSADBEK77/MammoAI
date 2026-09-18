"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppNotification, CommunityComment, CommunityPost, CommunityReportReason, CommunityStats, CommunityTag, Dictionary } from "@mammoai/shared";
import { detectsMedicalConcern, goalToDefaultCommunityTag, translateApiError } from "@mammoai/shared";
import { Dialog, DialogTitle, DialogContent, Menu, MenuItem } from "@mui/material";
import {
  NotificationsNoneOutlined as Bell,
  Favorite,
  FavoriteBorderOutlined,
  ChatBubbleOutlineOutlined as MessageCircle,
  ShareOutlined as Share2,
  DeleteOutlined as Trash2,
  PersonOutlined as UserRound,
  VisibilityOffOutlined as VenetianMask,
  MoreVertOutlined as MoreVert,
} from "@mui/icons-material";
import clsx from "clsx";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Badge, Button, Card, IconButton, LoadingSpinner, ErrorState, ScreenHeader } from "@/components/ui";
import { Reveal } from "@/components/motion-primitives";

const REPORT_REASONS: CommunityReportReason[] = ["spam", "harassment", "misinformation", "medical_emergency", "other"];

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
  const { onboardingProfile } = useSession();

  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [posts, setPosts] = useState<CommunityPost[] | null>(null);
  const [total, setTotal] = useState(0);
  // Foydalanuvchi so'roviga ko'ra: ochilganda avval o'z rejimiga mos guruh
  // ko'rinadi ("Barchasi" emas) — keyin o'zi xohlagancha o'zgartira oladi.
  const [tag, setTag] = useState<CommunityTag | "all">(() =>
    onboardingProfile ? goalToDefaultCommunityTag(onboardingProfile.primaryGoal) : "all"
  );
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

  // MOTION-APP-02: qisqa mikro-animatsiyalarni ishga tushirish uchun —
  // "layk" bosilganda yurak "pop"i, yangi post yuborilganda karta atrofida
  // bir martalik halqa. Ikkalasi ham vaqtinchalik (timeout bilan tozalanadi).
  const [justLikedId, setJustLikedId] = useState<string | null>(null);
  const [justPublishedId, setJustPublishedId] = useState<string | null>(null);

  // COMM-001 — moderatsiya: "..." menyusi (shikoyat/bloklash), shikoyat dialogi.
  const [menuTarget, setMenuTarget] = useState<{ el: HTMLElement; postId: string; commentId: string | null } | null>(null);
  const [reportTarget, setReportTarget] = useState<{ postId: string; commentId: string | null } | null>(null);
  const [reportReason, setReportReason] = useState<CommunityReportReason | null>(null);
  const [reportNote, setReportNote] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // FIX2-15: teg-filtr tez almashtirilsa, ikkita so'rov parallel ketardi —
  // eski (sekinroq) filtrning javobi keyinroq kelsa, yangi tanlangan
  // filtr natijasini bosib yuborardi (mobil bilan bir xil bug, shu yerda
  // ham topilib tuzatildi). So'nggi so'ralgan `tag` ref'da saqlanadi, javob
  // kelganda joriy tag bilan solishtirilib, mos kelmasa e'tiborsiz qoldiriladi.
  const latestTagRef = useRef<CommunityTag | "all">(tag);
  // UX-02: ilgari `.catch()` yo'q edi — so'rov muvaffaqiyatsiz bo'lsa
  // `posts` HECH QACHON to'lmasdi, lenta CHEKSIZ "yuklanmoqda" holatida
  // qolib ketardi.
  const [postsLoadError, setPostsLoadError] = useState(false);

  const loadPosts = useCallback((currentTag: CommunityTag | "all") => {
    latestTagRef.current = currentTag;
    setPosts(null);
    setPostsLoadError(false);
    api.community
      .listPosts({ tag: currentTag === "all" ? undefined : currentTag, limit: PAGE_SIZE, offset: 0 })
      .then((res) => {
        if (latestTagRef.current !== currentTag) return;
        setPosts(res.posts);
        setTotal(res.total);
      })
      .catch(() => {
        if (latestTagRef.current !== currentTag) return;
        setPostsLoadError(true);
      });
  }, []);

  useEffect(() => {
    // Ikkinchi darajali widget — muvaffaqiyatsiz bo'lsa ham asosiy lenta
    // ishlayveradi (`{stats && (...)}` allaqachon shunga mo'ljallangan),
    // lekin `.catch()` YO'Q edi — konsolda kuzatilmagan promise-rad etish
    // qoldirmaslik uchun ANIQ jimgina e'tiborsiz qoldiriladi.
    api.community.stats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    api.notifications
      .list()
      .then((res) => {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      })
      .catch(() => {});
  }, []);

  async function toggleNotifications() {
    const opening = !notificationsOpen;
    setNotificationsOpen(opening);
    if (!opening || unreadCount === 0) return;
    // FIX3-09: ilgari sahifa ochilgandagi bir martalik (eski) ro'yxatga
    // tayanib to'g'ridan-to'g'ri markAllRead chaqirilardi — agar panel
    // ochilgunga qadar YANGI bildirishnoma kelgan bo'lsa (masalan kimdir
    // izoh qoldirsa), u foydalanuvchi UMUMAN KO'RMAGAN holda "o'qilgan"
    // deb belgilanib, butunlay yo'qolib qolardi. Endi markAllRead'dan
    // OLDIN ro'yxat serverdan qayta yuklanadi.
    // FIX3-10: `unreadCount` ilgari optimistik ravishda darhol 0ga
    // o'rnatilib, markAllRead() xatosi butunlay e'tiborsiz qoldirilardi
    // (`.catch(() => {})`) — server so'rovi muvaffaqiyatsiz bo'lsa, haqiqiy
    // o'qilmagan yozuvlar DB'da qolardi, lekin foydalanuvchi "0" ko'rardi.
    // Endi 0ga faqat markAllRead HAQIQATAN muvaffaqiyatli bo'lgandan
    // keyingina o'rnatiladi — xato bo'lsa, oldingi (haqiqiy) son saqlanadi.
    try {
      const fresh = await api.notifications.list();
      setNotifications(fresh.notifications);
      setUnreadCount(fresh.unreadCount);
      if (fresh.unreadCount > 0) {
        await api.notifications.markAllRead();
        setUnreadCount(0);
      }
    } catch {
      // Xato bo'lsa — yuqorida hali o'rnatilmagan/eng so'nggi haqiqiy
      // unreadCount qiymati saqlanib qoladi, qo'shimcha hech narsa kerak emas.
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
      // MOTION-APP-02: "muvaffaqiyatli yuborildi" mikro-tasdiq — yangi karta
      // atrofida bir martalik halqa (1.6s'dan keyin o'zi tozalanadi).
      setJustPublishedId(post.id);
      window.setTimeout(() => setJustPublishedId((cur) => (cur === post.id ? null : cur)), 1600);
    } catch (err) {
      // FIX2-20: server xato KALITI qaytaradi (masalan "invalid_tag") —
      // xom o'zbekcha matn o'rniga joriy tilga tarjima qilib ko'rsatamiz.
      setComposerError(translateApiError(err, dict));
    } finally {
      setPublishing(false);
    }
  }

  async function toggleLike(post: CommunityPost) {
    const willLike = !post.viewerLiked;
    setPosts((prev) =>
      prev
        ? prev.map((p) => (p.id === post.id ? { ...p, viewerLiked: !p.viewerLiked, likesCount: p.likesCount + (p.viewerLiked ? -1 : 1) } : p))
        : prev
    );
    if (willLike) {
      // MOTION-APP-02: yurak "pop"i — faqat YOQTIRISHDA (yoqtirishni bekor
      // qilishda emas, u passiv amal).
      setJustLikedId(post.id);
      window.setTimeout(() => setJustLikedId((cur) => (cur === post.id ? null : cur)), 400);
    }
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

  async function removeComment(post: CommunityPost, comment: CommunityComment) {
    if (!window.confirm(dict.community.deleteCommentConfirm)) return;
    await api.community.deleteComment(post.id, comment.id);
    setOpenComments((prev) => ({ ...prev, [post.id]: (prev[post.id] ?? []).filter((c) => c.id !== comment.id) }));
    setPosts((prev) => (prev ? prev.map((p) => (p.id === post.id ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p)) : prev));
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

  function closeMenu() {
    setMenuTarget(null);
  }

  function openReportDialog() {
    if (!menuTarget) return;
    setReportTarget({ postId: menuTarget.postId, commentId: menuTarget.commentId });
    setReportReason(null);
    setReportNote("");
    setReportDone(false);
    setReportError(null);
    closeMenu();
  }

  /** Muallifni bloklash — postId/commentId server tomonda haqiqiy muallifga
   * o'giriladi (bu yerda xom user_id bilan ishlamaymiz, anonim postda ham
   * ishlaydi). Bloklangandan keyin oqim qayta yuklanadi — shu muallifning
   * boshqa yozuvlari ham darhol yashiriladi. */
  // FIX-09: ilgari try/catch yo'q edi — server xato qaytarsa (masalan post
  // shu orada o'chirilgan bo'lsa, 404), xatolik "unhandled promise rejection"
  // sifatida yutilib ketardi, foydalanuvchiga HECH QANDAY xabar ko'rsatilmasdi.
  async function blockAuthorFromMenu() {
    if (!menuTarget) return;
    const { postId, commentId } = menuTarget;
    closeMenu();
    if (!window.confirm(dict.community.blockAuthorConfirm)) return;
    try {
      if (commentId) await api.community.blockCommentAuthor(postId, commentId);
      else await api.community.blockPostAuthor(postId);
      setOpenComments({});
      loadPosts(tag);
      window.alert(dict.community.blockAuthorSuccess);
    } catch (err) {
      // FIX2-22: qattiq yozilgan o'zbekcha "Xatolik" o'rniga dict'dan.
      window.alert(err instanceof Error ? err.message : dict.community.genericError);
    }
  }

  async function submitReport() {
    if (!reportTarget || !reportReason) return;
    setReportSubmitting(true);
    setReportError(null);
    try {
      if (reportTarget.commentId) {
        await api.community.reportComment(reportTarget.postId, reportTarget.commentId, { reason: reportReason, note: reportNote.trim() || undefined });
      } else {
        await api.community.reportPost(reportTarget.postId, { reason: reportReason, note: reportNote.trim() || undefined });
      }
      setReportDone(true);
    } catch (err) {
      // FIX-09: avval catch yo'q edi — xato jimgina yutilib, dialog hech narsa
      // bo'lmagandek ochiq qolardi (masalan izoh shu orada o'chirilgan bo'lsa).
      setReportError(err instanceof Error ? err.message : dict.community.genericError);
    } finally {
      setReportSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 pb-6">
      <ScreenHeader
        title={dict.community.title}
        subtitle={dict.community.subtitle}
        right={
          <div className="relative">
            <IconButton icon={<Bell sx={{ fontSize: 18 }} />} onClick={toggleNotifications} ariaLabel={dict.community.notificationsTitle} />
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
                  {n.type === "partner_message" ? (
                    <>
                      <p className="font-medium text-text-primary">
                        {n.actorName ?? dict.partner.roleLabel}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-text-secondary">&ldquo;{n.message}&rdquo;</p>
                    </>
                  ) : n.type === "daily_reminder" ? (
                    <p className="font-medium text-text-primary">{n.message}</p>
                  ) : (
                    <>
                      <p className="font-medium text-text-primary">
                        {dict.community.notificationCommentText(n.actorName ?? dict.community.anonymousAuthor)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-text-secondary">&ldquo;{n.postExcerpt}&rdquo;</p>
                    </>
                  )}
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

      <div className="flex gap-2 overflow-x-auto pb-1 pt-2">
        <FilterChip active={tag === "all"} label={dict.community.filterAll} onClick={() => setTag("all")} />
        {TAGS.map((t) => (
          <FilterChip key={t} active={tag === t} label={dict.community.tags[t]} onClick={() => setTag(t)} />
        ))}
      </div>

      {postsLoadError ? (
        <ErrorState message={dict.common.errorGeneric} retry={{ label: dict.common.retryButton, onClick: () => loadPosts(tag) }} />
      ) : !posts ? (
        <LoadingSpinner label={dict.common.loading} />
      ) : posts.length === 0 ? (
        <Card className="space-y-3 text-center text-sm text-text-secondary">
          <p>{tag === "all" ? dict.community.emptyFeed : dict.community.emptyFeedFiltered}</p>
          {tag !== "all" && (
            <Button variant="ghost" onClick={() => setTag("all")}>
              {dict.community.viewAllButton}
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post, index) => {
            const comments = openComments[post.id];
            return (
              // MOTION-APP-02: ro'yxat ekranga kirganda yengil "to'lqin"
              // (stagger) bilan paydo bo'lishi — index asosida (post soniga
              // bog'liq, matn uzunligiga emas).
              <Reveal key={post.id} index={index}>
              <Card className={clsx("space-y-3", justPublishedId === post.id && "animate-publish-highlight")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={clsx(
                        "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-white",
                        post.isAnonymous ? "bg-nav" : "bg-gradient-to-br from-primary to-secondary"
                      )}
                    >
                      {!post.isAnonymous && post.authorAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- kichik base64 avatar, next/image shart emas
                        <img src={post.authorAvatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : post.isAnonymous ? (
                        <VenetianMask sx={{ fontSize: 16 }} />
                      ) : (
                        <UserRound sx={{ fontSize: 16 }} />
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {post.isAnonymous ? dict.community.anonymousAuthor : (post.authorName ?? dict.profile.noNameFallback)}
                      </p>
                      <p className="text-[11px] text-text-muted">{formatRelativeTime(post.createdAt, dict)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge tone="primary">{dict.community.tags[post.tag]}</Badge>
                    {!post.isOwn && (
                      <button
                        type="button"
                        onClick={(e) => setMenuTarget({ el: e.currentTarget, postId: post.id, commentId: null })}
                        className="tap-target flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-muted"
                        aria-label={dict.community.moreOptionsLabel}
                      >
                        <MoreVert sx={{ fontSize: 18 }} />
                      </button>
                    )}
                  </div>
                </div>

                <p className="whitespace-pre-wrap text-sm text-text-primary">{post.body}</p>

                {/* COMM-001: tibbiy-shoshilinch ko'rinishdagi postlarda ogohlantirish —
                    tashxis emas, faqat shifokorga murojaat qilishni eslatish. */}
                {detectsMedicalConcern(post.body) && (
                  <p className="rounded-2xl bg-warning/10 px-3 py-2 text-xs font-medium text-warning">{dict.community.medicalConcernBanner}</p>
                )}

                <div className="flex items-center gap-1 border-t border-border pt-2">
                  <button
                    onClick={() => toggleLike(post)}
                    className={clsx(
                      "tap-target flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition active:scale-95",
                      post.viewerLiked ? "text-danger" : "text-text-secondary hover:bg-surface-muted"
                    )}
                  >
                    {post.viewerLiked ? (
                      <Favorite sx={{ fontSize: 16 }} className={justLikedId === post.id ? "animate-pop-bounce" : undefined} />
                    ) : (
                      <FavoriteBorderOutlined sx={{ fontSize: 16 }} />
                    )}{" "}
                    {post.likesCount}
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
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-text-secondary">
                          {!c.isAnonymous && c.authorAvatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- kichik base64 avatar, next/image shart emas
                            <img src={c.authorAvatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : c.isAnonymous ? (
                            <VenetianMask sx={{ fontSize: 12 }} />
                          ) : (
                            <UserRound sx={{ fontSize: 12 }} />
                          )}
                        </span>
                        <div className="min-w-0 flex-1 rounded-2xl bg-surface-muted px-3 py-2">
                          <p className="text-[11px] font-semibold text-text-secondary">
                            {c.isAnonymous ? dict.community.anonymousAuthor : (c.authorName ?? dict.profile.noNameFallback)}
                          </p>
                          <p className="text-sm text-text-primary">{c.body}</p>
                        </div>
                        {(c.isOwn || post.isOwn) && (
                          <button
                            onClick={() => removeComment(post, c)}
                            className="tap-target mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-danger/10 hover:text-danger"
                            aria-label={dict.community.deletePostButton}
                          >
                            <Trash2 sx={{ fontSize: 13 }} />
                          </button>
                        )}
                        {!c.isOwn && (
                          <button
                            onClick={(e) => setMenuTarget({ el: e.currentTarget, postId: post.id, commentId: c.id })}
                            className="tap-target mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted"
                            aria-label={dict.community.moreOptionsLabel}
                          >
                            <MoreVert sx={{ fontSize: 14 }} />
                          </button>
                        )}
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
              </Reveal>
            );
          })}

          {posts.length < total && (
            <Button variant="secondary" className="w-full" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? dict.common.loading : dict.community.loadMoreButton}
            </Button>
          )}
        </div>
      )}

      {/* COMM-001: "..." menyusi — shikoyat/bloklash, post yoki izohga qarab. */}
      <Menu anchorEl={menuTarget?.el ?? null} open={!!menuTarget} onClose={closeMenu}>
        <MenuItem onClick={openReportDialog}>{dict.community.reportButton}</MenuItem>
        <MenuItem onClick={blockAuthorFromMenu} sx={{ color: "var(--color-danger)" }}>
          {dict.community.blockAuthorButton}
        </MenuItem>
      </Menu>

      <Dialog open={!!reportTarget} onClose={() => setReportTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>{dict.community.reportDialogTitle}</DialogTitle>
        <DialogContent className="flex flex-col gap-3 pb-5!">
          {reportDone ? (
            <p className="py-4 text-center text-sm font-medium text-success">{dict.community.reportSuccess}</p>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReportReason(r)}
                    className={clsx(
                      "tap-target rounded-2xl border-2 px-4 py-2.5 text-left text-sm font-medium transition",
                      reportReason === r ? "border-primary bg-primary-light/40 text-primary-dark" : "border-border bg-surface text-text-primary"
                    )}
                  >
                    {dict.community.reportReasons[r]}
                  </button>
                ))}
              </div>
              <textarea
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
                placeholder={dict.community.reportNotePlaceholder}
                rows={2}
                className="w-full resize-none rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
              />
              {reportError && <p className="text-sm font-medium text-danger">{reportError}</p>}
              <Button className="w-full" onClick={submitReport} disabled={!reportReason || reportSubmitting}>
                {reportSubmitting ? dict.common.loading : dict.community.reportSubmitButton}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
