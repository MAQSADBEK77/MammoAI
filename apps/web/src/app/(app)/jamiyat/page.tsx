"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppNotification, CommunityComment, CommunityFeedScope, CommunityPost, CommunityReportReason, CommunityStats, CommunityTag, Dictionary } from "@mammoai/shared";
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
  Add,
} from "@mui/icons-material";
import clsx from "clsx";
import { useI18n } from "@/lib/i18n";
import { useConfirm } from "@/lib/confirm";
import { CommunityPostSheet } from "@/components/screens/CommunityPostSheet";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { Badge, Button, Card, IconButton, LoadingSpinner, ErrorState, ScreenHeader, Toast } from "@/components/ui";
import { Reveal } from "@/components/motion-primitives";

const REPORT_REASONS: CommunityReportReason[] = ["spam", "harassment", "misinformation", "medical_emergency", "other"];

// COMM-03: ko'rinish tartibi — ayolning yo'li bo'yicha (hayzdan tug'ruqdan
// keyingi davrgacha), oxirida umumiy bo'limlar. "Boshqa" har doim oxirida:
// u tanlash oson bo'lgani uchun tepada tursa, ko'pchilik shuni tanlab
// qo'yardi va guruhlarning ma'nosi yo'qolardi.
const TAGS: CommunityTag[] = [
  "cycle",
  "discharge",
  "ttc",
  "pregnancy",
  "postpartum",
  "checkups",
  "mental",
  "general",
];
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
  const confirm = useConfirm();
  const [shareFlash, setShareFlash] = useState<string | null>(null);
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

  // COMM-01: ochilgan post — izohlar endi lentada emas, alohida ekranda.
  // COMM-02: lenta ko'rinishi — butun forum / o'z savollari / javob berganlari.
  const [scope, setScope] = useState<CommunityFeedScope>("all");
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerTag, setComposerTag] = useState<CommunityTag>("general");
  const [composerBody, setComposerBody] = useState("");
  const [composerAnonymous, setComposerAnonymous] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);


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

  const loadPosts = useCallback((currentTag: CommunityTag | "all", currentScope: CommunityFeedScope = "all") => {
    latestTagRef.current = currentTag;
    setPosts(null);
    setPostsLoadError(false);
    api.community
      .listPosts({ tag: currentTag === "all" ? undefined : currentTag, scope: currentScope, limit: PAGE_SIZE, offset: 0 })
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
    const timeout = setTimeout(() => loadPosts(tag, scope), 0);
    return () => clearTimeout(timeout);
  }, [tag, scope, loadPosts]);

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



  async function removeComment(post: CommunityPost, comment: CommunityComment) {
    if (!(await confirm({ message: dict.community.deleteCommentConfirm, destructive: true }))) return;
    await api.community.deleteComment(post.id, comment.id);
    setPosts((prev) => (prev ? prev.map((p) => (p.id === post.id ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p)) : prev));
  }

  async function removePost(post: CommunityPost) {
    if (!(await confirm({ message: dict.community.deletePostConfirm, destructive: true }))) return;
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
      // CLIPBOARD-01: tutilmagan xato + hech qanday tasdiq yo'q edi —
      // ayol "Ulashish"ni bosardi va NIMA bo'lganini umuman bilmasdi
      // (nusxalandimi, yiqildimi).
      try {
        await navigator.clipboard.writeText(text);
        setShareFlash(dict.profile.shareAppLinkCopied);
      } catch {
        setShareFlash(dict.common.errorGeneric);
      }
      setTimeout(() => setShareFlash(null), 2500);
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
    if (!(await confirm({ message: dict.community.blockAuthorConfirm, destructive: true }))) return;
    try {
      if (commentId) await api.community.blockCommentAuthor(postId, commentId);
      else await api.community.blockPostAuthor(postId);
      loadPosts(tag, scope);
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
    <div className="space-y-3 pb-6">
      <ScreenHeader
        title={dict.community.title}
        // COMM-TRIM-01: izoh matni OLIB TASHLANDI. "Boshqa ayollar bilan
        // tajriba almashing" — sarlavhaning o'zi aytib turgan narsani
        // takrorlardi, lentagacha esa allaqachon beshta blok bor edi.
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
                  ) : n.type === "daily_reminder" || n.type === "checkup_reminder" ? (
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

      {/* COMM-05: ilgari bu uchta baland karta edi va HAR BIRIDA raqam IKKI
          MARTA chiqardi ("154" ustida "154 a'zo") — ekranning yuqori uchdan
          biri hech qanday yangi ma'lumot bermaydigan matn bilan band edi.
          Endi bitta ixcham qator: raqam + sof yorliq. */}
      {/* COMM-TRIM-01: uchta alohida qator o'rniga bitta. "0 bugun" esa
          umuman ko'rsatilmaydi — bo'sh jamiyatni birinchi bo'lib e'lon
          qilish ayolni yozishga undamaydi, aksincha. */}
      {stats && (
        <p className="text-sm text-text-secondary">
          <span className="font-extrabold text-text-primary">{stats.totalMembers}</span> {dict.community.statsMembers}
          {" · "}
          <span className="font-extrabold text-text-primary">{stats.totalPosts}</span> {dict.community.statsPosts}
          {stats.postsToday > 0 && (
            <>
              {" · "}
              <span className="font-extrabold text-text-primary">{stats.postsToday}</span> {dict.community.statsToday}
            </>
          )}
        </p>
      )}

      {/* COMM-TRIM-02: moderatsiya ogohlantirishi endi ALOHIDA KULRANG
          QUTI emas, sarlavha ostidagi bitta kichik qator.
          Mazmuni saqlanib qoldi — bu yerdagi savollar tibbiy va noto'g'ri
          javob zarar keltirishi mumkin, shuning uchun ogohlantirishni
          butunlay olib tashlash mumkin emas edi. Lekin u har safar
          ekranning to'rtdan birini egallab turishi ham shart emas. */}
      <p className="-mt-2 text-xs leading-relaxed text-text-muted">{dict.community.moderationNotice}</p>

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

      {/* CLIPBOARD-01: "Ulashish" natijasi — ilgari hech qanday tasdiq yo'q edi. */}
      {shareFlash && <Toast message={shareFlash} tone={shareFlash === dict.common.errorGeneric ? "error" : "success"} />}

      {/* COMM-02: lenta yorliqlari. Ilgari faqat butun forum bor edi va ayol
          o'z savoliga javob kelganini bilish uchun uni qaytadan qidirishi
          kerak edi — savol bir necha soatdan keyin pastga tushib ketardi.
          Referensda ham aynan shu uchta yorliq bor. */}
      <div className="flex rounded-xl bg-surface-muted p-0.5">
        {(
          [
            { id: "all", label: dict.community.tabForum },
            { id: "mine", label: dict.community.tabMyQuestions },
            { id: "answered", label: dict.community.tabMyAnswers },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setScope(t.id)}
            className={clsx(
              // COMM-TRIM-02: balandligi kamaytirildi — `tap-target`
              // (48px) bu yerda ortiqcha edi, yorliq butun kenglikni
              // egallaydi va barmoq baribir tegadi.
              "flex-1 rounded-lg py-2 text-sm font-semibold transition",
              scope === t.id ? "bg-surface text-text-primary shadow-sm" : "text-text-secondary"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Mavzu filtri faqat BUTUN forumda ma'noli — "Savollarim"da ayolning
          o'z postlari kam va ularni yana filtrlash bo'sh ro'yxatga olib
          kelardi. */}
      {scope === "all" && (
        <div className="flex gap-2 overflow-x-auto pb-1 pt-2">
          <FilterChip active={tag === "all"} label={dict.community.filterAll} onClick={() => setTag("all")} />
          {TAGS.map((t) => (
            <FilterChip key={t} active={tag === t} label={dict.community.tags[t]} onClick={() => setTag(t)} />
          ))}
        </div>
      )}

      {postsLoadError ? (
        <ErrorState message={dict.common.errorGeneric} retry={{ label: dict.common.retryButton, onClick: () => loadPosts(tag, scope) }} />
      ) : !posts ? (
        <LoadingSpinner label={dict.common.loading} />
      ) : posts.length === 0 ? (
        <Card className="space-y-3 text-center text-sm text-text-secondary">
          {/* COMM-02: har yorliqning o'z bo'sh holati. Umumiy "post yo'q"
              matni "Savollarim"da noto'g'ri bo'lardi — forum to'la, shunchaki
              ayolning o'z savoli yo'q. */}
          <p>
            {scope === "mine"
              ? dict.community.emptyMyQuestions
              : scope === "answered"
                ? dict.community.emptyMyAnswers
                : tag === "all"
                  ? dict.community.emptyFeed
                  : dict.community.emptyFeedFiltered}
          </p>
          {scope === "all" && tag !== "all" && (
            <Button variant="ghost" onClick={() => setTag("all")}>
              {dict.community.viewAllButton}
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post, index) => {
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
                    onClick={() => setOpenPostId(post.id)}
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

      {/* COMM-01: post va izohlar uchun alohida ekran. Izoh maydoni pastga
          mahkamlangan — lentaning ichida ochilganda u ekran o'rtasida
          qolib, klaviatura ostida yo'qolib ketardi. */}
      {openPostId && posts?.find((p) => p.id === openPostId) && (
        <CommunityPostSheet
          post={posts.find((p) => p.id === openPostId)!}
          onClose={() => setOpenPostId(null)}
          onLike={() => toggleLike(posts.find((p) => p.id === openPostId)!)}
          onCommented={() =>
            setPosts((prev) =>
              (prev ?? []).map((p) => (p.id === openPostId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
            )
          }
        />
      )}

      {/* COMM-01: yangi post tugmasi endi SUZUVCHI. Ilgari u lentaning
          tepasida, to'liq kenglikdagi tugma edi — ayol pastga surilgach
          uni umuman ko'rmasdi. Referensdagi ikkala ilovada ham u doim
          ko'rinib turadi. Menyu balandligi HAQIQIY o'lchangan qiymatdan
          olinadi (BottomNav `--bottom-nav-height`ga yozadi). */}
      <button
        type="button"
        onClick={() => setComposerOpen(true)}
        aria-label={dict.community.writePostButton}
        className="tap-target fixed left-1/2 z-30 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition active:scale-95"
        style={{ bottom: "calc(var(--bottom-nav-height) + 12px)" }}
      >
        <Add sx={{ fontSize: 28 }} />
      </button>
    </div>
  );
}
